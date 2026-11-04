# Payments Module

Accept one-time payments and subscriptions through the app's connected payment provider: checkouts (hosted or embedded), purchase lookup, refunds, and subscription management.

- **`base44.payments`** — Anonymous or user authentication (frontend). Preloads and mounts embedded checkouts, completes PayPal checkouts, and lists the current user's own purchases.
- **`base44.asServiceRole.payments`** — Service role authentication (backend only). Creates checkouts, lists any purchase, refunds payments, and changes subscriptions.

## Contents
- [Providers](#providers)
- [Frontend Methods (`base44.payments`)](#frontend-methods-base44payments)
- [Service Role Methods (`base44.asServiceRole.payments`)](#service-role-methods-base44asserviceolepayments)
- [The Full Checkout Flow](#the-full-checkout-flow)
- [Error Codes](#error-codes)
- [Type Definitions](#type-definitions)

---

## Providers

Each app connects exactly one provider: Stripe, PayPal, or Base44 Payments (powered by Wix).

| | Stripe | PayPal | Base44 Payments |
|---|---|---|---|
| Redirect checkout | Yes | No | Yes |
| Embedded checkout | Yes | Yes, required | No |
| Refunds | Yes | Yes | No |
| Subscription cancellation | Yes, now or at period end | Yes, now only | No |
| Subscription pause and resume | Yes | Yes | No |

Not every provider supports every operation — methods reject with codes like `refund_not_supported`, `subscription_action_not_supported`, `complete_not_supported`, or `presentation_not_supported` when the connected provider doesn't support what you're calling.

---

## Frontend Methods (`base44.payments`)

Anonymous or user authentication. **Only the service role can create checkouts**, so a backend function must call `createCheckout()` first (see [service role methods](#service-role-methods-base44asserviceolepayments)) and return the result to the page.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `preloadCheckout(provider)` | `Promise<void>` | Starts downloading the provider's JS library ahead of time so the checkout appears faster. Never rejects. |
| `mountCheckout(element, checkout, options?)` | `Promise<CheckoutMount>` | Renders an embedded checkout inside a page element. Browser only. |
| `completeCheckout(checkoutId)` | `Promise<CompleteCheckoutResult>` | Completes a PayPal checkout after the buyer approves it. Other providers reject with `complete_not_supported`. |
| `listPurchases(params?)` | `Promise<ListPurchasesResult>` | Lists the current user's own purchases. Rejects with `forbidden` for anonymous auth. |

### Examples

#### Preload a provider's library

```javascript
// Call when the checkout page or form opens, while the buyer is still filling it in
base44.payments.preloadCheckout('paypal');
```

#### Mount an embedded checkout

```javascript
// Create the checkout in a backend function first
const { data: checkout } = await base44.functions.invoke('createCheckout', { planId });

const mount = await base44.payments.mountCheckout(
  document.getElementById('checkout'),
  checkout,
  {
    onComplete: ({ status }) => navigate(status === 'paid' ? '/thank-you' : '/processing'),
    onCancel: () => console.log('Buyer closed the checkout'),
    onError: () => setError('The payment failed. Please try again.'),
  }
);

// Later, when the page/component unmounts
mount.destroy();
```

```jsx
// React component
function Checkout({ checkout }) {
  const ref = useRef(null);

  useEffect(() => {
    let mount;
    let cancelled = false;
    base44.payments
      .mountCheckout(ref.current, checkout, { onComplete: () => navigate('/thank-you') })
      .then((m) => (cancelled ? m.destroy() : (mount = m)))
      .catch(() => setError('The checkout could not load.'));
    return () => {
      cancelled = true;
      mount?.destroy();
    };
  }, [checkout]);

  return <div ref={ref} />;
}
```

For PayPal, `mountCheckout()` renders a PayPal button; when the buyer approves, the SDK calls `completeCheckout()` for you and then `onComplete`. For Stripe, it mounts Stripe Embedded Checkout; after paying, the buyer returns to the checkout's `success_path` (Stripe doesn't call `onComplete`). Stripe allows only one embedded checkout per page — mounting another destroys the previous one.

**Never grant access from `onComplete` alone.** These callbacks run in the buyer's browser and can be faked. Confirm the purchase from your backend with `listPurchases()` (service role) before unlocking anything.

#### Complete a PayPal checkout (custom button)

```javascript
// Only needed if you render your own PayPal button instead of using mountCheckout()
const { status } = await base44.payments.completeCheckout(checkoutId);
if (status === 'paid') {
  showThankYou();
}
```

#### Check a purchase by checkout ID

```javascript
const { items } = await base44.payments.listPurchases({ checkout_id: checkoutId });
const paid = items[0]?.status === 'paid';
```

#### Stripe success page

```javascript
// On a Stripe success page, the session_id query parameter is the checkout ID
const checkoutId = new URLSearchParams(window.location.search).get('session_id');

const { items: [purchase] } = await base44.payments.listPurchases({ checkout_id: checkoutId });

if (purchase?.status === 'paid') {
  showThankYou();
}
```

#### Page through purchases

```javascript
let cursor;
do {
  const page = await base44.payments.listPurchases({ limit: 50, cursor });
  page.items.forEach((purchase) => console.log(purchase.checkout_id, purchase.status));
  cursor = page.next_cursor ?? undefined;
} while (cursor);
```

> PayPal apps can't list purchases without a filter — pass `checkout_id` or `subscription_id`, or the call rejects with `invalid_request`.

---

## Service Role Methods (`base44.asServiceRole.payments`)

Service role authentication. **Backend functions only.** Creates checkouts, lists any buyer's purchases (including `metadata` and `shipping_address`), refunds payments, and manages subscriptions.

Refunds take a required `idempotency_key`, and checkouts take an optional one, so retries don't charge or refund twice. Repeating a subscription change returns the subscription's current state instead of erroring.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `createCheckout(params)` | `Promise<CreateCheckoutResult>` | Creates a redirect or embedded checkout. An item with `recurring` creates a subscription. |
| `completeCheckout(checkoutId)` | `Promise<CompleteCheckoutResult>` | Completes a PayPal checkout from the backend, e.g. when your own PayPal button posts the checkout ID to your server. |
| `listPurchases(params?)` | `Promise<ListPurchasesResult>` | Lists any buyer's purchases, with `metadata` and `shipping_address` included. |
| `refund(params)` | `Promise<RefundResult>` | Refunds all or part of a payment. Not supported for Base44 Payments. |
| `cancelSubscription(subscriptionId, options?)` | `Promise<SubscriptionResult>` | Cancels a subscription, now or at period end. Not supported for Base44 Payments; PayPal only supports canceling now. |
| `pauseSubscription(subscriptionId)` | `Promise<SubscriptionResult>` | Pauses a subscription's billing. Not supported for Base44 Payments. |
| `resumeSubscription(subscriptionId)` | `Promise<SubscriptionResult>` | Resumes a paused subscription's billing. Not supported for Base44 Payments. |

### Examples

#### Create a redirect checkout

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const checkout = await base44.asServiceRole.payments.createCheckout({
    items: [{ name: 'T-shirt', amount: 2500, quantity: 2, shippable: true }],
    currency: 'usd',
    success_path: '/thank-you',
    cancel_path: '/cart',
  });

  return Response.json({ url: checkout.redirect_url });
});
```

#### Create an embedded subscription checkout

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  const checkout = await base44.asServiceRole.payments.createCheckout({
    items: [{
      name: 'Pro plan',
      amount: 1500,
      recurring: { frequency: 'month', free_trial: { frequency: 'day', interval: 14 } },
    }],
    currency: 'usd',
    success_path: '/welcome',
    buyer: { email: user.email },
    presentation: 'embedded',
  });

  // Pass this straight to base44.payments.mountCheckout() on the page
  return Response.json(checkout);
});
```

#### Complete a PayPal checkout from the backend

```javascript
const { status } = await base44.asServiceRole.payments.completeCheckout(checkoutId);
```

#### Confirm a purchase before granting access

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { checkoutId } = await req.json();

  const { items: [purchase] } = await base44.asServiceRole.payments.listPurchases({
    checkout_id: checkoutId,
  });

  if (purchase?.status !== 'paid') {
    return Response.json({ error: 'Payment not confirmed' }, { status: 402 });
  }

  // Grant access to what the buyer paid for here
  return Response.json({ ok: true });
});
```

#### Find a buyer's purchases

```javascript
// Not available for PayPal apps, which must pass checkout_id or subscription_id instead
const { items } = await base44.asServiceRole.payments.listPurchases({
  buyer_email: 'buyer@example.com',
});
```

#### Refund a payment

```javascript
const { items } = await base44.asServiceRole.payments.listPurchases({ checkout_id: checkoutId });
const purchase = items[0];

const refund = await base44.asServiceRole.payments.refund({
  payment_id: purchase.payment_id,
  amount: purchase.amount_total,
  idempotency_key: `refund-${checkoutId}`,
});
```

If `refund()` rejects with `refund_failed`, the outcome is unknown — retry with the same `payment_id`, `amount`, and `idempotency_key`, which returns the original refund if one went through instead of refunding twice.

#### Manage a subscription

```javascript
// Cancel at the end of the current billing period
await base44.asServiceRole.payments.cancelSubscription(subscriptionId, { at_period_end: true });

// Pause billing
await base44.asServiceRole.payments.pauseSubscription(subscriptionId);

// Resume billing
await base44.asServiceRole.payments.resumeSubscription(subscriptionId);
```

---

## The Full Checkout Flow

1. **Backend** (service role) calls `createCheckout()` with the items to sell and returns the result to the page.
2. **Frontend** either redirects the buyer to `redirect_url`, or mounts the embedded checkout with `base44.payments.mountCheckout()`.
3. The buyer pays. For PayPal, `mountCheckout()` calls `completeCheckout()` and fires `onComplete` in the browser. For Stripe, the buyer returns to `success_path` with a `session_id` query parameter (the `checkout_id`).
4. **Backend confirms the purchase** with `base44.asServiceRole.payments.listPurchases({ checkout_id })` and only then grants access to what was purchased.

Step 4 is required even though the frontend already got an `onComplete` callback or landed on the success page — those signals run in, or are reachable from, the buyer's browser and can be faked. Treat `mountCheckout()` callbacks as UI hints only (e.g. "show a 'processing' spinner"), never as proof of payment.

---

## Error Codes

Payments methods reject with a `Base44Error` whose `code` is one of `PaymentsErrorCode`. (Invalid arguments and `mountCheckout()` failures reject with a plain `Error` instead.) Notable codes to handle:

| Code | Meaning |
|------|---------|
| `payment_declined` | The buyer's payment method was declined while completing the checkout. Let the buyer try again with another method. |
| `refund_failed` | The refund's outcome is unknown. Retry with the same `idempotency_key` and `amount` — this returns the original refund if one was made, instead of refunding twice. |
| `refund_in_progress` | A refund with the same `idempotency_key` is still running. |
| `refund_amount_mismatch` | The `idempotency_key` was already used for a different refund amount. |
| `rate_limited` | Too many requests. Wait the number of seconds in the `Retry-After` header, available at `error.originalError.response.headers['retry-after']`. |
| `refund_not_supported`, `subscription_action_not_supported`, `complete_not_supported`, `presentation_not_supported` | The app's connected payment provider doesn't support the operation (see [Providers](#providers)). |
| `forbidden` | E.g. `base44.payments.listPurchases()` called with anonymous authentication. |
| `invalid_request` | E.g. a PayPal `listPurchases()` call missing both `checkout_id` and `subscription_id`. |
| `checkout_not_found`, `subscription_not_found`, `payment_not_found` | The ID passed doesn't match an existing checkout, subscription, or payment. |

The full `PaymentsErrorCode` union also includes `unauthenticated`, `not_found`, `conflict`, `payments_not_connected`, `invalid_items`, `amount_below_minimum`, `currency_mismatch`, `currency_required`, `invalid_metadata`, `idempotency_not_supported`, `idempotency_key_reused`, `multiple_subscription_items`, `recurring_option_not_supported`, `invalid_cursor`, `embedded_checkout_unavailable`, `checkout_not_approved`, `checkout_closed`, `provider_unavailable`, `refund_rejected`, `refund_temporarily_unavailable`, and `subscription_not_active`.

---

## Type Definitions

```typescript
/** How often a recurring item bills: 'day' | 'week' | 'month' | 'year'. */
type PaymentsRecurringFrequency = "day" | "week" | "month" | "year";

/** Free trial before the first charge of a recurring item. */
interface CheckoutFreeTrial {
  /** Unit of the trial length. Stripe supports only 'day' and 'week'. */
  frequency: PaymentsRecurringFrequency;
  /** Number of `frequency` units the trial lasts, 1 to 999. */
  interval: number;
}

/** Billing terms that turn a checkout item into a subscription. */
interface CheckoutItemRecurring {
  /** Unit of the billing period. */
  frequency: PaymentsRecurringFrequency;
  /** Number of `frequency` units between charges, 1 to 3650. Defaults to 1. */
  interval?: number;
  /** Whether the subscription auto-renews. Stripe doesn't support `false`. */
  auto_renewal?: boolean;
  /** Number of billing cycles before the subscription ends. Omit for no limit. Not supported for Stripe. */
  billing_cycles?: number;
  /** Free trial before the first charge. Stripe applies one trial to the whole checkout. */
  free_trial?: CheckoutFreeTrial;
  /** Subscription title shown to the buyer, up to 150 characters. */
  title?: string;
  /** Subscription description shown to the buyer, up to 500 characters. */
  description?: string;
}

/** A line item in a checkout. */
interface CheckoutItem {
  /** Item name shown to the buyer, 1 to 255 characters. */
  name: string;
  /** Unit price as an integer in minor units (e.g. cents). Must be greater than 0. */
  amount: number;
  /** Number of units, 1 to 1,000,000. Defaults to 1. */
  quantity?: number;
  /** Whether the item ships; if so, the provider collects an address unless `shipping.address` is set. */
  shippable?: boolean;
  /** Billing terms. Set to sell the item as a subscription. PayPal/Base44 Payments allow only one recurring item per checkout. */
  recurring?: CheckoutItemRecurring;
}

/** Details about the buyer, used to prefill the checkout. All fields optional. */
interface CheckoutBuyer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/** A shipping address. Returned on a purchase whether your app or the provider collected it. */
interface ShippingAddress {
  /** Recipient's full name, 1-300 characters. */
  name: string;
  /** Street address, 1-300 characters. */
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  /** Two-letter ISO 3166-1 country code, e.g. 'US'. */
  country: string;
}

/** Shipping address and fee for a checkout. */
interface CheckoutShipping {
  /** Address your app collected. Omit to let the provider ask the buyer. */
  address?: ShippingAddress;
  /** Shipping fee in minor units, shown as its own line. Omit for free shipping. */
  amount?: number;
}

/** How the buyer pays: 'redirect' sends them to the provider's hosted page; 'embedded' renders inline via mountCheckout(). */
type CheckoutPresentation = "redirect" | "embedded";

/** Parameters for createCheckout(). */
interface CreateCheckoutParams {
  /** Items to sell, 1 to 100 entries. */
  items: CheckoutItem[];
  /** Three-letter ISO currency code, e.g. 'usd'. Defaults to the payment account's currency. Required for PayPal. */
  currency?: string;
  /** App-relative path the buyer returns to after paying. Must start with '/'. */
  success_path: string;
  /** App-relative path the buyer returns to after canceling. Not supported for Stripe embedded checkout. */
  cancel_path?: string;
  /** Details about the buyer, used to prefill the checkout. */
  buyer?: CheckoutBuyer;
  /** Your own key-value pairs, up to 50 keys. Returned in `metadata` to service-role callers only. Not supported for PayPal. */
  metadata?: Record<string, string>;
  /** Key that makes retries return the same checkout instead of creating another. Not supported for Base44 Payments or PayPal subscriptions. */
  idempotency_key?: string;
  /** Defaults to 'redirect'. PayPal apps must pass 'embedded'; Base44 Payments supports only 'redirect'. */
  presentation?: CheckoutPresentation;
  /** Shipping address and fee. Only for PayPal one-time checkouts with a shippable item; otherwise rejects with `invalid_request`. */
  shipping?: CheckoutShipping;
}

/** Data that Stripe Embedded Checkout needs to render. */
interface StripeEmbeddedCheckout {
  provider: "stripe";
  /** Stripe publishable key of the app's payment account. */
  publishable_key: string;
  /** Client secret of the Stripe Checkout Session. */
  client_secret: string;
}

/** Data that the PayPal button needs to render. */
interface PayPalEmbeddedCheckout {
  provider: "paypal";
  client_id: string;
  /** PayPal merchant ID of the app's seller account. */
  merchant_id: string;
  partner_attribution_id?: string | null;
  /** Whether the checkout is a one-time payment or a subscription. */
  intent: "capture" | "subscription";
}

/** Data an embedded checkout needs to render, by provider. */
type EmbeddedCheckout = StripeEmbeddedCheckout | PayPalEmbeddedCheckout;

/** Result of createCheckout(). Exactly one of `redirect_url`/`embedded` is set, based on `presentation`. */
interface CreateCheckoutResult {
  /** ID of the checkout (Stripe Checkout Session ID, or PayPal order/subscription ID). */
  checkout_id: string;
  /** Three-letter ISO currency code, lowercase. */
  currency: string;
  /** Amount the buyer pays now, in minor units. 0 for a subscription starting with a free trial. */
  amount_total: number;
  /** Absolute URL of the provider's hosted checkout page, for redirect checkouts. */
  redirect_url: string | null;
  /** Data for mountCheckout(), for embedded checkouts. */
  embedded: EmbeddedCheckout | null;
}

/** Result of completeCheckout(). */
interface CompleteCheckoutResult {
  checkout_id: string;
  /** Whether the payment went through or the provider is still processing it. */
  status: "paid" | "pending";
}

/** Status of a purchase. 'unknown' means the provider reported a state that doesn't map to the others. */
type PurchaseStatus = "pending" | "paid" | "refunded" | "canceled" | "failed" | "unknown";

/** A line item of a purchase. */
interface PurchaseItem {
  name: string;
  amount?: number | null;
  quantity?: number | null;
}

/** A completed or in-progress checkout. */
interface Purchase {
  /** ID of the checkout the purchase came from. */
  checkout_id: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  amount_total?: number | null;
  /** Three-letter ISO currency code, lowercase. */
  currency?: string | null;
  buyer_email?: string | null;
  /** The metadata passed to createCheckout(). Always null unless called with the service role. */
  metadata?: Record<string, string> | null;
  /** ID of the subscription, for recurring purchases. */
  subscription_id?: string | null;
  /** Shipping address. Always null unless called with the service role. */
  shipping_address?: ShippingAddress | null;
  shipping_amount?: number | null;
  /** ID of the payment to pass to refund(). Null when the provider doesn't name one (e.g. an already-refunded PayPal subscription charge). */
  payment_id?: string | null;
}

/** Parameters for listPurchases() (frontend, `base44.payments`). */
interface ListPurchasesParams {
  /** Only return the purchase from this checkout. */
  checkout_id?: string;
  /** Only return purchases of this subscription. */
  subscription_id?: string;
  /** Max results, 1-100. Defaults to 20. */
  limit?: number;
  /** The `next_cursor` from the previous page. */
  cursor?: string;
}

/** Parameters for listPurchases() with the service role; adds buyer_email. */
interface ServiceRoleListPurchasesParams extends ListPurchasesParams {
  /** Only return purchases made with this email address. */
  buyer_email?: string;
}

/** A page of purchases. */
interface ListPurchasesResult {
  items: Purchase[];
  /** Cursor for the next page, or null on the last page. */
  next_cursor: string | null;
}

/** Parameters for refund(). */
interface RefundParams {
  /** The `payment_id` of the purchase to refund. */
  payment_id: string;
  /** Amount to refund as an integer in minor units. Must be greater than 0. */
  amount: number;
  /** Key that makes retries return the original refund instead of refunding twice, 1-100 characters. */
  idempotency_key: string;
}

/** Result of refund(). */
interface RefundResult {
  refund_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending";
}

/** Options for cancelSubscription(). */
interface CancelSubscriptionOptions {
  /** Cancel at period end instead of now. Defaults to false. Not supported for PayPal. */
  at_period_end?: boolean;
}

/** State of a subscription after a change. */
interface SubscriptionResult {
  subscription_id: string;
  status: "active" | "past_due" | "paused" | "canceled";
  /** Whether the subscription will cancel at the end of the current billing period. */
  cancel_at_period_end: boolean;
}

/** Error codes payments methods set on a Base44Error's `code`. See Error Codes above. */
type PaymentsErrorCode =
  | "forbidden" | "unauthenticated" | "not_found" | "conflict" | "rate_limited"
  | "payments_not_connected" | "invalid_request" | "invalid_items"
  | "amount_below_minimum" | "currency_mismatch" | "currency_required"
  | "invalid_metadata" | "idempotency_not_supported" | "idempotency_key_reused"
  | "multiple_subscription_items" | "recurring_option_not_supported" | "invalid_cursor"
  | "presentation_not_supported" | "embedded_checkout_unavailable" | "checkout_not_found"
  | "checkout_not_approved" | "checkout_closed" | "payment_declined" | "complete_not_supported"
  | "provider_unavailable" | "payment_not_found" | "refund_rejected" | "refund_in_progress"
  | "refund_amount_mismatch" | "refund_temporarily_unavailable" | "refund_failed"
  | "refund_not_supported" | "subscription_not_found" | "subscription_not_active"
  | "subscription_action_not_supported";

/** Callbacks for mountCheckout(). */
interface MountCheckoutOptions {
  /** Called after a PayPal payment is approved and completed. UI hint only — don't grant access from it. Stripe never calls this. */
  onComplete?: (result: CompleteCheckoutResult) => void;
  /** Called when the buyer closes the PayPal window without paying. The button stays mounted. */
  onCancel?: () => void;
  /** Called when a mounted PayPal checkout fails, including `payment_declined`. The button stays mounted so the buyer can retry. */
  onError?: (error: unknown) => void;
}

/** An element on the page to render the checkout in, e.g. the result of document.getElementById(). */
interface CheckoutElement {
  appendChild(node: never): unknown;
}

/** The fields of CreateCheckoutResult that mountCheckout() reads. */
interface MountableCheckout {
  checkout_id: string;
  currency: string;
  /** Mounting rejects when this is null. */
  embedded: EmbeddedCheckout | null;
}

/** A mounted embedded checkout. */
interface CheckoutMount {
  /** Removes the checkout from the page. Call when the owning component unmounts. */
  destroy: () => void;
}

/** Payments module for anonymous/user authentication, via base44.payments. */
interface PaymentsModule {
  preloadCheckout(provider: "paypal" | "stripe"): Promise<void>;
  mountCheckout(element: CheckoutElement, checkout: MountableCheckout, options?: MountCheckoutOptions): Promise<CheckoutMount>;
  completeCheckout(checkoutId: string): Promise<CompleteCheckoutResult>;
  listPurchases(params?: ListPurchasesParams): Promise<ListPurchasesResult>;
}

/** Payments module for service-role authentication, via base44.asServiceRole.payments. Backend only. */
interface ServiceRolePaymentsModule {
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;
  completeCheckout(checkoutId: string): Promise<CompleteCheckoutResult>;
  listPurchases(params?: ServiceRoleListPurchasesParams): Promise<ListPurchasesResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  cancelSubscription(subscriptionId: string, options?: CancelSubscriptionOptions): Promise<SubscriptionResult>;
  pauseSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  resumeSubscription(subscriptionId: string): Promise<SubscriptionResult>;
}
```
