import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ContactContext } from '../context/ContactContext';

const Contacts = () => {
  const { user } = useContext(AuthContext);
  const { contacts, addContact, removeContact } = useContext(ContactContext);
  const [contactEmail, setContactEmail] = useState(''); // Changed from contactId to contactEmail
  const [error, setError] = useState(''); // Added error state for feedback

  const handleAdd = async () => {
    if (contactEmail.trim()) {
      try {
        await addContact(contactEmail);
        setContactEmail('');
        setError('');
      } catch (err) {
        setError(err || 'Failed to add contact');
      }
    }
  };

  if (!user) {
    return <div>Please login to manage contacts.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Contacts</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email" // Changed to email type for better validation
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Enter contact email"
          style={{ padding: '8px', width: '200px' }}
        />
        <button onClick={handleAdd} style={{ padding: '8px', marginLeft: '10px' }}>Add Contact</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <ul>
        {contacts.map((contact) => (
          <li key={contact._id} style={{ marginBottom: '10px' }}>
            {contact.username} ({contact.email})
            <button
              onClick={() => removeContact(contact._id)}
              style={{ marginLeft: '10px', color: 'red' }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Contacts;