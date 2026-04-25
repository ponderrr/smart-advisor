/**
 * Session and Device Management Utilities
 * Parse user agent and device information
 */

export interface DeviceInfo {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect device type
  const isPhone = /iphone|android|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet =
    /ipad|android(?!.*mobile)|android.*tablet|silk(?!.*mobile)|playbook|tablet|kindle|nexus 7|nexus 10|xoom/i.test(
      ua,
    );

  const deviceType: "desktop" | "mobile" | "tablet" = isTablet
    ? "tablet"
    : isPhone
      ? "mobile"
      : "desktop";

  // Detect browser
  let browserName = "Unknown";
  let browserVersion = "0";

  if (/edg\//i.test(ua)) {
    browserName = "Edge";
    browserVersion = ua.match(/edg\/(\d+)/)?.[1] || "0";
  } else if (/firefox/i.test(ua)) {
    browserName = "Firefox";
    browserVersion = ua.match(/firefox\/(\d+)/)?.[1] || "0";
  } else if (/chrome/i.test(ua) && !ua.includes("edge")) {
    browserName = "Chrome";
    browserVersion = ua.match(/chrome\/(\d+)/)?.[1] || "0";
  } else if (/safari/i.test(ua)) {
    browserName = "Safari";
    browserVersion = ua.match(/version\/(\d+)/)?.[1] || "0";
  } else if (/opera|opr\//i.test(ua)) {
    browserName = "Opera";
    browserVersion = ua.match(/(?:opera|opr)\/(\d+)/)?.[1] || "0";
  }

  // Detect OS
  let osName = "Unknown";
  let osVersion = "0";

  if (/windows|win32/i.test(ua)) {
    osName = "Windows";
    if (/windows nt 10/i.test(ua)) osVersion = "10";
    else if (/windows nt 6\.3/i.test(ua)) osVersion = "8.1";
    else if (/windows nt 6\.2/i.test(ua)) osVersion = "8";
  } else if (/mac|osx|darwin/i.test(ua)) {
    osName = "macOS";
    osVersion = ua.match(/os x (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "0";
  } else if (/linux/i.test(ua)) {
    osName = "Linux";
    osVersion = "0";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    osName = "iOS";
    osVersion = ua.match(/os (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "0";
  } else if (/android/i.test(ua)) {
    osName = "Android";
    osVersion = ua.match(/android (\d+[._]\d+)?/)?.[1] || "0";
  }

  const deviceName = `${browserName} on ${osName}`;

  return {
    deviceName,
    deviceType,
    browserName,
    browserVersion,
    osName,
    osVersion,
  };
}

/**
 * Format device info for display
 */
export function formatDeviceInfo(device: DeviceInfo): string {
  return `${device.browserName} ${device.browserVersion} on ${device.osName}`;
}

/**
 * Get current device info from navigator
 */
export function getCurrentDeviceInfo(): DeviceInfo | null {
  if (typeof navigator === "undefined") return null;
  return parseUserAgent(navigator.userAgent);
}

/**
 * Get client IP address from various sources
 * Note: This is a simplified approach; for accurate IPs, you'd need server-side detection
 */
export async function getClientIpAddress(): Promise<string | null> {
  try {
    // Try using a public API to get IP
    const response = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
      mode: "cors",
    });
    const data = await response.json();
    return data.ip || null;
  } catch {
    // Fallback: return null if unable to fetch
    return null;
  }
}

/**
 * Highlight current device in session list
 */
export function isCurrentDevice(sessionUserAgent: string): boolean {
  if (typeof navigator === "undefined") return false;
  // Simple comparison - in production, you'd want more robust matching
  return navigator.userAgent === sessionUserAgent;
}

/**
 * Format timestamp for display
 */
export function formatLastActivity(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
