import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get('http://localhost:5007/contacts', {
        withCredentials: true,
      });
      setContacts(res.data.data);
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  const addContact = async (email) => {
    try {
      const res = await axios.post(
        'http://localhost:5007/contacts/add',
        { email },
        { withCredentials: true }
      );
      setContacts((prev) => [...prev, res.data.data]); // Expects { _id, username, email }
    } catch (err) {
      console.error('Add contact error:', err);
      throw err.response?.data?.message || 'Failed to add contact';
    }
  };

  const removeContact = async (contactId) => {
    try {
      await axios.delete(`http://localhost:5007/contacts/${contactId}`, {
        withCredentials: true,
      });
      setContacts((prev) => prev.filter((contact) => contact._id !== contactId));
    } catch (err) {
      console.error('Remove contact error:', err);
    }
  };

  return (
    <ContactContext.Provider value={{ contacts, fetchContacts, addContact, removeContact }}>
      {children}
    </ContactContext.Provider>
  );
};