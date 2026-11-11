# Payments Module

Accept one-time payments and subscriptions through the app's connected payment provider. Frontend access via `base44.payments`; elevated operations via `base44.asServiceRole.payments` (backend only).

## Contents
- [Overview](#overview)
- [Providers](#providers)
- [Methods (`base44.payments`)](#methods-base44payments)
- [Service Role Methods (`base44.asServiceRole.payments`)](#service-role-methods-base44asservicerolepayments)
- [Error Handling](#error-handling)
- [Notes](#notes)
- [Type Definitions](#type-definitions)

---

## Overview

The payments module provides:
- Checkouts for one-time payments and subscriptions, on the provider's hosted page (redirect) or embedded in the app
- Purchase lookup
- Refunds
- Subscription management: cancel, pause, resume

Each app connects exactly one payment provider: **Stripe**, **PayPal**, or **Base44 Payments** (powered by Wix).

Two authentication modes expose **different method sets**:

| | `base44.payments` (anonymous/user) | `base44.asServiceRole.payments` (backend) |
|---|---|---|
| Purpose | Preload and mount embedded checkouts, complete PayPal checkouts, list the current user's own purchases | Create checkouts, list any purchase, refund payments, change subscriptions |
| Where | Frontend (browser) | Backend functions only |

Checkouts are always **created with the service role** (`createCheckout`) — only a backend function can create one. The result (or, for PayPal, an on-click spec) is then passed to `base44.payments.mountCheckout()` on the page, or the buyer is redirected to `redirect_url`.

## Providers

Not every provider supports every operation:

| | Stripe | PayPal | Base44 Payments |
| :- | :- | :- | :- |
| Redirect checkout | Yes | No | Yes |
| Embedded checkout | Yes | Yes, required | No |
| Refunds | Yes | Yes | No |
| Subscription cancellation | Yes, now or at period end | Yes, now only | No |
| Subscription pause and resume | Yes | Yes | No |

---

## Methods (`base44.payments`)

Anonymous or user authentication.

| Method | Signature | Description |
|--------|-----------|-------------|
| `preloadCheckout(provider)` | `Promise<void>` | Starts downloading the provider's JS library ahead of mounting, so the checkout appears faster |
| `mountCheckout(element, checkout, options?)` | `Promise<CheckoutMount>` | Renders an embedded checkout (or a PayPal button) inside a page element |
| `completeCheckout(checkoutId)` | `Promise<CompleteCheckoutResult>` | Completes a PayPal checkout after the buyer approves it |
| `listPurchases(params?)` | `Promise<ListPurchasesResult>` | Lists the current user's own purchases |

### preloadCheckout(provider)

Starts downloading Stripe.js or the PayPal JS SDK before a checkout is mounted. Call it when the checkout page or form opens, while the buyer is still filling it in. `mountCheckout()` loads the library itself if it wasn't preloaded.

Never rejects — no need to await it or catch errors. If the library fails to load, `mountCheckout()` retries and rejects with the error. Requires a browser environment; skipped in the backend.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `provider` | `"paypal" \| "stripe"` | The provider the app is connected to | Yes |

**Returns:** `Promise<void>` — resolves once the library has loaded or failed to load.

```javascript
// Preload PayPal as soon as the checkout form opens
base44.payments.preloadCheckout('paypal');
```

### mountCheckout(element, checkout, options?)

Renders an embedded checkout inside a page element. `checkout` is the result of `base44.asServiceRole.payments.createCheckout()` called with `presentation: 'embedded'` (create it in a backend function and return the result to the page — only the service role can create checkouts). For PayPal, you can instead pass a `PayPalCheckoutOnClick` spec so the button renders immediately and the checkout is created only when the buyer clicks (so visitors who don't buy don't leave unused checkouts behind).

Behavior by provider:
- **PayPal:** Renders a PayPal button. When the buyer approves, the SDK calls `completeCheckout()` for you and then `onComplete`.
- **Stripe:** Mounts Stripe Embedded Checkout. After paying, the buyer returns to the checkout's `success_path`. Stripe allows one embedded checkout per page — mounting another destroys the previous one.

Requires a browser environment; cannot be used in the backend. Rejects when: the checkout isn't embedded, an on-click PayPal checkout is mounted before the app's PayPal can take payments, the payments config can't be fetched or has no valid script URL, the provider's library fails to load, or PayPal isn't available for the checkout's currency.

**Security:** The checkout's callbacks run in the buyer's browser and can be faked. Grant access to what the buyer paid for only after your backend confirms the purchase (e.g. with the service-role `listPurchases()` in a backend function).

| Parameter | Type | Description | Required |
|---|---|---|---|
| `element` | `CheckoutElement` | Element to render the checkout in (e.g. `document.getElementById(...)`). Should be empty | Yes |
| `checkout` | `MountableCheckout \| PayPalCheckoutOnClick` | Result of service-role `createCheckout()`, or a PayPal on-click spec that creates it when clicked | Yes |
| `options` | `MountCheckoutOptions` | `onComplete`, `onCancel`, `onError` callbacks | No |

**Returns:** `Promise<CheckoutMount>` — resolves once the checkout renders. Has `destroy()` and `setDisabled(disabled)`.

```javascript
// Mount a checkout created in a backend function
const { data: checkout } = await base44.functions.invoke('createCheckout', { planId });

const mount = await base44.payments.mountCheckout(
  document.getElementById('checkout'),
  checkout,
  {
    onComplete: ({ status }) => navigate(status === 'paid' ? '/thank-you' : '/processing'),
    onError: () => setError('The payment failed. Please try again.'),
  }
);

// Later, when the page unmounts
mount.destroy();
```

```javascript
// PayPal: create the checkout only when the buyer clicks
const mount = await base44.payments.mountCheckout(
  document.getElementById('paypal'),
  {
    provider: 'paypal',
    currency: 'usd',
    intent: 'capture',
    createCheckout: async () =>
      (await base44.functions.invoke('createCheckout', { productId })).data,
  },
  { onComplete: ({ checkout_id }) => confirmPurchase(checkout_id) }
);

// Gray out the button until a required form is valid
mount.setDisabled(!formIsValid);
```

### completeCheckout(checkoutId)

Completes a PayPal checkout after the buyer approves it. `mountCheckout()` calls this for you — call it directly only if you render your own PayPal button. Calling it again for the same checkout returns the same result. Only PayPal checkouts need completing; other providers reject with `complete_not_supported`.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `checkoutId` | `string` | The `checkout_id` from `createCheckout()` | Yes |

**Returns:** `Promise<CompleteCheckoutResult>` — `{ checkout_id, status: 'paid' | 'pending' }`.

```javascript
// In your own PayPal onApprove handler
const { status } = await base44.payments.completeCheckout(checkoutId);
if (status === 'paid') {
  showThankYou();
}
```

### listPurchases(params?)

Lists the **current user's** purchases (a purchase belongs to the user when it was made with the user's email address). Rejects with `forbidden` for anonymous authentication.

PayPal can't list purchases, so for PayPal apps pass `checkout_id` or `subscription_id` to look up that one purchase — without either, the call rejects with `invalid_request`.

To confirm a purchase in a backend function before granting access, or to look up any buyer's purchases, use the service-role `listPurchases()` instead.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `params.checkout_id` | `string` | Only return the purchase from this checkout | No |
| `params.subscription_id` | `string` | Only return purchases of this subscription | No |
| `params.limit` | `number` | Max purchases to return, 1–100. Defaults to 20 | No |
| `params.cursor` | `string` | `next_cursor` from the previous page (send with the same filters/limit) | No |

**Returns:** `Promise<ListPurchasesResult>` — `{ items: Purchase[], next_cursor: string | null }`.

```javascript
// Stripe success page: session_id query param is the checkout ID
const checkoutId = new URLSearchParams(window.location.search).get('session_id');
const { items: [purchase] } = await base44.payments.listPurchases({ checkout_id: checkoutId });
if (purchase?.status === 'paid') showThankYou();
```

```javascript
// Page through purchases
let cursor;
do {
  const page = await base44.payments.listPurchases({ limit: 50, cursor });
  page.items.forEach((p) => console.log(p.checkout_id, p.status));
  cursor = page.next_cursor ?? undefined;
} while (cursor);
```

---

## Service Role Methods (`base44.asServiceRole.payments`)

> **Backend only.** Call from backend functions using `createClientFromRequest(req)`. Not every provider supports every operation — see [Providers](#providers).

Refunds take a required `idempotency_key`, and checkouts take an optional one, so retrying doesn't charge or refund twice. Repeating a subscription change returns the subscription's current state.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createCheckout(params)` | `Promise<CreateCheckoutResult>` | Creates a redirect or embedded checkout (or subscription) |
| `completeCheckout(checkoutId)` | `Promise<CompleteCheckoutResult>` | Completes a PayPal checkout from the backend |
| `listPurchases(params?)` | `Promise<ListPurchasesResult>` | Lists **any** buyer's purchases, with `metadata` |
| `refund(params)` | `Promise<RefundResult>` | Refunds all or part of a payment |
| `cancelSubscription(subscriptionId, options?)` | `Promise<SubscriptionResult>` | Cancels a subscription, now or at period end |
| `pauseSubscription(subscriptionId)` | `Promise<SubscriptionResult>` | Pauses a subscription's billing |
| `resumeSubscription(subscriptionId)` | `Promise<SubscriptionResult>` | Resumes a paused subscription's billing |

### createCheckout(params)

Creates a checkout — either a redirect checkout (buyer leaves the app for the provider's hosted page) or an embedded checkout (renders inside the app), chosen with `presentation` (defaults to `'redirect'`). A checkout with a `recurring` item creates a subscription.

After creating: for a redirect checkout, send the buyer to `redirect_url`; for an embedded checkout, return the result to the page and pass it to `base44.payments.mountCheckout()`.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `params.items` | `CheckoutItem[]` | Items to sell, 1–100 entries | Yes |
| `params.currency` | `string` | 3-letter ISO currency code (e.g. `'usd'`). Defaults to the payment account's currency. **Required for PayPal** | No |
| `params.success_path` | `string` | App-relative path the buyer returns to after paying. Must start with `/` | Yes |
| `params.cancel_path` | `string` | App-relative path after canceling. Must start with `/`. Not supported for Stripe embedded checkout | No |
| `params.buyer` | `CheckoutBuyer` | Buyer details to prefill the checkout (`email`, `first_name`, `last_name`, `phone`) | No |
| `params.metadata` | `Record<string, string>` | Your own key-value pairs, up to 50 keys. Returned in `Purchase.metadata` to service-role callers only. Not supported for PayPal | No |
| `params.idempotency_key` | `string` | Makes retries return the same checkout instead of creating another, 1–200 chars. Not supported for Base44 Payments or PayPal subscriptions | No |
| `params.presentation` | `"redirect" \| "embedded"` | How the buyer pays. Defaults to `'redirect'`. PayPal apps must pass `'embedded'`; Base44 Payments supports only `'redirect'` | No |
| `params.shipping` | `CheckoutShipping` | Shipping address/fee. Allowed only when at least one item is `shippable`. Supported for PayPal one-time checkouts only; other providers/subscriptions reject with `invalid_request` | No |

**Returns:** `Promise<CreateCheckoutResult>` — exactly one of `redirect_url` and `embedded` is set, depending on `presentation`.

```javascript
// Redirect checkout
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

```javascript
// Embedded subscription checkout with a free trial
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
  // Pass this to base44.payments.mountCheckout() on the page
  return Response.json(checkout);
});
```

> Compute shipping fees in a backend function, never in the browser. If the fee depends on the address, collect the address in your app and pass it in `shipping.address` — PayPal then shows that address to the buyer locked. If the fee doesn't depend on the address, pass only `shipping.amount` and let PayPal ask the buyer.

### completeCheckout(checkoutId)

Same behavior as the frontend method, callable from a backend function — use it when you render your own PayPal button and its `onApprove` handler sends the checkout ID to your backend.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `checkoutId` | `string` | The `checkout_id` from `createCheckout()` | Yes |

**Returns:** `Promise<CompleteCheckoutResult>`.

```javascript
const { status } = await base44.asServiceRole.payments.completeCheckout(checkoutId);
```

### listPurchases(params?)

Unlike `base44.payments.listPurchases()`, returns **any** buyer's purchases and includes `metadata`. Same PayPal restriction: pass `checkout_id` or `subscription_id` for PayPal apps, or it rejects with `invalid_request`.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `params.checkout_id` | `string` | Only return the purchase from this checkout | No |
| `params.subscription_id` | `string` | Only return purchases of this subscription | No |
| `params.buyer_email` | `string` | Only return purchases made with this email address | No |
| `params.limit` | `number` | Max purchases to return, 1–100. Defaults to 20 | No |
| `params.cursor` | `string` | `next_cursor` from the previous page | No |

**Returns:** `Promise<ListPurchasesResult>`.

```javascript
// Confirm a purchase before granting access
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { checkoutId } = await req.json();
  const { items: [purchase] } = await base44.asServiceRole.payments.listPurchases({
    checkout_id: checkoutId,
  });
  if (purchase?.status !== 'paid') {
    return Response.json({ error: 'Payment not confirmed' }, { status: 402 });
  }
  return Response.json({ ok: true });
});
```

```javascript
// Find a buyer's purchases (not available for PayPal apps without checkout_id/subscription_id)
const { items } = await base44.asServiceRole.payments.listPurchases({
  buyer_email: 'buyer@example.com',
});
```

### refund(params)

Refunds all or part of a payment. Not supported for Base44 Payments. Retrying with the same `idempotency_key` and `amount` returns the original refund instead of refunding twice — if the call rejects with `refund_failed`, the outcome is unknown, so retry with the same values.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `params.payment_id` | `string` | The `payment_id` of the purchase to refund | Yes |
| `params.amount` | `number` | Amount to refund, integer in minor units, must be > 0 | Yes |
| `params.idempotency_key` | `string` | Makes retries return the original refund instead of refunding twice, 1–100 chars | Yes |

**Returns:** `Promise<RefundResult>`.

```javascript
const { items } = await base44.asServiceRole.payments.listPurchases({ checkout_id: checkoutId });
const purchase = items[0];

const refund = await base44.asServiceRole.payments.refund({
  payment_id: purchase.payment_id,
  amount: purchase.amount_total,
  idempotency_key: `refund-${checkoutId}`,
});
```

### cancelSubscription(subscriptionId, options?)

Cancels a subscription, now or at the end of the current billing period. Not supported for Base44 Payments. PayPal supports canceling now only.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `subscriptionId` | `string` | The `subscription_id` of the purchase | Yes |
| `options.at_period_end` | `boolean` | Cancel at period end instead of now. Defaults to `false`. Not supported for PayPal | No |

**Returns:** `Promise<SubscriptionResult>`.

```javascript
await base44.asServiceRole.payments.cancelSubscription(subscriptionId, {
  at_period_end: true,
});
```

### pauseSubscription(subscriptionId)

Pauses a subscription's billing. Not supported for Base44 Payments.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `subscriptionId` | `string` | The `subscription_id` of the purchase | Yes |

**Returns:** `Promise<SubscriptionResult>`.

```javascript
await base44.asServiceRole.payments.pauseSubscription(subscriptionId);
```

### resumeSubscription(subscriptionId)

Resumes a paused subscription's billing. Not supported for Base44 Payments.

| Parameter | Type | Description | Required |
|---|---|---|---|
| `subscriptionId` | `string` | The `subscription_id` of the purchase | Yes |

**Returns:** `Promise<SubscriptionResult>`.

```javascript
await base44.asServiceRole.payments.resumeSubscription(subscriptionId);
```

---

## Error Handling

Payments methods reject with a `Base44Error` (`error.status`, `error.code`, `error.message`, `error.originalError`) whose `code` is a `PaymentsErrorCode`. Invalid arguments and `mountCheckout()` failures reject with a plain `Error` instead.

Notable codes:

| Code | Meaning |
|---|---|
| `payment_declined` | The buyer's payment method was declined completing the checkout. The buyer can retry with another method |
| `refund_failed` | The refund's outcome is unknown. Retry with the same `idempotency_key` and `amount` — returns the original refund if one was made |
| `refund_in_progress` | A refund with the same `idempotency_key` is still running |
| `refund_amount_mismatch` | The `idempotency_key` was already used for a different amount |
| `rate_limited` | Too many requests. Wait for the seconds in the `Retry-After` header: `error.originalError.response.headers['retry-after']` |
| `refund_not_supported`, `subscription_action_not_supported`, `complete_not_supported`, `presentation_not_supported` | The app's payment provider doesn't support the operation |

The full `PaymentsErrorCode` union also includes: `forbidden`, `unauthenticated`, `not_found`, `conflict`, `payments_not_connected`, `invalid_request`, `invalid_items`, `amount_below_minimum`, `currency_mismatch`, `currency_required`, `invalid_metadata`, `idempotency_not_supported`, `idempotency_key_reused`, `multiple_subscription_items`, `recurring_option_not_supported`, `invalid_cursor`, `embedded_checkout_unavailable`, `checkout_not_found`, `checkout_not_approved`, `checkout_closed`, `provider_unavailable`, `payment_not_found`, `refund_rejected`, `refund_temporarily_unavailable`, `subscription_not_found`, `subscription_not_active`.

```javascript
try {
  await base44.asServiceRole.payments.refund({ payment_id, amount, idempotency_key });
} catch (error) {
  if (error.code === 'refund_failed') {
    // Outcome unknown — safe to retry with the same idempotency_key and amount
  } else if (error.code === 'refund_not_supported') {
    // Base44 Payments doesn't support refunds
  }
}
```

---

## Notes

| Environment | Availability |
|---|---|
| Frontend (`base44.payments`) | `preloadCheckout`, `mountCheckout` (browser only), `completeCheckout`, `listPurchases` (current user only, rejects `forbidden` for anonymous auth) |
| Backend functions (`base44.asServiceRole.payments`) | `createCheckout`, `completeCheckout`, `listPurchases` (any buyer), `refund`, `cancelSubscription`, `pauseSubscription`, `resumeSubscription` |

- Checkouts can only be **created** with the service role — there is no frontend `createCheckout`. Create it in a backend function and pass the result to `mountCheckout()`, or redirect the buyer to `redirect_url`.
- `mountCheckout()` and `preloadCheckout()` require a browser environment (`window`/`document`) and are not usable in backend functions.
- `Purchase.metadata` and `Purchase.shipping_address` are always `null` unless the call is made with the service role.
- `Purchase.payment_id` is the ID to pass to `refund()`. For a PayPal subscription it's the latest charge, and it's returned only with the service role.

---

## Type Definitions

```typescript
/** How often a recurring item bills. */
type PaymentsRecurringFrequency = "day" | "week" | "month" | "year";

/** Free trial before the first charge of a recurring item. */
interface CheckoutFreeTrial {
  /** Stripe supports only 'day' and 'week'. */
  frequency: PaymentsRecurringFrequency;
  /** 1 to 999. */
  interval: number;
}

/** Billing terms that turn a checkout item into a subscription. */
interface CheckoutItemRecurring {
  frequency: PaymentsRecurringFrequency;
  /** 1 to 3650. Defaults to 1. */
  interval?: number;
  /** Stripe doesn't support false. */
  auto_renewal?: boolean;
  /** At least 1. Omit for no limit. Not supported for Stripe. */
  billing_cycles?: number;
  /** Stripe applies one trial to the whole checkout; every recurring item must request the same trial. */
  free_trial?: CheckoutFreeTrial;
  /** Up to 150 characters. */
  title?: string;
  /** Up to 500 characters. */
  description?: string;
}

/** A line item in a checkout. */
interface CheckoutItem {
  /** 1 to 255 characters. */
  name: string;
  /** Integer in minor units (e.g. cents). Must be > 0. */
  amount: number;
  /** 1 to 1,000,000. Defaults to 1. */
  quantity?: number;
  /** Collects a shipping address unless you pass one in shipping.address. */
  shippable?: boolean;
  /** PayPal and Base44 Payments allow one recurring item per checkout; PayPal allows no other items with it. */
  recurring?: CheckoutItemRecurring;
}

/** Details about the buyer, used to prefill the checkout. */
interface CheckoutBuyer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/** A shipping address. Returned on a purchase whether your app or the provider collected it. */
interface ShippingAddress {
  name: string;
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
  /** Omit to let the provider ask the buyer. */
  address?: ShippingAddress;
  /** Integer in minor units. Omit for free shipping. */
  amount?: number;
}

/** How the buyer pays: 'redirect' (hosted page) or 'embedded' (mountCheckout()). */
type CheckoutPresentation = "redirect" | "embedded";

/** Parameters for createCheckout(). */
interface CreateCheckoutParams {
  items: CheckoutItem[];
  currency?: string;
  success_path: string;
  cancel_path?: string;
  buyer?: CheckoutBuyer;
  metadata?: Record<string, string>;
  idempotency_key?: string;
  presentation?: CheckoutPresentation;
  shipping?: CheckoutShipping;
}

/** Data Stripe Embedded Checkout needs to render. */
interface StripeEmbeddedCheckout {
  provider: "stripe";
  publishable_key: string;
  client_secret: string;
}

/** Data the PayPal button needs to render. */
interface PayPalEmbeddedCheckout {
  provider: "paypal";
  client_id: string;
  merchant_id: string;
  partner_attribution_id?: string | null;
  intent: "capture" | "subscription";
}

type EmbeddedCheckout = StripeEmbeddedCheckout | PayPalEmbeddedCheckout;

/** Result of createCheckout(). Exactly one of redirect_url/embedded is set. */
interface CreateCheckoutResult {
  /** Stripe Checkout Session ID, or the PayPal order/subscription ID. */
  checkout_id: string;
  currency: string;
  /** 0 for a subscription that starts with a free trial. */
  amount_total: number;
  redirect_url: string | null;
  embedded: EmbeddedCheckout | null;
}

/** Result of completeCheckout(). */
interface CompleteCheckoutResult {
  checkout_id: string;
  status: "paid" | "pending";
}

/** Status of a purchase. */
type PurchaseStatus =
  | "pending"    // buyer hasn't finished paying, or provider still processing
  | "paid"
  | "refunded"
  | "canceled"
  | "failed"
  | "unknown";   // provider reported a state that doesn't map to the others

interface PurchaseItem {
  name: string;
  amount?: number | null;
  quantity?: number | null;
}

/** A completed or in-progress checkout. */
interface Purchase {
  checkout_id: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  amount_total?: number | null;
  currency?: string | null;
  buyer_email?: string | null;
  /** Always null unless called with the service role. */
  metadata?: Record<string, string> | null;
  subscription_id?: string | null;
  /** Always null unless called with the service role. */
  shipping_address?: ShippingAddress | null;
  shipping_amount?: number | null;
  /** ID to pass to refund(). For a PayPal subscription it's the latest charge (service role only). Null when the provider doesn't name a payment. */
  payment_id?: string | null;
}

/** Parameters for base44.payments.listPurchases(). */
interface ListPurchasesParams {
  checkout_id?: string;
  subscription_id?: string;
  /** 1 to 100. Defaults to 20. */
  limit?: number;
  cursor?: string;
}

/** Parameters for the service-role listPurchases(). */
interface ServiceRoleListPurchasesParams extends ListPurchasesParams {
  buyer_email?: string;
}

interface ListPurchasesResult {
  items: Purchase[];
  next_cursor: string | null;
}

/** Parameters for refund(). */
interface RefundParams {
  payment_id: string;
  /** Integer in minor units, must be > 0. */
  amount: number;
  /** 1 to 100 characters. */
  idempotency_key: string;
}

interface RefundResult {
  refund_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending";
}

/** Options for cancelSubscription(). */
interface CancelSubscriptionOptions {
  /** Defaults to false. Not supported for PayPal. */
  at_period_end?: boolean;
}

/** State of a subscription after a change. */
interface SubscriptionResult {
  subscription_id: string;
  status: "active" | "past_due" | "paused" | "canceled";
  cancel_at_period_end: boolean;
}

/** Error codes set as `code` on a Base44Error when payments methods reject. */
type PaymentsErrorCode =
  | "forbidden" | "unauthenticated" | "not_found" | "conflict" | "rate_limited"
  | "payments_not_connected" | "invalid_request" | "invalid_items"
  | "amount_below_minimum" | "currency_mismatch" | "currency_required"
  | "invalid_metadata" | "idempotency_not_supported" | "idempotency_key_reused"
  | "multiple_subscription_items" | "recurring_option_not_supported"
  | "invalid_cursor" | "presentation_not_supported" | "embedded_checkout_unavailable"
  | "checkout_not_found" | "checkout_not_approved" | "checkout_closed"
  | "payment_declined" | "complete_not_supported" | "provider_unavailable"
  | "payment_not_found" | "refund_rejected" | "refund_in_progress"
  | "refund_amount_mismatch" | "refund_temporarily_unavailable" | "refund_failed"
  | "refund_not_supported" | "subscription_not_found" | "subscription_not_active"
  | "subscription_action_not_supported";

/** Callbacks for mountCheckout(). */
interface MountCheckoutOptions {
  /** PayPal only, after the SDK completes the checkout. Stripe returns the buyer to success_path with a session_id query param instead. */
  onComplete?: (result: CompleteCheckoutResult) => void;
  /** Buyer closed the PayPal window without paying. The button stays mounted. */
  onCancel?: () => void;
  /** A mounted PayPal checkout failed, including payment_declined. The button stays mounted so the buyer can retry. */
  onError?: (error: unknown) => void;
}

/** An element on the page to render the checkout in, e.g. document.getElementById(). */
interface CheckoutElement {
  appendChild(node: never): unknown;
}

/** The fields of CreateCheckoutResult that mountCheckout() reads. */
interface MountableCheckout {
  checkout_id: string;
  currency: string;
  /** Mounting rejects when null. */
  embedded: EmbeddedCheckout | null;
}

/** A PayPal checkout mountCheckout() creates when the buyer clicks the button (shows immediately; no order until clicked). */
interface PayPalCheckoutOnClick {
  provider: "paypal";
  currency: string;
  intent: "capture" | "subscription";
  /** Must resolve to an embedded PayPal checkout matching this currency/intent, or onError fires. Reject to stop (e.g. invalid form). */
  createCheckout: () => Promise<MountableCheckout>;
}

/** A mounted embedded checkout. */
interface CheckoutMount {
  /** Removes the checkout from the page. For Stripe, mounting another checkout destroys this one automatically. */
  destroy: () => void;
  /** Grays out PayPal's button and ignores clicks. Stripe ignores this (its own form has no single button). */
  setDisabled: (disabled: boolean) => void;
}

/** Payments module via base44.payments (anonymous/user auth). */
interface PaymentsModule {
  preloadCheckout(provider: "paypal" | "stripe"): Promise<void>;
  mountCheckout(
    element: CheckoutElement,
    checkout: MountableCheckout | PayPalCheckoutOnClick,
    options?: MountCheckoutOptions
  ): Promise<CheckoutMount>;
  completeCheckout(checkoutId: string): Promise<CompleteCheckoutResult>;
  listPurchases(params?: ListPurchasesParams): Promise<ListPurchasesResult>;
}

/** Payments module via base44.asServiceRole.payments (backend only). */
interface ServiceRolePaymentsModule {
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;
  completeCheckout(checkoutId: string): Promise<CompleteCheckoutResult>;
  listPurchases(params?: ServiceRoleListPurchasesParams): Promise<ListPurchasesResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  cancelSubscription(
    subscriptionId: string,
    options?: CancelSubscriptionOptions
  ): Promise<SubscriptionResult>;
  pauseSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  resumeSubscription(subscriptionId: string): Promise<SubscriptionResult>;
}
```
