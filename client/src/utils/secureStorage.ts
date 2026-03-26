/**
 * NOTE: Auth tokens are stored exclusively in httpOnly cookies managed by the server.
 * This module is intentionally a no-op stub — client-side token storage is not needed.
 * The active secureStorage object (for CSRF tokens in memory) lives in services/api.ts.
 */

class SecureStorage {
  private static instance: SecureStorage;

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  clearTokens(): void {
    // Tokens live in httpOnly cookies — server clears them on logout.
    // Clear any legacy sessionStorage entries that may have been set by old code.
    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token_expires');
      sessionStorage.removeItem('refresh_expires');
      sessionStorage.removeItem('user_session');
    } catch {
      // sessionStorage may not be available (SSR, sandboxed iframe, etc.)
    }
  }
}

export default SecureStorage.getInstance();
