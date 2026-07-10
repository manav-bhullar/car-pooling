const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

class ApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshPromise = null;
    this.onAuthError = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  setAuthErrorHandler(handler) {
    this.onAuthError = handler;
  }

  async fetch(url, options = {}) {
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      defaultHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include", // Important for sending/receiving refresh token cookies
    };

    let response = await window.fetch(`${BASE_URL}${url}`, config);

    // If 401 Unauthorized, try to refresh token
    if (
      response.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/refresh-token")
    ) {
      try {
        const newAccessToken = await this.refreshToken();
        if (newAccessToken) {
          // Retry original request with new token
          config.headers["Authorization"] = `Bearer ${newAccessToken.accessToken}`;
          response = await window.fetch(`${BASE_URL}${url}`, config);
        }
      } catch (err) {
        // Refresh failed, user needs to login again
        if (this.onAuthError) {
          this.onAuthError();
        }
      }
    }

    return response;
  }

  async refreshToken() {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const res = await window.fetch(`${BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        });

        const json = await res.json();
        if (json.success && json.data.accessToken) {
          this.setAccessToken(json.data.accessToken);
          if (json.data.refreshToken) {
            localStorage.setItem("refreshToken", json.data.refreshToken);
          }
          return {
            accessToken: json.data.accessToken,
            refreshToken: json.data.refreshToken,
          };
        }
        throw new Error("Refresh failed");
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const apiClient = new ApiClient();
