// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// Decode a JWT's payload without verifying the signature (verification happens
// server-side; this is only used client-side to know when the token expires).
const decodeTokenExpiry = (jwt) => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch (e) {
    console.error('Failed to decode token expiry:', e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    console.log('AuthContext init - storedToken:', storedToken ? 'exists' : 'null');
    console.log('AuthContext init - userData:', userData ? 'exists' : 'null');

    if (storedToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setToken(storedToken);
        setUser(parsedUser);
        setSessionExpiry(decodeTokenExpiry(storedToken));
        console.log('User restored from localStorage:', parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    console.log('=== LOGIN CALLED ===');
    console.log('Token:', newToken);
    console.log('UserData:', userData);

    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
    setSessionExpiry(decodeTokenExpiry(newToken));

    console.log('State updated - token set, user set');
    console.log('localStorage authToken:', localStorage.getItem('authToken'));
    console.log('localStorage user:', localStorage.getItem('user'));
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSessionExpiry(null);
  };

  const isAuthenticated = () => {
    const hasToken = !!localStorage.getItem('authToken');
    const hasUser = !!user;
    return hasToken && hasUser;
  };

  // Re-issues an access token before it expires. NOTE: this calls
  // POST /api/auth/refresh, which does not exist in app.py yet — the backend
  // currently only mints a fresh 7-day token on /api/auth/login. Add a
  // refresh endpoint there (issuing a new JWT for the current user) or this
  // will 404 and fall through to logout below.
  const refreshAccessToken = useCallback(async () => {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      throw new Error('No token to refresh');
    }

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      }
    );

    if (!response.ok) {
      logout();
      throw new Error('Failed to refresh session');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.access_token);
    setToken(data.access_token);
    setSessionExpiry(decodeTokenExpiry(data.access_token));
    return data.access_token;
  }, []);

  // role/permission checks assume `user.role` (string) and/or `user.roles`
  // (array) and `user.permissions` (array) fields on the user object returned
  // by /api/auth/login and /api/auth/me — matching the shape PrivateRoute.js
  // already expects.
  const hasRole = useCallback(
    (role) =>
      !!user && (user.role === role || (Array.isArray(user.roles) && user.roles.includes(role))),
    [user]
  );

  const hasPermission = useCallback(
    (permission) =>
      !!user && Array.isArray(user.permissions) && user.permissions.includes(permission),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: isAuthenticated(),
        sessionExpiry,
        refreshAccessToken,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
