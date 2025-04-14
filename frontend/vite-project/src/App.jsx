import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { ContactProvider } from './context/ContactContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Contacts from './pages/Contacts';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ChatProvider>
            <CallProvider>
              <ContactProvider>
                <Navbar />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/chat/:userId?" element={<Chat />} /> {/* Optional userId param */}
                  <Route path="/contacts" element={<Contacts />} />
                </Routes>
              </ContactProvider>
            </CallProvider>
          </ChatProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;