// src/config.js
// ✅ Completely avoid using process.env in browser code

const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Get current hostname
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // For Vercel production (frontend)
    if (hostname === 'aleyo-2-six.vercel.app') {
      return 'https://aleyo-2-1.onrender.com';
    }

    // For Render production (backend)
    if (hostname.includes('onrender.com')) {
      // If we're on Render, use the same host with https
      return `https://${hostname}`;
    }

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Use port 10000 as default for local backend
      const backendPort = '10000';
      return `http://${hostname}:${backendPort}`;
    }

    // For custom domains or other environments
    // Try to detect if we're in production
    if (protocol === 'https:') {
      // If site is served over HTTPS, try to use same domain for API
      // This is useful if frontend and backend are on the same domain
      return `${protocol}//${hostname}`;
    }
  }

  // Ultimate fallback - use Render production URL
  return 'https://aleyo-2-1.onrender.com';
};

// Function to get WebSocket URL if needed
export const getWsUrl = () => {
  const apiUrl = getApiUrl();
  // Convert http(s) to ws(s)
  return apiUrl.replace(/^http/, 'ws');
};

// Export API base URL
export const API_BASE = getApiUrl();

// Export helper to check if we're in production
export const isProduction = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  }
  return true;
};

// Export helper to get full API URL for a path
export const getFullApiUrl = (path) => {
  const base = getApiUrl();
  // Remove leading slash from path if it has one
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// Export environment detection
export const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('vercel.app')) {
      return 'vercel';
    }
    if (hostname.includes('onrender.com')) {
      return 'render';
    }
    return 'production';
  }
  return 'unknown';
};

// Export config object for easier imports
const config = {
  API_BASE: getApiUrl(),
  WS_URL: getWsUrl(),
  isProduction: isProduction(),
  environment: getEnvironment(),
  getFullApiUrl,
};

export default config;
