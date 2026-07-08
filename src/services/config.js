// src/config.js
export const getApiUrl = () => {
  // Check if process exists (for browser environment)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production fallback for Vercel
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'aleyo-2-six.vercel.app') {
    return 'https://aleyo-2-1.onrender.com';
  }
  
  // Development fallback
  return 'http://localhost:10000';
};

export const API_BASE = getApiUrl();
