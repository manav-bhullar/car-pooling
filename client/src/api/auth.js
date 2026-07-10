import { apiClient } from "./apiClient";

export async function registerUser(data) {
  const res = await apiClient.fetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!json.success) throw { status: res.status, message: json.error?.message };
  return json.data;
}

export async function loginUser(email, password) {
  const res = await apiClient.fetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message,
      needsVerification: json.error?.needsVerification,
    };
  }
  return json.data;
}

export async function verifyEmail(email, otp) {
  const res = await apiClient.fetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

  const json = await res.json();
  if (!json.success) throw { status: res.status, message: json.error?.message };
  return json.data;
}

export async function resendOtp(email) {
  const res = await apiClient.fetch("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!json.success) throw { status: res.status, message: json.error?.message };
  return json.data;
}

export async function logoutUser() {
  const storedRefreshToken = localStorage.getItem("refreshToken");
  const res = await apiClient.fetch("/auth/logout", { 
    method: "POST",
    body: JSON.stringify({ refreshToken: storedRefreshToken })
  });
  const json = await res.json();
  if (!json.success) throw { status: res.status, message: json.error?.message };
  return json.data;
}

export async function getMe() {
  const res = await apiClient.fetch("/auth/me");
  const json = await res.json();
  if (!json.success) throw { status: res.status, message: json.error?.message };
  return json.data;
}
