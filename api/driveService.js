const { google } = require('googleapis');

// Load environment variables
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Debug logs to verify values are loaded (remove in production)
console.log("✅ Service Account Email:", GOOGLE_CLIENT_EMAIL);
console.log("✅ Private Key Starts With:", GOOGLE_PRIVATE_KEY?.substring(0, 30));

// Initialize authentication
const auth = new google.auth.JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY, // Use key directly (assuming proper newlines in env var)
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

// Test authentication immediately
auth.authorize()
  .then(() => {
    console.log("✅ Successfully authenticated with Google Drive API");
    console.log("🔄 Token will auto-refresh when needed");
  })
  .catch(err => {
    console.error("❌ Failed to authenticate with Google Drive API");
    console.error("🔧 Error details:", err.message);
    if (err.message.includes("invalid_grant")) {
      console.error("⚠️  Common fixes:");
      console.error("1. Verify service account email in Google Cloud Console");
      console.error("2. Check key formatting in Vercel environment variables");
      console.error("3. Ensure Drive API is enabled for the project");
    }
  });

// Configure Drive API instance
const drive = google.drive({
  version: 'v3',
  auth,
  // Optional: Configure global retry/error handling
  retryConfig: { 
    retry: 3,
    retryDelay: 1000,
    httpMethodsToRetry: ['GET', 'PUT', 'POST', 'HEAD', 'OPTIONS'],
    statusCodesToRetry: [[100, 199], [429, 429], [500, 599]]
  }
});

module.exports = drive;
