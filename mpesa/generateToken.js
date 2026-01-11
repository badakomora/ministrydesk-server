import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const generateToken = async (req, res, next) => {
  const CONSUMER_KEY = process.env.CONSUMER_KEY;
  const CONSUMER_SECRET = process.env.CONSUMER_SECRET;

  const URL =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.get(URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    req.mpesaToken = response.data.access_token;
    next();
  } catch (error) {
    console.error(
      "Failed to generate access token:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate access token" });
  }
};

export default generateToken;
