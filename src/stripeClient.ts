// src/stripeClient.ts
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4242";

export async function startCheckout() {
  try {
    const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "Checkout failed. Status:",
        response.status,
        "Body:",
        text
      );
      throw new Error("Server returned an error");
    }

    const data = await response.json();
    console.log("Checkout session response:", data);

    if (!data.url) {
      throw new Error("No checkout URL returned from server");
    }

    window.location.href = data.url;
  } catch (err) {
    console.error("Error starting checkout:", err);
    alert("Could not start checkout. Check the server and try again.");
  }
}
