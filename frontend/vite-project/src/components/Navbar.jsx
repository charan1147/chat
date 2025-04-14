import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f0f0f0' }}>
      <div>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/contacts" style={{ marginRight: '15px' }}>Contacts</Link>
        {user && <Link to={`/chat/${user._id}`}>Chat</Link>}
      </div>
      <div>
        {user ? (
          <button onClick={handleLogout} style={{ padding: '5px 10px' }}>
            Logout ({user.username})
          </button>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;