import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Contacts from './pages/Contacts';
import Login from './components/Login';
import Register from './components/Register';
import { CallProvider } from './context/CallContext';
import { ChatProvider } from './context/ChatContext';
import { ContactProvider } from './context/ContactContext';
import { AuthProvider } from './context/AuthContext';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>Error: {this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <ChatProvider>
            <ContactProvider>
              <CallProvider>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </CallProvider>
            </ContactProvider>
          </ChatProvider>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;