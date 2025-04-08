import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const { data } = await axios.get('http://localhost:5006/api/users/me', { withCredentials: true });
        setUser(data.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (identifier, password) => {
    try {
      const { data } = await axios.post(
        'http://localhost:5006/api/users/login',
        { identifier, password },
        { withCredentials: true }
      );
      setUser(data.user);
      navigate('/dashboard');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post(
        'http://localhost:5006/api/users/register',
        { username, email, password },
        { withCredentials: true }
      );
      setUser(data.user);
      navigate('/dashboard');
    } catch (error) {
      throw new Error('Registration failed');
    }
  };
  const logout = async () => {
    try {
      await axios.post('http://localhost:5006/api/users/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};