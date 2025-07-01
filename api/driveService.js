const { google } = require('googleapis');

// Retrieve environment variables from Vercel dashboard
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// DEBUG: Environment validation
console.log("✅ driveService.js loaded");
console.log("GOOGLE_CLIENT_EMAIL exists:", !!GOOGLE_CLIENT_EMAIL);
console.log("GOOGLE_PRIVATE_KEY exists:", !!GOOGLE_PRIVATE_KEY);

// Sanitize private key: Replace escaped newlines if needed
const formattedPrivateKey = GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Create JWT auth client
const auth = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  formattedPrivateKey,
  ['https://www.googleapis.com/auth/drive']
);

// Optional: verify access token to check if it’s working
(async () => {
  try {
    await auth.authorize();
    console.log("✅ Google Drive Auth: access token obtained successfully");
  } catch (err) {
    console.error("❌ Google Drive Auth failed:", err.message);
  }
})();

// Export authenticated drive client
const drive = google.drive({ version: 'v3', auth });

module.exports = drive;
