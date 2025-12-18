// server/index.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // loads server/.env

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ✅ Use your secret key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Debug logs so we can see what envs are loaded
console.log("Stripe key loaded?", !!process.env.STRIPE_SECRET_KEY);
console.log("Using price ID:", process.env.STRIPE_PRICE_ID_PRO);
console.log("Frontend URL:", process.env.FRONTEND_URL);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      // You can change these later, but this is fine for now
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(4242, () => {
  console.log("Stripe server running on http://localhost:4242");
});
