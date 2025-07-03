const { Cashfree, CFEnvironment } = require("cashfree-pg");
const drive = require("./driveService");
const { shareDriveFileWithUser } = require("./shareFile");

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

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // Change to PRODUCTION when ready
  process.env.CF_CLIENT_ID,
  process.env.CF_CLIENT_SECRET
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",'https://studystorex.web.app', // Your deployed Firebase Hosting domain
        'http://127.0.0.1',             // Your local development server (often includes port, e.g., :5500 or :3000)
        'http://localhost');
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

  try {
    const { productTitle, customerEmail, customerName } = req.body;

    const product = productFileMap[productTitle];
    if (!product || !product.fileId) {
      return res.status(404).json({ message: "Invalid product" });
    }

    await shareDriveFileWithUser(product.fileId, customerEmail);

    const downloadLink = `https://drive.google.com/file/d/${product.fileId}/view?usp=sharing`;

    const orderId = `order_${Date.now()}`;
    const orderResponse = await cashfree.PGCreateOrder({
      order_id: orderId,
      order_amount: product.price / 100, // convert paisa to rupee
      order_currency: "INR",
      customer_details: {
        customer_id: customerEmail,
        customer_email: customerEmail,
        customer_name: customerName
      },
      order_meta: {
        return_url: "https://studystorex.web.app/payment-success"
      }
    });

    return res.status(200).json({
      paymentSessionId: orderResponse.data.payment_session_id,
      downloadLink
    });
  } catch (error) {
    console.error("❌ Cashfree Error:", error.response?.data || error.message);
    return res.status(500).json({ message: "Cashfree session creation failed." });
  }
};
