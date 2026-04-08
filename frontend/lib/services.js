/**
 * Telehealth Platform – API services
 * ES6, fetch-based client for Node.js/Express backend.
 * Default "/api" uses Vite proxy (dev) or same-origin (prod). Override with VITE_API_URL for full URL.
 */

const API_BASE = import.meta.env?.VITE_API_URL ?? "/api";

const getToken = () => localStorage.getItem("token");

/**
 * Low-level request helper. Uses fetch, sends JSON, attaches auth header, parses JSON, throws on error.
 * @param {string} endpoint - Path relative to API_BASE (e.g. '/auth/login')
 * @param {RequestInit} options - fetch options (method, body, headers)
 * @returns {Promise<object>} - Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE.replace(/\/$/, "")}${endpoint}`;
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("NetworkError")) {
      throw new Error("Backend connection failed. Make sure the backend is running (e.g. npm run dev in backend folder).");
    }
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data;
}

// ---------------------------------------------------------------------------
// 1. User login
// ---------------------------------------------------------------------------

/**
 * User login.
 * @param {object} credentials - { email, password }
 * @returns {Promise<{ success, token, user }>}
 */
export async function login(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email and password are required");
  }
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// ---------------------------------------------------------------------------
// 2. User registration
// ---------------------------------------------------------------------------

/**
 * User registration.
 * @param {object} userData - { email, password, name, role? }
 * @returns {Promise<{ success, token, user }>}
 */
export async function register(userData) {
  if (!userData?.email || !userData?.password || !userData?.name) {
    throw new Error("Email, password and name are required");
  }
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// ---------------------------------------------------------------------------
// 3. Get doctors list
// ---------------------------------------------------------------------------

/**
 * Get list of doctors.
 * @returns {Promise<{ success, data: Array }>}
 */
export async function getDoctorsList() {
  const data = await request("/users?role=doctor");
  return data;
}

// ---------------------------------------------------------------------------
// 4. Book appointment
// ---------------------------------------------------------------------------

/**
 * Book an appointment.
 * @param {object} appointment - { patientId, doctorId, date, time, type?, notes? }
 * @returns {Promise<{ success, data }>}
 */
export async function bookAppointment(appointment) {
  if (!appointment?.patientId || !appointment?.doctorId || !appointment?.date || !appointment?.time) {
    throw new Error("patientId, doctorId, date and time are required");
  }
  return request("/appointments", {
    method: "POST",
    body: JSON.stringify(appointment),
  });
}

// ---------------------------------------------------------------------------
// 5. Get user appointments
// ---------------------------------------------------------------------------

/**
 * Get appointments for a user (as patient or doctor).
 * @param {object} params - { patientId?, doctorId?, status?, from?, to? }
 * @returns {Promise<{ success, data: Array }>}
 */
export async function getUserAppointments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/appointments${query ? `?${query}` : ""}`);
}

// ---------------------------------------------------------------------------
// Service objects (for components that prefer authService.login etc.)
// ---------------------------------------------------------------------------

export const authService = {
  login,
  register,
  getMe: () => request("/auth/me"),
};

export const doctorsService = {
  getDoctorsList,
};

export const appointmentService = {
  bookAppointment,
  getUserAppointments,
  getAll: (params) => getUserAppointments(params),
  create: (data) => bookAppointment(data),
  getById: (id) => request(`/appointments/${id}`),
  update: (id, data) => request(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/appointments/${id}`, { method: "DELETE" }),
};

export const userService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ""}`);
  },
  getById: (id) => request(`/users/${id}`),
};

// Recordings (for video call recording upload and list)
const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export const recordingService = {
  list: (params = {}) => {
    const safeParams = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    const query = new URLSearchParams(safeParams).toString();
    return api.get(`/recordings${query ? `?${query}` : ""}`);
  },
  getById: (id) => api.get(`/recordings/${id}`),
  /** URL for <video src>. Appends JWT in query because browsers do not send Authorization on media loads. */
  getFileUrl: (id) => {
    const rid = encodeURIComponent(String(id));
    const base = `${API_BASE.replace(/\/$/, "")}/recordings/${rid}/file`;
    const token = getToken();
    if (!token) return base;
    return `${base}?token=${encodeURIComponent(token)}`;
  },
  upload: async (formData) => {
    const token = getToken();
    const url = `${API_BASE.replace(/\/$/, "")}/recordings/upload`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
    } catch (err) {
      throw new Error("Backend connection failed. Make sure the backend is running (e.g. npm run dev in backend folder).");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || res.statusText || "Upload failed");
    return data;
  },
};

export default {
  login,
  register,
  getDoctorsList,
  bookAppointment,
  getUserAppointments,
  authService,
  doctorsService,
  appointmentService,
  userService,
  recordingService,
};
