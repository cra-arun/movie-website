const drive = require('./driveService');
async function shareDriveFileWithUser(fileId, userEmail) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role: 'reader',
        emailAddress: userEmail
      },
      fields: 'id'
    });
  } catch (error) {
    console.error('❌ Error granting permission:', error.message);
    throw new Error('Failed to grant Drive access: ' + error.message);
  }
}

module.exports = { shareDriveFileWithUser };
