const { google } = require('googleapis');

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

console.log("✅ Email loaded:", GOOGLE_CLIENT_EMAIL);
console.log("✅ Key exists:", GOOGLE_PRIVATE_KEY ? "YES" : "NO");
console.log("✅ Key starts with:", GOOGLE_PRIVATE_KEY?.substring(0, 30));

// Fix Vercel formatting
const fixedPrivateKey = GOOGLE_PRIVATE_KEY
  .replace(/\\n/g, '\n')                                       // unescape literal \n
  .replace(/-----BEGIN PRIVATE KEY-----\s+/, '-----BEGIN PRIVATE KEY-----\n') // ensure new line
  .replace(/\s+-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');   // ensure ending newline

const auth = new google.auth.JWT(
    GOOGLE_CLIENT_EMAIL,
    null,
    fixedPrivateKey,
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
