// Loads Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
import type { PaymentOrder } from "./types";

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load Razorpay. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return loading;
}

/** Opens Checkout; resolves with the signed payment, or null if the user closed it. */
export async function payWithRazorpay(order: PaymentOrder): Promise<RazorpaySuccess | null> {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount_paise,
      currency: order.currency,
      name: "BigXel Ads",
      description: "Wallet top-up",
      prefill: { name: order.prefill_name, email: order.prefill_email, contact: order.prefill_contact ?? undefined },
      theme: { color: "#6d28d9" },
      handler: (resp: RazorpaySuccess) => resolve(resp),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on("payment.failed", (resp) => reject(new Error(resp.error.description || "Payment failed")));
    rzp.open();
  });
}
