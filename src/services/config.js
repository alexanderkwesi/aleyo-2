// src/config.js
// ✅ Safe environment variable handling for browser
const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // For Vercel production
    if (window.location.hostname === 'aleyo-2-six.vercel.app') {
      return 'https://aleyo-2-1.onrender.com';
    }
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:10000';
    }
  }
  
  // Fallback
  return 'https://aleyo-2-1.onrender.com';
};

// Try to get from environment (for build time)
const envUrl = typeof process !== 'undefined' && process.env 
  ? process.env.REACT_APP_API_URL 
  : null;

export const API_BASE = envUrl || getApiUrl();

// App configuration
export const APP_CONFIG = {
  name: 'Aleyo',
  version: '1.0.0',
  apiBase: API_BASE,
};
