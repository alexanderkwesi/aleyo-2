// src/config.js
export const API_BASE = process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com';

export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    return { healthy: response.ok };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

export default { API_BASE, checkApiHealth };
