# Complete Authentication Flow Implementation Guide

## Overview

This document describes the complete authentication system implemented for the Smart Advisor application, including:

- **Signup & Signin**: Email/password authentication with debouncing and error handling
- **MFA (TOTP)**: Two-factor authentication using authenticator apps
- **Session Management**: Track and manage active sessions across devices
- **Security**: Rate limiting protection, email normalization, and session tracking

## Architecture

### Core Services

#### `auth-service.ts`

Main authentication service providing all auth operations:

```typescript
// Signup with debouncing to prevent rate limit errors
authService.signUp(email, password, name, age);

// Signin with automatic profile creation and session tracking
authService.signIn(email, password);

// MFA enrollment and verification
authService.enrollMFA(); // Returns QR code and secret
authService.verifyMFA(factorId, code);
authService.unenrollMFA(factorId);
authService.listMFAFactors();

// Session management
authService.signOutAllDevices();
```

#### `session-management.ts`

Handles session tracking and device management:

```typescript
sessionManagementService.createSessionRecord(userId, sessionId, userAgent);
sessionManagementService.getActiveSessions(userId);
sessionManagementService.revokeSession(sessionId);
sessionManagementService.revokeAllSessions(userId);
```

### Validation & Device Utils

#### `validation.ts`

- Email normalization and validation
- Password strength validation
- Debounce function to prevent rate limit errors

#### `device.ts`

- User agent parsing to extract device info
- Device type detection (desktop/mobile/tablet)
- Browser and OS detection
- Device info formatting for display

## Database Schema

### `profiles` table (extended)

- `mfa_enabled` (boolean): Whether MFA is active
- `last_login` (timestamp): Last successful signin

### `mfa_factors` table

Tracks MFA enrollments:

- `factor_type`: "totp" or "phone"
- `factor_id`: Supabase factor ID
- `is_verified`: Whether factor is active
- `enrolled_at`, `last_used_at`, `deleted_at`

### `sessions` table

Tracks all active sessions:

- Device info: `device_name`, `browser_name`, `os_name`, etc.
- Session metadata: `ip_address`, `user_agent`, `last_activity`
- Revocation: `revoked_at` (NULL = active)

## Features

### 1. Signup & Signin

#### Features:

- ✅ Email normalization (trim, lowercase)
- ✅ Password validation (min 8 chars)
- ✅ Debounced signup to prevent HTTP 429 errors (1 second delay)
- ✅ Debounced signin (500ms delay)
- ✅ Automatic profile creation
- ✅ User-friendly error messages
- ✅ Session tracking on signin
- ✅ Last login timestamp
- ✅ Password recovery email redirects to a dedicated reset page (`/auth/reset-password`) instead of the generic signin flow

#### Usage:

```typescript
const { signIn, signUp, error, loading } = useAuth();

// Sign up
await signUp(email, password, name, age);

// Sign in with optional 30-day remember
await signIn(email, password, rememberFor30Days);
```

### 2. Two-Factor Authentication (MFA/TOTP)

> **Note:** Make sure Multi-factor Authentication is enabled in your Supabase project's **Authentication → Settings → Multi-factor authentication** panel, and that TOTP (App Authenticator) factors are permitted. Our implementation currently only handles TOTP.

#### Features:

- ✅ QR code generation for authenticator apps
- ✅ Manual secret display (for manual entry)
- ✅ 6-digit code verification
- ✅ Support for Google Authenticator, Authy, Microsoft Authenticator
- ✅ Factor tracking in database
- ✅ MFA status in user profile
- ✅ Enrollment and unenrollment

#### Pages & Components:

- `MfaSetup`: Component for enrolling MFA
  - Step 1: Intro
  - Step 2: Display QR code and secret
  - Step 3: Verify 6-digit code
- `MfaManagement`: Component for managing enrolled factors
- `/account/mfa-setup`: Full enrollment page
- `/account/security`: Security dashboard

#### Usage:

```typescript
const { enrollMFA, verifyMFA, unenrollMFA, listMFAFactors } = useAuth();

// Start enrollment
const { data: enrollment, error } = await enrollMFA();
// data.totp.qr_code: QR code image
// data.totp.secret: Manual entry secret
// data.id: Factor ID for verification

// Verify code
const { data: verified, error } = await verifyMFA(factorId, "000000");

// Unenroll
await unenrollMFA(factorId);

// List active factors
const { data: factors, error } = await listMFAFactors();
```

### 3. Active Sessions Management

#### Features:

- ✅ List all active sessions per user
- ✅ Device info extraction from user agent
- ✅ Browser/OS detection
- ✅ IP address detection (optional, requires privacy consideration)
- ✅ Last activity tracking
- ✅ Highlight current device
- ✅ Sign out individual devices
- ✅ Sign out all devices globally
- ✅ Session revocation

#### Pages & Components:

- `SessionsManagement`: Component listing all sessions
  - Shows device info, last activity, IP
  - Sign out individual or all devices
- `/account/security`: Integrated into security dashboard

#### Usage:

```typescript
const { signOutAllDevices } = useAuth();

// Create session on signin (automatic)
sessionManagementService.createSessionRecord(userId, sessionId, userAgent);

// Get active sessions
const { sessions, error } =
  await sessionManagementService.getActiveSessions(userId);

// Revoke specific session
await sessionManagementService.revokeSession(sessionId);

// Sign out all devices
await signOutAllDevices();
```

### 4. Error Handling

User-friendly error messages for:

- Rate limiting: "Too many attempts right now. Please wait a moment..."
- Invalid credentials: "Invalid email or password. Please try again."
- Email not confirmed: "Please verify your email before signing in."
- Expired links: "That email link has expired. Please request a new one."
- MFA errors: "Invalid authentication code. Please try again."
- Session errors: "Your session expired. Please sign in again."

## Implementation Details

### Email & Data Normalization

```typescript
import { normalizeEmail, isValidEmail } from "@/features/auth/utils/validation";

const email = normalizeEmail("  USER@EXAMPLE.COM  ");
// Result: "user@example.com"
```

### Device Detection

```typescript
import {
  parseUserAgent,
  formatDeviceInfo,
  getCurrentDeviceInfo,
} from "@/features/auth/utils/device";

const deviceInfo = parseUserAgent(navigator.userAgent);
// Result: {
//   deviceName: "Chrome on Windows",
//   deviceType: "desktop",
//   browserName: "Chrome",
//   browserVersion: "120",
//   osName: "Windows",
//   osVersion: "10"
// }

const formatted = formatDeviceInfo(deviceInfo);
// Result: "Chrome 120 on Windows"
```

### Rate Limiting (Debounce)

Signup requests are debounced with a 1-second delay to prevent HTTP 429 errors:

```typescript
// Internally debounced in authService
const result = await authService.signUp(email, password, name, age);
// First call at T=0 executes immediately
// Subsequent calls within 1s are batched
// Call at T=1500ms executes
```

## UI Components & Pages

### Pages Created

1. **`/account/security`** - Main security dashboard
   - View MFA status
   - Manage authenticators
   - View all active sessions
   - Sign out devices
   - Security tips

2. **`/account/mfa-setup`** - MFA enrollment flow
   - Beautiful MFA setup wizard
   - Step-by-step guidance
   - QR code and secret display
   - Code verification

### Components Created

1. **`MfaSetup`** - Enrollment component
2. **`MfaManagement`** - Factor management component
3. **`SessionsManagement`** - Session listing component

## Security Best Practices Implemented

✅ **Email Normalization**: Prevents duplicate accounts from different casings
✅ **Password Requirements**: Minimum 8 characters enforced
✅ **Rate Limiting**: Debouncing prevents HTTP 429 errors
✅ **Session Tracking**: All sessions logged with device info
✅ **MFA Support**: TOTP-based 2FA for account protection
✅ **Soft Deletes**: MFA factors track deletion history
✅ **Row-Level Security**: Database policies ensure users only see their data
✅ **Error Messages**: User-friendly without leaking sensitive info
✅ **Last Login Tracking**: Monitor account access patterns
✅ **Global Signout**: Revoke all sessions instantly if needed

## Usage Examples

### Complete Signup Flow

```typescript
import { useAuth } from '@/features/auth/hooks/use-auth';

export function SignupPage() {
  const { signUp, error, loading } = useAuth();

  const handleSignup = async (email: string, password: string, name: string, age: number) => {
    const result = await signUp(email, password, name, age);
    if (result.error) {
      // Error already user-friendly
      console.log(result.error);
    } else {
      // Success - redirect to login
      router.push('/auth');
    }
  };

  return <AuthForm onSignUp={handleSignup} loading={loading} error={error} />;
}
```

### Complete Signin Flow with Sessions

```typescript
const handleSignin = async (
  email: string,
  password: string,
  remember: boolean,
) => {
  const { error } = await signIn(email, password, remember);
  if (!error) {
    // Session automatically created by auth service
    router.push("/dashboard");
  }
};
```

### Manage MFA

```typescript
export function MfaSettings() {
  const { enrollMFA, verifyMFA, unenrollMFA, user } = useAuth();

  return (
    <>
      <MfaSetup onComplete={() => refetch()} />
      <MfaManagement mfaEnabled={user.mfa_enabled} />
    </>
  );
}
```

### View Sessions

```typescript
export function SessionsPage() {
  const { user, signOutAllDevices } = useAuth();

  return (
    <SessionsManagement
      userId={user.id}
    />
  );
}
```

## Environment Setup

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Testing Notes

### Test Cases to Verify

1. **Signup**
   - ✓ Email normalization works
   - ✓ Debouncing prevents rapid requests
   - ✓ Error messages are user-friendly
   - ✓ Profile is created automatically

2. **Signin**
   - ✓ Session is tracked
   - ✓ Last login is updated
   - ✓ Device info is captured

3. **MFA**
   - ✓ QR code displays
   - ✓ Manual secret can be copied
   - ✓ Verification code accepted
   - ✓ Factor is marked verified
   - ✓ Profile MFA status updated

4. **Sessions**
   - ✓ All sessions listed
   - ✓ Device info accurate
   - ✓ Sign out individual device works
   - ✓ Sign out all devices works
   - ✓ Revoked sessions no longer appear

## Troubleshooting

### Issue: "Too many requests" errors during signup

**Solution**: Debouncing is automatic (1-second delay). This is normal during testing.

### Issue: MFA QR code not displaying

**Solution**: Check that Supabase auth has TOTP enabled. Verify browser allows clipboard access.

### Issue: Session not created

**Solution**: Ensure `navigator` is available (client-side only). Check session-management service logs.

### Issue: MFA enrollment fails

**Solution**: Ensure user is authenticated. Check that `mfa_factors` table has proper RLS policies.

## Future Enhancements

Possible additions:

- [ ] SMS-based MFA (Twilio integration)
- [ ] Backup codes for MFA recovery
- [ ] Device fingerprinting
- [ ] Geolocation-based alerts
- [ ] Session activity logs
- [ ] Login notifications/alerts
- [ ] Account recovery options

## API Reference

See the individual service files for complete API documentation:

- [auth-service.ts](/src/features/auth/services/auth-service.ts)
- [session-management.ts](/src/features/auth/services/session-management.ts)
- [use-auth.tsx](/src/features/auth/hooks/use-auth.tsx)
