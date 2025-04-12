import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:5007/auth/me', {
          withCredentials: true,
        });
        setUser(res.data.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Requesting: http://localhost:5007/auth/login');
      const res = await axios.post(
        'http://localhost:5007/auth/login',
        { email, password },
        { withCredentials: true }
      );
      setUser(res.data.data);
      return true;
    } catch (err) {
      console.log('Login error full:', err);
      console.log('Error code:', err.code);
      console.log('Response:', err.response);
      console.log('Response data:', err.response?.data);
      console.log('Thrown message:', err.response?.data?.message || 'Login failed');
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(
        'http://localhost:5007/auth/register',
        { username, email, password },
        { withCredentials: true }
      );
      setUser(res.data.data);
      return true;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5007/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};