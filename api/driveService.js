const { google } = require('googleapis');

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY, // No replace() needed if pasted with real newlines
  scopes: ['https://www.googleapis.com/auth/drive']
});

// Debug: Verify key formatting
console.log("Key starts with:", process.env.GOOGLE_PRIVATE_KEY.substring(0, 30));
console.log("Key ends with:", process.env.GOOGLE_PRIVATE_KEY.slice(-20));

auth.authorize()
  .then(() => console.log('✅ Authentication successful'))
  .catch(err => console.error('❌ Authentication failed:', err.message));

module.exports = google.drive({ version: 'v3', auth });
