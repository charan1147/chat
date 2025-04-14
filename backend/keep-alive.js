const axios = require('axios');

const HEALTH_CHECK_URL = 'https://chat-6-5ldi.onrender.com/health';
const PING_INTERVAL = 300000; // 5 minutes in milliseconds

const pingServer = async () => {
  try {
    console.log(`Pinging ${HEALTH_CHECK_URL} at ${new Date().toISOString()}`);
    const response = await axios.get(HEALTH_CHECK_URL);
    console.log('Ping successful:', response.status);
  } catch (err) {
    console.error('Keep-alive ping failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
    }
  }
};

pingServer(); // Initial ping
setInterval(pingServer, PING_INTERVAL);

module.exports = { pingServer };