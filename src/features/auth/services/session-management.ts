import { supabase } from "@/integrations/supabase/client";
import {
  DeviceInfo,
  parseUserAgent,
  getClientIpAddress,
} from "@/features/auth/utils/device";

/**
 * Session Management Service
 * Handles tracking and managing user sessions across devices
 */
class SessionManagementService {
  /**
   * Create or update a session record when user signs in
   */
  async createSessionRecord(
    userId: string,
    sessionId: string,
    userAgent: string,
    isCurrentDevice: boolean = true,
  ): Promise<{ error: string | null }> {
    try {
      const deviceInfo = parseUserAgent(userAgent);
      const ipAddress = await getClientIpAddress();

      const { error } = await supabase.from("sessions").insert({
        user_id: userId,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        browser_name: deviceInfo.browserName,
        browser_version: deviceInfo.browserVersion,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
        is_current_device: isCurrentDevice,
        last_activity: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creating session record:", error);
        return { error: "Failed to create session record" };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error creating session record:", err);
      return { error: "Failed to create session record" };
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .order("last_activity", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        return { sessions: [], error: "Failed to fetch sessions" };
      }

      return { sessions: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error fetching sessions:", err);
      return { sessions: [], error: "Failed to fetch sessions" };
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("session_id", sessionId);

      if (error) {
        console.error("Error revoking session:", error);
        return { error: "Failed to revoke session" };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error revoking session:", err);
      return { error: "Failed to revoke session" };
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("revoked_at", null);

      if (error) {
        console.error("Error revoking all sessions:", error);
        return { error: "Failed to revoke all sessions" };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error revoking all sessions:", err);
      return { error: "Failed to revoke all sessions" };
    }
  }

  /**
   * Update last activity for a session
   */
  async updateSessionActivity(
    sessionId: string,
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("session_id", sessionId);

      if (error) {
        console.error("Error updating session activity:", error);
        return { error: "Failed to update session" };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating session activity:", err);
      return { error: "Failed to update session" };
    }
  }

  /**
   * Clean up old revoked sessions
   */
  async cleanupRevokedSessions(
    daysOld: number = 90,
  ): Promise<{ error: string | null }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from("sessions")
        .delete()
        .lt("revoked_at", cutoffDate.toISOString())
        .not("revoked_at", "is", null);

      if (error) {
        console.error("Error cleaning up sessions:", error);
        return { error: "Failed to cleanup sessions" };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error cleaning up sessions:", err);
      return { error: "Failed to cleanup sessions" };
    }
  }
}

export const sessionManagementService = new SessionManagementService();
