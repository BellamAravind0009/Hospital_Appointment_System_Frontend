import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token for all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = async (credentials) => {
  return await API.post("login/", credentials);
};

export const register = async (userData) => {
  return await API.post("register/", userData);
};

// Appointment APIs
export const bookAppointment = async (appointmentData) => {
  return await API.post("appointments/create/", appointmentData);
};

export const fetchAppointments = async () => {
  return await API.get("appointments/view/");
};

export const updateAppointment = async (appointmentData) => {
  return await API.put("appointments/update/", appointmentData);
};

// Payment APIs
export const createOrder = async (paymentData) => {
  return await API.post("create-order/", paymentData);
};

export const verifyPayment = async (paymentData) => {
  return await API.post("verify-payment/", paymentData);
};

// Profile Management APIs
export const fetchProfiles = async () => {
  return await API.get("profiles/");
};

export const createProfile = async (profileData) => {
  return await API.post("profiles/", profileData);
};

export const updateProfile = async (profileName, profileData) => {
  return await API.put(`profiles/${profileName}/`, profileData);
};

export const deleteProfile = async (profileName) => {
  return await API.delete(`profiles/${profileName}/`);
};

export const getProfileForAppointment = async (profileName) => {
  return await API.get(`profiles/appointment/${profileName}/`);
};


export const cancelAppointment = async (appointmentId) => {
  return await API.delete(`appointments/cancel/${appointmentId}/`);
};


export default API;