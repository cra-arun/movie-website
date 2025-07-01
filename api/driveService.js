// api/driveService.js
const { google } = require('googleapis');

// Retrieve credentials from Vercel Environment Variables
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY; // Use directly for logging initially

// --- START DEBUG LOGGING ---
console.log("DEBUG: driveService.js initialized.");
console.log("DEBUG: GOOGLE_CLIENT_EMAIL present:", !!GOOGLE_CLIENT_EMAIL); // Check if it's not empty/undefined
console.log("DEBUG: GOOGLE_PRIVATE_KEY present:", !!GOOGLE_PRIVATE_KEY); // Check if it's not empty/undefined
if (GOOGLE_CLIENT_EMAIL) {
    console.log("DEBUG: GOOGLE_CLIENT_EMAIL value (first 10 chars):", GOOGLE_CLIENT_EMAIL.substring(0, 10) + "...");
}
if (GOOGLE_PRIVATE_KEY) {
    console.log("DEBUG: GOOGLE_PRIVATE_KEY value (first 30 chars):", GOOGLE_PRIVATE_KEY.substring(0, 30) + "...");
}
// --- END DEBUG LOGGING ---

const auth = new google.auth.JWT(
    GOOGLE_CLIENT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Apply replace here for the actual auth object
    ['https://www.googleapis.com/auth/drive']
);

// --- START DEBUG LOGGING (after auth object creation) ---
console.log("DEBUG: Auth object created.");
// Note: We cannot log the full auth object directly as it contains sensitive data.
// We are just confirming its creation.
// --- END DEBUG LOGGING ---

const drive = google.drive({ version: 'v3', auth });

module.exports = drive;
