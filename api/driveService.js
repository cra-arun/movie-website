const { google } = require('googleapis');

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

console.log("✅ Email loaded:", GOOGLE_CLIENT_EMAIL);
console.log("✅ Key exists:", GOOGLE_PRIVATE_KEY ? "YES" : "NO");
console.log("✅ Key starts with:", GOOGLE_PRIVATE_KEY?.substring(0, 30));

const auth = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  ['https://www.googleapis.com/auth/drive']
);

(async () => {
  try {
    await auth.authorize();
    console.log("✅ Google Drive Auth Success");
  } catch (err) {
    console.error("❌ Google Drive auth failed:", err.message);
  }
})();

const drive = google.drive({ version: 'v3', auth });
module.exports = drive;
