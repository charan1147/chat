import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav style={{ padding: '10px', background: '#f0f0f0' }}>
      <Link to="/">Home</Link>
      {user ? (
        <>
          <Link to="/chat" style={{ marginLeft: '10px' }}>Chat</Link>
          <Link to="/contacts" style={{ marginLeft: '10px' }}>Contacts</Link>
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginLeft: '10px' }}>Login</Link>
          <Link to="/register" style={{ marginLeft: '10px' }}>Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;