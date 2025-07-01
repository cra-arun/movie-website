// server.js
const express = require('express');
const Razorpay = require('razorpay');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Import your driveService and shareFile modules
const drive = require('./driveService');
const { shareDriveFileWithUser } = require('./shareFile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'study-store.html'));
});

// Serve static assets
app.use(express.static(__dirname));
app.use('/auth', express.static(path.join(__dirname, 'auth')));

// --- Razorpay Configuration ---
const razorpay = new Razorpay({
    key_id: "rzp_test_jQssrrKMG8JAdG",
    key_secret: "zbzGONn10vyTAHfda4t9TftC",
});

// --- Product Mapping (data-title must match HTML) ---
const productFileMap = {
    "Mastering Power BI": {
        fileId: "1fxhMTzxba05tJcT3Byn9vlg213Omk1Ue",
        price: 49900
    },
    "Advanced Excel for Data Analysis": {
        fileId: "1JxsIDqO8e7zAPhz8fw17tgEh2D9Wyspk",
        price: 34900
    },
    "Python Programming Fundamentals": {
        fileId: "1hacprG9-WX9DBRt1PDweNrXHXj08Wd8g",
        price: 69900
    },
    "SQL for Data Science": {
        fileId: "YOUR_SQL_DRIVE_FILE_ID",
        price: 55000
    },
    "Introduction to Web Development": {
        fileId: "YOUR_WEBDEV_DRIVE_FILE_ID",
        price: 75000
    }
};

// --- POST /api/process-payment ---
app.post('/api/process-payment', async (req, res) => {
    const { paymentId, productTitle, userEmail } = req.body;

    if (!paymentId || !productTitle || !userEmail) {
        console.error('Missing required payment details in backend: ', { paymentId, productTitle, userEmail });
        return res.status(400).json({ success: false, message: 'Missing required payment details.' });
    }

    const materialInfo = productFileMap[productTitle];

    if (!materialInfo) {
        console.error(`Product not found in map for title: ${productTitle}`);
        return res.status(404).json({ success: false, message: 'Product information not found.' });
    }

    try {
        // 1. Fetch payment
        let payment = await razorpay.payments.fetch(paymentId);

        // 2. Auto-capture if only authorized (test mode)
        if (payment.status === 'authorized') {
            payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
            console.log(`✔ Payment ${paymentId} auto-captured.`);
        }

        // 3. Validate payment
        if (payment.status !== 'captured') {
            console.warn(`Payment ${paymentId} not captured. Current status: ${payment.status}`);
            return res.status(400).json({ success: false, message: 'Payment not captured.' });
        }

        if (payment.amount !== materialInfo.price) {
            console.warn(`Amount mismatch for payment ${paymentId}: Expected ${materialInfo.price}, Got ${payment.amount}`);
            return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
        }

        if (payment.currency !== 'INR') {
            console.warn(`Currency mismatch for payment ${paymentId}: Expected INR, Got ${payment.currency}`);
            return res.status(400).json({ success: false, message: 'Unsupported currency.' });
        }

        console.log(`✔ Payment ${paymentId} verified successfully for ${userEmail}.`);

        // 4. Grant Drive Access
        await shareDriveFileWithUser(materialInfo.fileId, userEmail);
        console.log(`✔ Access granted to ${userEmail} for file ${materialInfo.fileId}`);

        // 5. Get Drive view link
        const fileMetadata = await drive.files.get({
            fileId: materialInfo.fileId,
            fields: 'webViewLink'
        });

        const downloadLink = fileMetadata.data.webViewLink;

        if (!downloadLink) {
            console.error(`Could not retrieve webViewLink for fileId: ${materialInfo.fileId}`);
            return res.status(500).json({ success: false, message: 'Could not get file access link.' });
        }

        return res.json({
            success: true,
            message: 'Payment successful and access granted!',
            downloadLink
        });

    } catch (error) {
        console.error('❌ Error processing payment or granting access:', error.message);
        if (error.response?.data) {
            console.error('Google API Error Response:', error.response.data);
        } else if (error.razorpay) {
            console.error('Razorpay Error:', error.razorpay);
        } else {
            console.error('Full error object:', error);
        }
        return res.status(500).json({ success: false, message: 'An internal server error occurred during processing.' });
    }
});

// --- POST /api/check-access ---
// Used to dynamically check which products a user can access
app.post('/api/check-access', async (req, res) => {
    const { userEmail } = req.body;

    if (!userEmail) {
        return res.status(400).json({ success: false, message: "Email required." });
    }

    const accessMap = {};

    try {
        for (const [title, { fileId }] of Object.entries(productFileMap)) {
            const permissions = await drive.permissions.list({
                fileId,
                fields: 'permissions(emailAddress, role)'
            });

            const hasAccess = permissions.data.permissions?.some(
                p => p.emailAddress === userEmail && p.role === 'reader'
            );

            if (hasAccess) {
                accessMap[title] = fileId;
            }
        }

        res.json({ success: true, accessMap });

    } catch (err) {
        console.error("❌ Error checking access:", err.message);
        res.status(500).json({ success: false, message: "Failed to check Drive access." });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
