const drive = require('./driveService'); // Updated path

async function shareDriveFileWithUser(fileId, userEmail) {
    try {
        await drive.permissions.create({
            fileId,
            requestBody: {
                type: 'user',
                role: 'reader',
                emailAddress: userEmail
            },
            fields: 'id',
            sendNotificationEmails: false, // Set to true if you want Google to send emails
        });
        console.log(`✔ Access granted to ${userEmail} for file ${fileId}`);
    } catch (error) {
        console.error('❌ Error granting permission:', error.message);
        throw new Error('Failed to grant Drive access: ' + error.message);
    }
}

module.exports = { shareDriveFileWithUser };
