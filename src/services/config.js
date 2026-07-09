// src/config.js
// ✅ Completely avoid using process.env in browser code

const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Get current hostname
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // ✅ ADDED: Check for environment variable first (for Vercel/Netlify)
    // This allows overriding via window._env_ (for runtime env injection)
    if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_API_URL) {
      return window._env_.REACT_APP_API_URL;
    }

    // ✅ FIXED: For Vercel production (frontend)
    if (hostname === 'aleyo-2-six.vercel.app') {
      return 'https://aleyo-2-1.onrender.com';
    }

    // ✅ FIXED: For Render production (backend)
    if (hostname.includes('onrender.com')) {
      // If we're on Render, use the same host with https
      return `https://${hostname}`;
    }

    // ✅ ADDED: For local development with custom port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Check if a specific port is being used
      const backendPort = port || '10000';
      
      // If we're on a specific port like 3000, try to use 10000 for backend
      if (port === '3000' || port === '3001' || port === '5173') {
        return 'http://localhost:10000';
      }
      
      return `http://${hostname}:${backendPort}`;
    }

    // ✅ ADDED: For custom domains or subdomains
    // If we're on a custom domain, try to use the same domain with https
    if (protocol === 'https:') {
      // If site is served over HTTPS, try to use same domain for API
      // This is useful if frontend and backend are on the same domain
      return `${protocol}//${hostname}`;
    }
  }

  // ✅ FIXED: Ultimate fallback - use Render production URL
  return 'https://aleyo-2-1.onrender.com';
};

// ✅ ADDED: Function to get API URL with timeout detection
const getApiUrlWithTimeout = async (timeout = 3000) => {
  const urls = [
    'https://aleyo-2-1.onrender.com',
    window?.location?.hostname ? `https://${window.location.hostname}` : null,
    'http://localhost:10000'
  ].filter(Boolean);

  // Try each URL to find one that works
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Backend found at: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ Backend not available at: ${url}`);
      continue;
    }
  }

  // Fallback to default
  console.warn('⚠️ No backend found, using default URL');
  return 'https://aleyo-2-1.onrender.com';
};

// Function to get WebSocket URL if needed
export const getWsUrl = () => {
  const apiUrl = getApiUrl();
  // Convert http(s) to ws(s)
  return apiUrl.replace(/^http/, 'ws');
};

// ✅ ADDED: Function to get the API URL with fallback
export const getApiBase = () => {
  // Try to get from window first (for runtime config)
  if (typeof window !== 'undefined') {
    // Check for env variable injected at build time
    if (window._env_ && window._env_.REACT_APP_API_URL) {
      return window._env_.REACT_APP_API_URL;
    }
    
    // Check for manually set global
    if (window.API_BASE_URL) {
      return window.API_BASE_URL;
    }
  }
  
  return getApiUrl();
};

// Export API base URL
export const API_BASE = getApiBase();

// Export helper to check if we're in production
export const isProduction = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168.');
  }
  return true;
};

// Export helper to get full API URL for a path
export const getFullApiUrl = (path) => {
  const base = getApiBase();
  // Remove leading slash from path if it has one
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// Export environment detection
export const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('vercel.app')) {
      return 'vercel';
    }
    if (hostname.includes('onrender.com')) {
      return 'render';
    }
    if (protocol === 'https:') {
      return 'production';
    }
    return 'staging';
  }
  return 'unknown';
};

// ✅ ADDED: Log environment for debugging
export const logEnvironment = () => {
  const env = getEnvironment();
  const apiUrl = API_BASE;
  console.log(`🌍 Environment: ${env}`);
  console.log(`🔗 API Base URL: ${apiUrl}`);
  console.log(`📡 WebSocket URL: ${getWsUrl()}`);
  console.log(`🏷️ Production: ${isProduction()}`);
  return { env, apiUrl };
};

// ✅ ADDED: Check if the API is reachable
export const checkApiHealth = async (timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { healthy: true, data, url: API_BASE };
    }
    
    return { healthy: false, status: response.status, url: API_BASE };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message, 
      url: API_BASE,
      suggestion: getConnectionSuggestion()
    };
  }
};

// ✅ ADDED: Get connection troubleshooting suggestions
export const getConnectionSuggestion = () => {
  const env = getEnvironment();
  const suggestions = {
    development: [
      '✅ Make sure your backend is running: npm run dev:backend or python main.py',
      '✅ Check if backend is on port 10000',
      '✅ Verify CORS is configured for localhost:3000',
      '✅ Check backend logs for errors'
    ],
    vercel: [
      '✅ Set REACT_APP_API_URL environment variable in Vercel dashboard',
      '✅ Make sure backend is deployed and running on Render',
      '✅ Check Render logs for any startup errors',
      '✅ Verify CORS allows requests from your Vercel domain'
    ],
    render: [
      '✅ Backend and frontend are on same Render domain',
      '✅ Check if both services are running',
      '✅ Verify the URL path is correct'
    ],
    production: [
      '✅ Check if backend service is running',
      '✅ Verify the API URL is correct',
      '✅ Check CORS configuration',
      '✅ Look for any network blocks or firewalls'
    ]
  };
  
  return suggestions[env] || suggestions.production;
};

// ✅ ADDED: Auto-detect the correct API URL at runtime
export const autoDetectApiUrl = async () => {
  // Try common URLs for your setup
  const possibleUrls = [
    'https://aleyo-2-1.onrender.com',
    window?.location?.hostname ? `https://${window.location.hostname}` : null,
    'http://localhost:10000',
    'http://localhost:8000'
  ].filter(Boolean);

  // Remove duplicates
  const uniqueUrls = [...new Set(possibleUrls)];
  
  console.log('🔍 Auto-detecting API URL...');
  
  for (const url of uniqueUrls) {
    try {
      console.log(`⏳ Testing: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Found working API at: ${url}`);
        // Store the found URL for future use
        if (typeof window !== 'undefined') {
          window._detected_api_url = url;
        }
        return url;
      }
    } catch (error) {
      console.log(`❌ Failed: ${url} - ${error.message}`);
      continue;
    }
  }
  
  console.warn('⚠️ No working API found, using default');
  return 'https://aleyo-2-1.onrender.com';
};

// ✅ FIXED: Export config object for easier imports
const config = {
  API_BASE: API_BASE,
  WS_URL: getWsUrl(),
  isProduction: isProduction(),
  environment: getEnvironment(),
  getFullApiUrl,
  getApiBase,
  getApiUrl,
  checkApiHealth,
  logEnvironment,
  autoDetectApiUrl,
  getConnectionSuggestion,
  // For testing/debugging
  _setApiBase: (url) => {
    if (typeof window !== 'undefined') {
      window._api_base_override = url;
    }
  }
};

// ✅ ADDED: Auto-log environment on import (in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('📋 Config loaded:', {
    API_BASE: config.API_BASE,
    environment: config.environment,
    isProduction: config.isProduction
  });
}

export default config;
