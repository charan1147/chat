import { useState, useContext } from 'react';
import { ContactContext } from '../context/ContactContext';
import { useNavigate } from 'react-router-dom';

function Contacts() {
  const { contacts, addContact, removeContact, error } = useContext(ContactContext);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleAddContact = async (e) => {
    e.preventDefault();
    await addContact(email);
    setEmail('');
  };

  const handleRemoveContact = async (contactId) => {
    await removeContact(contactId);
  };

  return (
    <div>
      <h2>Contacts</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleAddContact}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Add contact by email" required />
        <button type="submit">Add</button>
      </form>
      <ul>
        {contacts.map((contact) => (
          <li key={contact._id}>
            {contact.email} ({contact.username})
            <button onClick={() => handleRemoveContact(contact._id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/chat')}>Go to Chat</button>
    </div>
  );
}

export default Contacts;