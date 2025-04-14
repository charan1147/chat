import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Chat App</h1>
      {user ? (
        <div>
          <h2>Hello, {user.username}!</h2>
          <p>Email: {user.email}</p>
          <div>
            <Link to="/contacts" style={{ marginRight: '15px' }}>
              <button>View Contacts</button>
            </Link>
            <Link to={`/chat/${user._id}`}>
              <button>Start Chat</button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p>Please log in or register to start chatting and calling.</p>
          <Link to="/login">
            <button style={{ marginRight: '10px' }}>Login</button>
          </Link>
          <Link to="/register">
            <button>Register</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;