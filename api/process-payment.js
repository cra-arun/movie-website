// Example for api/process-payment.js (apply similarly to other API files)

const Razorpay = require('razorpay');
const drive = require('./driveService');
const { shareDriveFileWithUser } = require('./shareFile');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
        fileId: "YOUR_SQL_DRIVE_FILE_ID", // Make sure to replace these placeholders
        price: 55000
    },
    "Introduction to Web Development": {
        fileId: "YOUR_WEBDEV_DRIVE_FILE_ID", // Make sure to replace these placeholders
        price: 75000
    }
};

module.exports = async (req, res) => {
    // --- CORS Headers ---
    res.setHeader('Access-Control-Allow-Origin', 'https://moviewatchlist-arun.web.app'); // IMPORTANT: Replace with your actual Firebase domain(s)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // If you use cookies/auth headers

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // --- END CORS Headers ---

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { paymentId, productTitle, userEmail } = req.body;

    if (!paymentId || !productTitle || !userEmail) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const materialInfo = productFileMap[productTitle];
    if (!materialInfo) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    try {
        let payment = await razorpay.payments.fetch(paymentId);

        if (payment.status === 'authorized') {
            payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
        }

        if (payment.status !== 'captured') {
            return res.status(400).json({ success: false, message: 'Payment not captured.' });
        }

        if (payment.amount !== materialInfo.price || payment.currency !== 'INR') {
            console.error(`Amount or currency mismatch: Expected ${materialInfo.price} INR, got ${payment.amount} ${payment.currency}`);
            return res.status(400).json({ success: false, message: 'Invalid amount or currency.' });
        }

        await shareDriveFileWithUser(materialInfo.fileId, userEmail);

        const fileMetadata = await drive.files.get({
            fileId: materialInfo.fileId,
            fields: 'webViewLink'
        });

        const downloadLink = fileMetadata.data.webViewLink;

        if (!downloadLink) {
            console.error(`Could not retrieve webViewLink for fileId: ${materialInfo.fileId}`);
            return res.status(500).json({ success: false, message: 'Could not get file access link.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment successful. Access granted.',
            downloadLink
        });

    } catch (error) {
        console.error("❌ Error processing payment in backend:", error.message || error);
        return res.status(500).json({
            success: false,
            message: 'Server error during payment processing. Please contact support.',
            debug: error.message
        });
    }
};
