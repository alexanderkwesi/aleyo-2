// src/config.js
// ✅ Completely avoid using process.env in browser code

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

export const API_BASE = getApiUrl();
