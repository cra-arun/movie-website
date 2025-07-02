// api/shareFile.js
const drive = require('./driveService'); // Import the pre-configured Google Drive client

/**
 * Shares a Google Drive file with a specified user.
 * @param {string} fileId The ID of the Google Drive file to share.
 * @param {string} userEmail The email address of the user to share the file with.
 * @returns {Promise<boolean>} Resolves to true if access is granted, throws an error otherwise.
 */
async function shareDriveFileWithUser(fileId, userEmail) {
    try {
        const res = await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                type: 'user',        // Grant permission to a specific user
                role: 'reader',      // Grant 'reader' (viewer) access
                emailAddress: userEmail, // The user's email address
            },
            fields: 'id',                // Request only the ID of the created permission
            sendNotificationEmails: false, // Prevents Google from sending an email notification
        });

        console.log(`✔ Access granted to ${userEmail} for file ${fileId} (Permission ID: ${res.data.id})`);
        return true; // Indicate success
    } catch (err) {
        console.error('❌ Error granting permission:', err.errors ? JSON.stringify(err.errors) : err.message);
        // Re-throw the error to be caught by the calling function (e.g., in process-payment.js)
        throw new Error(`Failed to grant Drive access: ${err.message || 'Unknown error'}`);
    }
}

// Export the function
module.exports = { shareDriveFileWithUser };
