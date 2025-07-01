// api/driveService.js
const { google } = require('googleapis');

// Retrieve credentials from Vercel Environment Variables
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// --- START DEBUG LOGGING ---
console.log("DEBUG: driveService.js initialized.");
console.log("DEBUG: GOOGLE_CLIENT_EMAIL present:", !!GOOGLE_CLIENT_EMAIL);
console.log("DEBUG: GOOGLE_PRIVATE_KEY present:", !!GOOGLE_PRIVATE_KEY);
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
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive']
);

console.log("DEBUG: Auth object created.");

// --- NEW DEBUG LOGGING TO CHECK TOKEN ---
async function getAuthToken() {
    try {
        const credentials = await auth.authorize(); // This attempts to get the access token
        console.log("DEBUG: Access token successfully obtained.");
        // console.log("DEBUG: Token expiry:", credentials.expiry_date); // Optional: if you want to see expiry
        // console.log("DEBUG: Token type:", credentials.token_type); // Optional: usually 'Bearer'
    } catch (tokenError) {
        console.error("DEBUG ERROR: Failed to obtain access token:", tokenError.message || tokenError);
    }
}
// Call the async function immediately (it will run in the background as module initializes)
getAuthToken();
// --- END NEW DEBUG LOGGING ---

const drive = google.drive({ version: 'v3', auth });

module.exports = drive;
