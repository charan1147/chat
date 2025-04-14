import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.error('Email and password are required');
      return;
    }
    try {
      await login(email, password);
      navigate('/contacts'); // Redirect to contacts page
    } catch (err) {
      console.error('Login failed:', err.message);
      // Error is handled by AuthContext and displayed below
    }
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {isLoading && <p>Loading...</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={isLoading}>Login</button>
      </form>
    </ErrorBoundary>
  );
}

export default Login;