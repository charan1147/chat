import React, { useState, useContext } from 'react';
import { ContactContext } from '../context/ContactContext';

const ContactsPage = () => {
  const { contacts, addContact, removeContact } = useContext(ContactContext);
  const [contactId, setContactId] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    try {
      await addContact(contactId);
      setContactId('');
    } catch (err) {
      setError(err);
    }
  };

  const handleRemove = async (contactId) => {
    try {
      await removeContact(contactId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2>Contacts</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '20px' }}>
        <input
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          placeholder="Enter contact ID"
          style={{ padding: '8px', width: '70%' }}
        />
        <button onClick={handleAdd} style={{ padding: '8px', marginLeft: '10px' }}>Add Contact</button>
      </div>
      <ul>
        {contacts.map((contact) => (
          <li key={contact._id} style={{ marginBottom: '10px' }}>
            {contact.username} ({contact.email})
            <button
              onClick={() => handleRemove(contact._id)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactsPage;