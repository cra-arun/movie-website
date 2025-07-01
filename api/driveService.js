const { google } = require('googleapis');

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const auth = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY, // no .replace() since it's already formatted!
  ['https://www.googleapis.com/auth/drive']
);

(async () => {
  try {
    await auth.authorize();
    console.log("✅ Google Drive service account authorized successfully.");
  } catch (err) {
    console.error("❌ Google Drive auth failed:", err.message);
  }
})();

const drive = google.drive({ version: 'v3', auth });
module.exports = drive;
