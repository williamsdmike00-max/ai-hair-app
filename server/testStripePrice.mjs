// testStripePrice.mjs
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

console.log("Secret key from env starts with:", process.env.STRIPE_SECRET_KEY?.slice(0, 20));
console.log("Price ID from env:", process.env.STRIPE_PRICE_ID_PRO);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

try {
  const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_PRO);
  console.log("✅ Stripe found price:", price.id);
  console.log("Nickname:", price.nickname);
  console.log("Active:", price.active);
} catch (err) {
  console.error("❌ Error retrieving price:", err);
}
