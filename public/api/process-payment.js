// api/process-payment.js

const Razorpay = require('razorpay');
const drive = require('../driveService');
const { shareDriveFileWithUser } = require('../shareFile');

const razorpay = new Razorpay({
  key_id: "rzp_test_jQssrrKMG8JAdG",
  key_secret: "zbzGONn10vyTAHfda4t9TftC"
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
    fileId: "YOUR_SQL_DRIVE_FILE_ID",
    price: 55000
  },
  "Introduction to Web Development": {
    fileId: "YOUR_WEBDEV_DRIVE_FILE_ID",
    price: 75000
  }
};

module.exports = async (req, res) => {
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
    // Fetch payment
    let payment = await razorpay.payments.fetch(paymentId);

    // Auto-capture if authorized
    if (payment.status === 'authorized') {
      payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
    }

    // Validate
    if (payment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not captured.' });
    }

    if (payment.amount !== materialInfo.price || payment.currency !== 'INR') {
      return res.status(400).json({ success: false, message: 'Invalid amount or currency.' });
    }

    // Share file
    await shareDriveFileWithUser(materialInfo.fileId, userEmail);

    const fileMetadata = await drive.files.get({
      fileId: materialInfo.fileId,
      fields: 'webViewLink'
    });

    const downloadLink = fileMetadata.data.webViewLink;

    return res.status(200).json({
      success: true,
      message: 'Payment successful. Access granted.',
      downloadLink
    });

  } catch (error) {
    console.error("❌ Error:", error.message || error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please contact support.'
    });
  }
};
