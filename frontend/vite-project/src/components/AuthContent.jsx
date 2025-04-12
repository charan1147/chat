import React from 'react';
import { Link } from 'react-router-dom';

const AuthContent = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Welcome to the Chat App</h2>
      <p>
        Please <Link to="/login">login</Link> or <Link to="/register">register</Link> to continue.
      </p>
    </div>
  );
};

export default AuthContent;