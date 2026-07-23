import crypto from "crypto";

const APP_ID = process.env.ONEPAY_APP_ID as string;
const APP_TOKEN = process.env.ONEPAY_APP_TOKEN as string;
const HASH_SALT = process.env.ONEPAY_HASH_SALT as string;
const API_BASE = process.env.ONEPAY_API_BASE ?? "https://api.onepay.lk";

export interface OnePayCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface CreateCheckoutLinkParams {
  amount: number;
  reference: string;
  redirectUrl: string;
  customer: OnePayCustomer;
  additionalData?: string;
}

export interface CreateCheckoutLinkResult {
  checkoutUrl: string;
  transactionId: string;
  raw: unknown;
}

function formatAmount(amount: number) {
  return amount.toFixed(2);
}

// Docs: https://docs.onepay.lk/api-documentation/payment-api
// hash = SHA256(app_id + currency + amount + HASH_SALT)
function signAmount(amount: string, currency: string) {
  return crypto.createHash("sha256").update(`${APP_ID}${currency}${amount}${HASH_SALT}`).digest("hex");
}

/**
 * Creates a OnePay checkout link (redirect-based flow).
 *
 * Confirmed against the live sandbox (docs.onepay.lk was incomplete on these
 * two points):
 *  - Authorization header is the raw App Token — NOT "Bearer <token>".
 *  - Success response shape: { data: { ipg_transaction_id, gateway: { redirect_url } } }
 */
export async function createCheckoutLink(params: CreateCheckoutLinkParams): Promise<CreateCheckoutLinkResult> {
  const currency = "LKR";
  const amount = formatAmount(params.amount);
  const hash = signAmount(amount, currency);

  const body = {
    app_id: APP_ID,
    amount,
    currency,
    hash,
    reference: params.reference,
    customer_first_name: params.customer.firstName,
    customer_last_name: params.customer.lastName,
    customer_phone_number: params.customer.phone,
    customer_email: params.customer.email,
    transaction_redirect_url: params.redirectUrl,
    additionalData: params.additionalData ?? "",
  };

  const res = await fetch(`${API_BASE}/v3/checkout/link/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: APP_TOKEN,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`OnePay checkout link request failed (${res.status}): ${JSON.stringify(raw)}`);
  }

  const checkoutUrl = (raw as any)?.data?.gateway?.redirect_url;
  const transactionId = (raw as any)?.data?.ipg_transaction_id;

  if (typeof checkoutUrl !== "string" || !checkoutUrl || typeof transactionId !== "string" || !transactionId) {
    throw new Error(
      `OnePay response missing expected fields (data.gateway.redirect_url / data.ipg_transaction_id). Raw response: ${JSON.stringify(raw)}`
    );
  }

  return { checkoutUrl, transactionId, raw };
}

export interface OnePayWebhookPayload {
  transaction_id: string;
  status: number;
  status_message: string;
  additional_data?: string;
}

export function isOnePaySuccessStatus(status: number) {
  return status === 1;
}
