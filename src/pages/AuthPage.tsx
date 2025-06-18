import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import {
  EnhancedInput,
  EnhancedPasswordInput,
  EnhancedButton,
  FormField,
  AnimatedForm,
  Toast,
} from "@/components/enhanced";

interface SignInFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  fullName: string;
  email: string;
  age: string;
  password: string;
  confirmPassword: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    loading,
    error: authError,
    user,
    session,
  } = useAuth();

  const [isSignIn, setIsSignIn] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    console.log("AuthPage useEffect - user:", user);
    console.log("AuthPage useEffect - session:", session);
    console.log("AuthPage useEffect - loading:", loading);
    if (user && session && !loading) {
      console.log("AuthPage: User, session, and not loading. Navigating...");
      navigate("/content-selection");
    }
  }, [user, session, loading, navigate]);

  const [signInData, setSignInData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogoClick = () => {
    navigate("/");
  };

  const validateSignIn = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!signInData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!signInData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!signUpData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!signUpData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!signUpData.age) {
      newErrors.age = "Age is required";
    } else if (parseInt(signUpData.age) < 13) {
      newErrors.age = "You must be at least 13 years old";
    }

    if (!signUpData.password) {
      newErrors.password = "Password is required";
    } else if (signUpData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!validateSignIn()) {
      console.log("Sign-in validation failed:", errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setShowToast(false);

    try {
      console.log("Attempting sign-in with data:", {
        email: signInData.email,
        password: "***",
      });

      // Use the hook's signIn method which properly handles auth flow
      const result = await signIn(signInData.email, signInData.password);

      if (result.error) {
        console.error("Sign-in failed:", result.error);
        setErrors({ general: result.error });
        setShowToast(true);
      } else {
        console.log(
          "Sign-in successful, navigation will be handled by useEffect"
        );
        // Navigation is handled by useEffect when user/session state changes
      }
    } catch (error) {
      console.error("Unexpected sign-in error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrors({ general: errorMessage });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!validateSignUp()) {
      console.log("Sign-up validation failed:", errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);
    setShowToast(false);

    try {
      console.log("Attempting sign-up with data:", {
        email: signUpData.email,
        name: signUpData.fullName,
        age: signUpData.age,
        password: "***",
      });

      // Use the hook's signUp method which properly handles auth flow
      const result = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.fullName,
        parseInt(signUpData.age)
      );

      if (result.error) {
        console.error("Sign-up failed:", result.error);
        setErrors({ general: result.error });
        setShowToast(true);
      } else {
        console.log("Sign-up successful");
        // Check if email confirmation is required
        if (result.requiresEmailConfirmation) {
          setSuccessMessage(
            "Account created successfully! Please check your email and click the confirmation link to complete your registration."
          );
          setShowToast(true);
        } else {
          // Navigation will be handled by useEffect when user/session state changes
          console.log(
            "Account created and signed in, navigation will be handled by useEffect"
          );
        }
      }
    } catch (error) {
      console.error("Unexpected sign-up error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrors({ general: errorMessage });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForm = (showSignIn: boolean) => {
    setIsSignIn(showSignIn);
    setErrors({});
    setSuccessMessage(null);
    setShowToast(false);

    // Reset form data when switching
    if (showSignIn) {
      setSignUpData({
        fullName: "",
        email: "",
        age: "",
        password: "",
        confirmPassword: "",
      });
    } else {
      setSignInData({
        email: "",
        password: "",
      });
    }
  };

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      {/* Toast Notifications */}
      {showToast && (errors.general || authError) && !successMessage && (
        <Toast
          type="error"
          title="Authentication Error"
          message={errors.general || authError || "Authentication failed"}
          onClose={() => setShowToast(false)}
        />
      )}

      {showToast && successMessage && (
        <Toast
          type="success"
          title="Success!"
          message={successMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={handleLogoClick}
          className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          Smart Advisor
        </button>
        <span className="text-textSecondary text-[15px] font-normal cursor-pointer hover:text-textPrimary transition-colors duration-200">
          Need help?
        </span>
      </header>

      {/* Authentication Container */}
      <main className="flex items-center justify-center min-h-[calc(100vh-72px)] px-6">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          {/* Form Toggle */}
          <div className="flex gap-6 mb-8">
            <button
              onClick={() => toggleForm(true)}
              className={`text-2xl transition-all duration-300 ${
                isSignIn
                  ? "font-semibold text-textPrimary"
                  : "font-normal text-textTertiary hover:text-textSecondary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleForm(false)}
              className={`text-2xl transition-all duration-300 ${
                !isSignIn
                  ? "font-semibold text-textPrimary"
                  : "font-normal text-textTertiary hover:text-textSecondary"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg animate-in fade-in duration-500">
              <p className="text-green-500 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Sign In Form */}
          {isSignIn && (
            <AnimatedForm stagger={true}>
              <form onSubmit={handleSignIn}>
                <FormField label="Email" required error={errors.email}>
                  <EnhancedInput
                    type="email"
                    name="email"
                    id="sign-in-email"
                    value={signInData.email}
                    onChange={(e) =>
                      setSignInData({ ...signInData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    error={errors.email}
                    autoComplete="email"
                  />
                </FormField>

                <FormField label="Password" required error={errors.password}>
                  <EnhancedPasswordInput
                    name="password"
                    id="sign-in-password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({ ...signInData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    error={errors.password}
                    autoComplete="current-password"
                  />
                </FormField>

                <EnhancedButton
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full mt-8"
                >
                  Sign In
                </EnhancedButton>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-textSecondary text-sm hover:text-textPrimary transition-colors duration-200 enhanced-button"
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-textSecondary text-sm">
                    Don't have an account?{" "}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleForm(false)}
                    className="text-appAccent text-sm hover:underline transition-all duration-200 enhanced-button"
                    disabled={isSubmitting}
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </AnimatedForm>
          )}

          {/* Sign Up Form */}
          {!isSignIn && (
            <AnimatedForm stagger={true}>
              <form onSubmit={handleSignUp}>
                <FormField label="Full Name" required error={errors.fullName}>
                  <EnhancedInput
                    type="text"
                    name="fullName"
                    id="sign-up-name"
                    value={signUpData.fullName}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                    error={errors.fullName}
                    autoComplete="name"
                  />
                </FormField>

                <FormField label="Email" required error={errors.email}>
                  <EnhancedInput
                    type="email"
                    name="email"
                    id="sign-up-email"
                    value={signUpData.email}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    error={errors.email}
                    autoComplete="email"
                  />
                </FormField>

                <FormField label="Age" required error={errors.age}>
                  <EnhancedInput
                    type="number"
                    name="age"
                    id="sign-up-age"
                    value={signUpData.age}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, age: e.target.value })
                    }
                    placeholder="18"
                    min="13"
                    max="120"
                    disabled={isSubmitting}
                    error={errors.age}
                    className="w-[120px]"
                    autoComplete="age"
                  />
                  <p className="text-textTertiary text-xs mt-1">
                    Required for age-appropriate recommendations
                  </p>
                </FormField>

                <FormField label="Password" required error={errors.password}>
                  <EnhancedPasswordInput
                    name="password"
                    id="sign-up-password"
                    value={signUpData.password}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                </FormField>

                <FormField
                  label="Confirm Password"
                  required
                  error={errors.confirmPassword}
                >
                  <EnhancedPasswordInput
                    name="confirmPassword"
                    id="sign-up-confirm-password"
                    value={signUpData.confirmPassword}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm your password"
                    disabled={isSubmitting}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                </FormField>

                <EnhancedButton
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full mt-8"
                >
                  Create Account
                </EnhancedButton>

                <div className="mt-4 text-center">
                  <span className="text-textSecondary text-sm">
                    Already have an account?{" "}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleForm(true)}
                    className="text-appAccent text-sm hover:underline transition-all duration-200 enhanced-button"
                    disabled={isSubmitting}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </AnimatedForm>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
