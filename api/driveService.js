const { google } = require('googleapis');

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY, // No replace() needed if key has real newlines
  scopes: ['https://www.googleapis.com/auth/drive']
});

// Debug: Log the first/last 20 chars of the key to verify formatting
console.log("Key starts with:", process.env.GOOGLE_PRIVATE_KEY.substring(0, 20));
console.log("Key ends with:", process.env.GOOGLE_PRIVATE_KEY.slice(-20));

auth.authorize()
  .then(() => console.log("✅ Auth successful"))
  .catch(err => {
    console.error("❌ Auth failed:", err.message);
    console.error("Full key (truncated):", process.env.GOOGLE_PRIVATE_KEY.substring(0, 100) + "...");
  });

module.exports = google.drive({ version: 'v3', auth });
