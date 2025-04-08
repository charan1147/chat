import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
  
    return (
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <h2>Messenger</h2>
        <div>
          {user ? (
            <>
              <span>Welcome, {user.username}!</span>
              <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    );
  };
  
  export default Navbar;