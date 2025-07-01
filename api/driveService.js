// api/driveService.js
const { google } = require('googleapis');

// Authenticate using JWT (Service Account) with environment variables
const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL, // Client Email from Vercel ENV
    null, // This argument is for 'keyFile', which we are not using (we're providing the key string directly)
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Private Key from Vercel ENV (handle newlines)
    ['https://www.googleapis.com/auth/drive'] // Scopes required for Google Drive access
);

// Create a Google Drive API client instance
const drive = google.drive({ version: 'v3', auth });

// Export the drive client
module.exports = drive;
