// server.js
const express = require('express');
const Razorpay = require('razorpay');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// --- Health Check Endpoint ---
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: "✅ API working!" });
});

// --- Razorpay Configuration ---
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Product Mapping ---
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
        return res.status(400).json({ success: false, message: 'Missing required payment details.' });
    }

    const materialInfo = productFileMap[productTitle];

    if (!materialInfo) {
        return res.status(404).json({ success: false, message: 'Product information not found.' });
    }

    try {
        let payment = await razorpay.payments.fetch(paymentId);

        if (payment.status === 'authorized') {
            payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
            console.log(`✔ Payment ${paymentId} auto-captured.`);
        }

        if (payment.status !== 'captured') {
            return res.status(400).json({ success: false, message: 'Payment not captured.' });
        }

        if (payment.amount !== materialInfo.price) {
            return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
        }

        if (payment.currency !== 'INR') {
            return res.status(400).json({ success: false, message: 'Unsupported currency.' });
        }

        await shareDriveFileWithUser(materialInfo.fileId, userEmail);
        console.log(`✔ Access granted to ${userEmail}`);

        const fileMetadata = await drive.files.get({
            fileId: materialInfo.fileId,
            fields: 'webViewLink'
        });

        const downloadLink = fileMetadata.data.webViewLink;

        if (!downloadLink) {
            return res.status(500).json({ success: false, message: 'Could not get file access link.' });
        }

        return res.json({
            success: true,
            message: 'Payment successful and access granted!',
            downloadLink
        });

    } catch (error) {
        console.error('❌ Error processing payment:', error.message);
        return res.status(500).json({ success: false, message: 'An internal server error occurred during processing.' });
    }
});

// --- POST /api/check-access ---
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
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
