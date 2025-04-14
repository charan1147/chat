import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const ContactContext = createContext();

export function ContactProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('https://chat-6-5ldi.onrender.com/api/contacts', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) setContacts(data.data); // Match controller response
    } catch (err) {
      setError(err.message);
    }
  };

  const addContact = async (email) => {
    try {
      const response = await fetch('https://chat-6-5ldi.onrender.com/api/contacts/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) await fetchContacts(); // Refresh contacts
    } catch (err) {
      setError(err.message);
    }
  };

  const removeContact = async (contactId) => {
    try {
      const response = await fetch(`https://chat-6-5ldi.onrender.com/api/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) await fetchContacts(); // Refresh contacts
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ContactContext.Provider value={{ contacts, addContact, removeContact, error }}>
      {children}
    </ContactContext.Provider>
  );
}