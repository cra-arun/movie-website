// api/process-payment.js
const Razorpay = require('razorpay');
// Ensure driveService is correctly imported for Google Drive operations
const drive = require('./driveService');
const { shareDriveFileWithUser } = require('./shareFile');

// Initialize Razorpay with keys from environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Map product titles to their respective Google Drive file IDs and prices
const productFileMap = {
    "Mastering Power BI": {
        fileId: "1fxhMTzxba05tJcT3Byn9vlg213Omk1Ue", // Replace with actual file IDs
        price: 49900 // Price in paisa (e.g., 499.00 INR)
    },
    "Advanced Excel for Data Analysis": {
        fileId: "1JxsIDqO8e7zAPhz8fw17tgEh2D9Wyspk", // Replace with actual file IDs
        price: 34900
    },
    "Python Programming Fundamentals": {
        fileId: "1hacprG9-WX9DBRt1PDweNrXHXj08Wd8g", // Replace with actual file IDs
        price: 69900
    },
    "SQL for Data Science": {
        fileId: "YOUR_SQL_DRIVE_FILE_ID", // IMPORTANT: REPLACE WITH YOUR ACTUAL GOOGLE DRIVE FILE ID
        price: 55000
    },
    "Introduction to Web Development": {
        fileId: "YOUR_WEBDEV_DRIVE_FILE_ID", // IMPORTANT: REPLACE WITH YOUR ACTUAL GOOGLE DRIVE FILE ID
        price: 75000
    }
};

// Vercel's serverless function entry point
module.exports = async (req, res) => {
    // --- CORS Headers ---
    // This is critical for your frontend hosted on Firebase to communicate with this backend
    res.setHeader('Access-Control-Allow-Origin','https://studystorex.web.app', // Your deployed Firebase Hosting domain
        'http://127.0.0.1',             // Your local development server (often includes port, e.g., :5500 or :3000)
        'http://localhost'); // IMPORTANT: Replace with your actual Firebase domain(s)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // --- END CORS Headers ---

    // Ensure only POST requests are processed for payment
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Destructure required data from the request body
    const { paymentId, productTitle, userEmail } = req.body;

    // Basic validation for required fields
    if (!paymentId || !productTitle || !userEmail) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Retrieve product information from the map
    const materialInfo = productFileMap[productTitle];
    if (!materialInfo) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    try {
        // 1. Verify Payment Status with Razorpay
        let payment = await razorpay.payments.fetch(paymentId);

        // If payment is authorized, capture it
        if (payment.status === 'authorized') {
            payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
        }

        // Check if payment was successfully captured
        if (payment.status !== 'captured') {
            console.error(`Payment ${paymentId} not captured. Current status: ${payment.status}`);
            return res.status(400).json({ success: false, message: 'Payment not captured.' });
        }

        // Verify amount and currency
        if (payment.amount !== materialInfo.price || payment.currency !== 'INR') {
            console.error(`Amount or currency mismatch for payment ${paymentId}: Expected ${materialInfo.price} INR, got ${payment.amount} ${payment.currency}`);
            return res.status(400).json({ success: false, message: 'Invalid amount or currency.' });
        }

        console.log(`✔ Payment ${paymentId} verified successfully for ${userEmail}.`);

        // 2. Grant Google Drive Access to the user
        await shareDriveFileWithUser(materialInfo.fileId, userEmail);

        // 3. Get the public webViewLink for the file
        // This link allows the user to view the file in their browser via Google Drive
        const fileMetadata = await drive.files.get({
            fileId: materialInfo.fileId,
            fields: 'webViewLink' // Request only the webViewLink field
        });

        const downloadLink = fileMetadata.data.webViewLink;

        if (!downloadLink) {
            console.error(`Could not retrieve webViewLink for fileId: ${materialInfo.fileId}`);
            return res.status(500).json({ success: false, message: 'Could not get file access link.' });
        }

        // Send success response with the download link
        return res.status(200).json({
            success: true,
            message: 'Payment successful. Access granted.',
            downloadLink: downloadLink // Provide the Google Drive link to the frontend
        });

    } catch (error) {
        // Log any errors that occur during the process
        console.error("❌ Error processing payment in backend:", error.message || error);
        // Send a generic error message to the client, but log details for debugging
        return res.status(500).json({
            success: false,
            message: 'Server error during payment processing. Please contact support.',
            debug: error.message // Include error message for debugging on the client side
        });
    }
};
