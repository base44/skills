# Payments Module

Embedded checkout for one-time purchases and subscriptions, through the app's connected payment provider — Stripe, PayPal, or Base44 Payments (powered by Wix). Anonymous and user-mode calls (`base44.payments`) preload and mount checkouts, complete PayPal checkouts, and list the current user's own purchases. Service-role calls (`base44.asServiceRole.payments`), made from backend functions, create checkouts, list any buyer's purchases, refund payments, and manage subscriptions.

## Contents
- [Providers](#providers)
- [Overview](#overview)
- [Methods](#methods)
- [Type Definitions](#type-definitions)
- [Notes](#notes)

---

## Providers

Each app connects exactly one provider. Support for an operation depends on which one:

| | Stripe | PayPal | Base44 Payments |
| :- | :- | :- | :- |
| Redirect checkout | Yes | No | Yes |
| Embedded checkout | Yes | Yes, required | No |
| Refunds | Yes | Yes | No |
| Subscription cancellation | Yes, now or at period end | Yes, now only | No |
| Subscription pause and resume | Yes | Yes | No |

## Overview

**Frontend (anonymous or user mode, `base44.payments`):**
- `preloadCheckout(provider)` — start downloading the provider's JS library before the buyer reaches the checkout
- `mountCheckout(element, checkout, options?)` — render an embedded checkout created by the service role
- `completeCheckout(checkoutId)` — complete a PayPal checkout (only needed if you render your own PayPal button)
- `listPurchases(params?)` — list the current logged-in user's own purchases

**Backend (service role only, `base44.asServiceRole.payments`, call from backend functions):**
- `createCheckout(params)` — create a redirect or embedded checkout (or subscription)
- `completeCheckout(checkoutId)` — complete a PayPal checkout from the backend
- `listPurchases(params?)` — list any buyer's purchases, with `metadata` and `shipping_address` included
- `refund(params)` — refund all or part of a payment
- `cancelSubscription(subscriptionId, options?)` — cancel a subscription, now or at period end
- `pauseSubscription(subscriptionId)` — pause a subscription's billing
- `resumeSubscription(subscriptionId)` — resume a paused subscription

Only the service role can create checkouts, so an embedded checkout's typical flow is: a backend function calls `createCheckout()` and returns the result to the page, and the page passes that result to `base44.payments.mountCheckout()`.

---

## Methods

### `mountCheckout(element, checkout, options?)` (frontend, browser only)

Renders an embedded checkout inside an element on the page. Requires a browser environment — rejects immediately in the backend.

Pass the result of a service-role `createCheckout()` call made with `presentation: 'embedded'`. The SDK loads the provider's library and renders the checkout:
- **PayPal:** renders a PayPal button. When the buyer approves the payment, the SDK calls `completeCheckout()` for you and then `onComplete`.
- **Stripe:** mounts Stripe Embedded Checkout. After paying, the buyer returns to the checkout's `success_path`. Stripe allows only one embedded checkout per page — mounting another destroys the previous one.

For PayPal, you can pass a `PayPalCheckoutOnClick` instead of an already-created checkout, to show the PayPal button immediately and create the checkout only when the buyer clicks it (so page views never create orders).

Rejects when the checkout isn't embedded, when an on-click PayPal checkout is mounted before the app's PayPal can take payments, when the payments config can't be fetched or has no valid script URL for the provider, when the provider's library fails to load, or when PayPal isn't available for the checkout's currency.

The checkout's callbacks run in the buyer's browser, where they can be faked — grant access to what the buyer paid for only after your backend confirms the purchase (e.g. with service-role `listPurchases()`).

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `element` | `CheckoutElement` | Element to render the checkout in (e.g. `document.getElementById(...)`). Should be empty. |
| `checkout` | `MountableCheckout \| PayPalCheckoutOnClick` | The result of service-role `createCheckout()`, or for PayPal a `PayPalCheckoutOnClick` that creates the checkout when the buyer clicks. |
| `options` | `MountCheckoutOptions` (optional) | `onComplete`, `onCancel`, `onError` callbacks for the checkout's outcome. |

**Returns:** `Promise<CheckoutMount>` — resolves once the checkout renders. `CheckoutMount` has `destroy()` (removes the checkout; call when the owning component unmounts) and `setDisabled(disabled)` (PayPal only: greys out the button and ignores clicks; Stripe ignores it).

**Example**

```typescript
// Create the checkout in a backend function first
const { data: checkout } = await base44.functions.invoke('createCheckout', { planId });

const mount = await base44.payments.mountCheckout(
  document.getElementById('checkout')!,
  checkout,
  {
    onComplete: ({ status }) => navigate(status === 'paid' ? '/thank-you' : '/processing'),
    onError: () => setError('The payment failed. Please try again.'),
  }
);

// Later, when the page unmounts
mount.destroy();
```

```typescript
// PayPal: show the button on page load, create the checkout only on click
const mount = await base44.payments.mountCheckout(
  document.getElementById('paypal')!,
  {
    provider: 'paypal',
    currency: 'usd',
    intent: 'capture',
    createCheckout: async () =>
      (await base44.functions.invoke('createCheckout', { productId })).data,
  },
  { onComplete: ({ checkout_id }) => confirmPurchase(checkout_id) }
);

// Grey out the button until a required form is valid
mount.setDisabled(!formIsValid);
```

---

### `preloadCheckout(provider)` (frontend, browser only)

Starts downloading the provider's JavaScript library (Stripe.js or the PayPal JavaScript SDK) ahead of mounting, so the checkout appears faster when the buyer reaches it. Call it when the checkout page or form opens, while the buyer is still filling it in.

Never rejects — you don't need to await it or catch errors. If the library can't load here, `mountCheckout()` tries again later and rejects with the error then. Loading requires a browser environment; it's a no-op in the backend.

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `provider` | `"paypal" \| "stripe"` | The provider the app is connected to. |

**Returns:** `Promise<void>` — resolves once the library has loaded or failed to load.

**Example**

```typescript
base44.payments.preloadCheckout('paypal');
```

---

### `completeCheckout(checkoutId)` (both modes)

Completes a PayPal checkout after the buyer approves it. When you use `mountCheckout()`, it calls this for you — call it directly only if you render your own PayPal button. Calling it again for the same checkout returns the same result (idempotent).

Only PayPal checkouts need completing. Other providers reject with the `complete_not_supported` error code.

Available on both `base44.payments` (user/anon mode) and `base44.asServiceRole.payments` (to complete from a backend function instead, e.g. when your own PayPal `onApprove` handler sends the checkout ID to the backend).

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `checkoutId` | `string` | The `checkout_id` from `createCheckout()`. |

**Returns:** `Promise<CompleteCheckoutResult>` — `{ checkout_id, status: 'paid' | 'pending' }`.

**Example**

```typescript
// In your own PayPal onApprove handler
const { status } = await base44.payments.completeCheckout(checkoutId);
if (status === 'paid') {
  showThankYou();
}
```

---

### `listPurchases(params?)` (both modes — differing params/scope)

Lists purchases. The two modes return different scopes:

- **User mode (`base44.payments.listPurchases`)**: lists the current user's own purchases (a purchase belongs to the user when it was made with the user's email address). Rejects with `forbidden` when the client uses anonymous authentication. `metadata` and `shipping_address` are always `null` here.
- **Service role (`base44.asServiceRole.payments.listPurchases`)**: lists any buyer's purchases, and includes their `metadata` and `shipping_address`. Takes an extra `buyer_email` filter not available in user mode. Use it in a backend function to confirm a purchase before granting access.

PayPal apps can't list purchases freely — pass `checkout_id` or `subscription_id`. The call looks up that one purchase and rejects with `invalid_request` without either.

**Parameters** (`ListPurchasesParams`, service role extends it as `ServiceRoleListPurchasesParams`)

| Name | Type | Description |
| :- | :- | :- |
| `checkout_id` | `string` (optional) | Only return the purchase from this checkout. |
| `subscription_id` | `string` (optional) | Only return purchases of this subscription. |
| `limit` | `number` (optional) | Max purchases to return, 1 to 100. Defaults to `20`. |
| `cursor` | `string` (optional) | `next_cursor` from the previous page. Send the same filters and `limit` as that call. |
| `buyer_email` | `string` (optional, **service role only**) | Only return purchases made with this email address. |

**Returns:** `Promise<ListPurchasesResult>` — `{ items: Purchase[], next_cursor: string | null }`.

**Examples**

```typescript
// Check a purchase by checkout ID
const { items } = await base44.payments.listPurchases({ checkout_id: checkoutId });
const paid = items[0]?.status === 'paid';
```

```typescript
// Stripe success page: session_id query parameter is the checkout ID
const checkoutId = new URLSearchParams(window.location.search).get('session_id');
const { items: [purchase] } = await base44.payments.listPurchases({ checkout_id: checkoutId });
if (purchase?.status === 'paid') {
  showThankYou();
}
```

```typescript
// Backend function: confirm a purchase before granting access
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

```typescript
// Service role only: find a buyer's purchases (not available for PayPal apps)
const { items } = await base44.asServiceRole.payments.listPurchases({
  buyer_email: 'buyer@example.com',
});
```

---

### `createCheckout(params)` (service role only)

Creates a checkout. Call it from a backend function — only the service role can create checkouts.

A checkout is either a redirect checkout (the buyer leaves your app for the provider's hosted checkout page) or an embedded checkout (renders inside your app via `mountCheckout()`), chosen with `presentation` (defaults to `'redirect'`). A checkout with a `recurring` item creates a subscription.

After creating the checkout:
- **Redirect:** send the buyer to the returned `redirect_url`.
- **Embedded:** return the result to the page and pass it to `base44.payments.mountCheckout()`.

**Parameters** (`CreateCheckoutParams`)

| Name | Type | Description |
| :- | :- | :- |
| `items` | `CheckoutItem[]` | Items to sell, 1 to 100 entries. |
| `currency` | `string` (optional) | Three-letter ISO currency code (e.g. `'usd'`). Defaults to the payment account's currency. Required for PayPal. |
| `success_path` | `string` | App-relative path the buyer returns to after paying (e.g. `'/thank-you'`). Must start with `/`. |
| `cancel_path` | `string` (optional) | App-relative path after canceling. Must start with `/`. Not supported for Stripe embedded checkout. |
| `buyer` | `CheckoutBuyer` (optional) | Buyer details (`email`, `first_name`, `last_name`, `phone`) to prefill the checkout. |
| `metadata` | `Record<string, string>` (optional) | Your own key-value pairs, up to 50 keys. Returned in each purchase's `metadata` to service-role callers only. Not supported for PayPal. |
| `idempotency_key` | `string` (optional) | Makes retries return the same checkout instead of creating another, 1 to 200 characters. Not supported for Base44 Payments or PayPal subscriptions. |
| `presentation` | `"redirect" \| "embedded"` (optional) | Defaults to `'redirect'`. PayPal apps must pass `'embedded'`; Base44 Payments supports only `'redirect'`. |
| `shipping` | `CheckoutShipping` (optional) | Shipping address/fee. Allowed only when at least one item is `shippable`. Supported for PayPal one-time checkouts only — other providers and subscriptions reject it with `invalid_request`. |

`CheckoutItem`: `name` (1-255 chars), `amount` (integer, minor units, >0), `quantity?` (1 to 1,000,000, default 1), `shippable?`, `recurring?: CheckoutItemRecurring` (set to sell the item as a subscription — PayPal and Base44 Payments allow one recurring item per checkout, and PayPal allows no other items with it).

`CheckoutItemRecurring`: `frequency` (`'day' | 'week' | 'month' | 'year'`), `interval?` (1-3650, default 1), `auto_renewal?` (Stripe doesn't support `false`), `billing_cycles?` (≥1, not supported for Stripe), `free_trial?: CheckoutFreeTrial`, `title?` (≤150 chars), `description?` (≤500 chars).

**Returns:** `Promise<CreateCheckoutResult>` — exactly one of `redirect_url` and `embedded` is set, depending on `presentation`.

**Examples**

```typescript
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

```typescript
// Embedded subscription checkout, with a free trial
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

  // Pass this to base44.payments.mountCheckout() on the page
  return Response.json(checkout);
});
```

---

### `refund(params)` (service role only)

Refunds all or part of a payment. Not supported for Base44 Payments.

Retrying with the same `idempotency_key` and `amount` returns the original refund instead of refunding twice. When the call rejects with `refund_failed`, the outcome is unknown — retry with the same values.

**Parameters** (`RefundParams`)

| Name | Type | Description |
| :- | :- | :- |
| `payment_id` | `string` | The `payment_id` of the purchase to refund. |
| `amount` | `number` | Amount to refund, as an integer in minor units. Must be greater than `0`. |
| `idempotency_key` | `string` | Makes retries return the original refund instead of refunding twice, 1 to 100 characters. |

**Returns:** `Promise<RefundResult>` — `{ refund_id, payment_id, amount, currency, status: 'succeeded' | 'pending' }`.

**Example**

```typescript
const { items } = await base44.asServiceRole.payments.listPurchases({ checkout_id: checkoutId });
const purchase = items[0];

const refund = await base44.asServiceRole.payments.refund({
  payment_id: purchase.payment_id!,
  amount: purchase.amount_total!,
  idempotency_key: `refund-${checkoutId}`,
});
```

---

### `cancelSubscription(subscriptionId, options?)` (service role only)

Cancels a subscription, now or at the end of the current billing period. Not supported for Base44 Payments. PayPal supports canceling now only (passing `at_period_end: true` for a PayPal subscription is rejected or ignored by the provider — see `subscription_action_not_supported`).

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `subscriptionId` | `string` | The `subscription_id` of the purchase. |
| `options` | `CancelSubscriptionOptions` (optional) | `{ at_period_end?: boolean }` — cancel at period end instead of immediately. Defaults to `false`. Not supported for PayPal. |

**Returns:** `Promise<SubscriptionResult>` — `{ subscription_id, status: 'active' | 'past_due' | 'paused' | 'canceled', cancel_at_period_end }`.

**Example**

```typescript
await base44.asServiceRole.payments.cancelSubscription(subscriptionId, {
  at_period_end: true,
});
```

---

### `pauseSubscription(subscriptionId)` (service role only)

Pauses a subscription's billing. Not supported for Base44 Payments.

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `subscriptionId` | `string` | The `subscription_id` of the purchase. |

**Returns:** `Promise<SubscriptionResult>`.

**Example**

```typescript
await base44.asServiceRole.payments.pauseSubscription(subscriptionId);
```

---

### `resumeSubscription(subscriptionId)` (service role only)

Resumes a paused subscription's billing. Not supported for Base44 Payments.

**Parameters**

| Name | Type | Description |
| :- | :- | :- |
| `subscriptionId` | `string` | The `subscription_id` of the purchase. |

**Returns:** `Promise<SubscriptionResult>`.

**Example**

```typescript
await base44.asServiceRole.payments.resumeSubscription(subscriptionId);
```

---

## Type Definitions

```typescript
/** How often a recurring item bills. */
type PaymentsRecurringFrequency = "day" | "week" | "month" | "year";

/** Free trial before the first charge of a recurring item. */
interface CheckoutFreeTrial {
  frequency: PaymentsRecurringFrequency;
  /** 1 to 999. Stripe supports only 'day' and 'week' frequencies. */
  interval: number;
}

/** Billing terms that turn a checkout item into a subscription. */
interface CheckoutItemRecurring {
  frequency: PaymentsRecurringFrequency;
  /** 1 to 3650, defaults to 1. */
  interval?: number;
  /** Stripe doesn't support false. */
  auto_renewal?: boolean;
  /** At least 1; omit for no limit. Not supported for Stripe. */
  billing_cycles?: number;
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
  /** Integer, minor units (e.g. cents). Must be > 0. */
  amount: number;
  /** 1 to 1,000,000. Defaults to 1. */
  quantity?: number;
  shippable?: boolean;
  /** Set to sell as a subscription. PayPal/Base44 Payments: one recurring item per checkout. */
  recurring?: CheckoutItemRecurring;
}

interface CheckoutBuyer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/** Returned on a purchase whether your app or the provider collected it. */
interface ShippingAddress {
  /** 1 to 300 characters. */
  name: string;
  /** 1 to 300 characters. */
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  /** Up to 60 characters. */
  postal_code?: string | null;
  /** Two-letter ISO 3166-1 country code, e.g. 'US'. */
  country: string;
}

interface CheckoutShipping {
  /** Omit to let the provider ask the buyer. */
  address?: ShippingAddress;
  /** Integer, minor units. Omit for free shipping. */
  amount?: number;
}

/**
 * - 'redirect': the buyer leaves the app for the provider's hosted checkout page.
 * - 'embedded': the checkout renders inside the app with mountCheckout().
 */
type CheckoutPresentation = "redirect" | "embedded";

/** Parameters for createCheckout() (service role only). */
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

interface StripeEmbeddedCheckout {
  provider: "stripe";
  publishable_key: string;
  client_secret: string;
}

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
  /** Stripe Checkout Session ID, or PayPal order/subscription ID. */
  checkout_id: string;
  /** Lowercase three-letter ISO currency code. */
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

type PurchaseStatus =
  | "pending"     // buyer hasn't finished paying, or provider is still processing
  | "paid"
  | "refunded"
  | "canceled"
  | "failed"
  | "unknown";    // provider reported a state that doesn't map to the others

interface PurchaseItem {
  name: string;
  amount?: number | null;
  quantity?: number | null;
}

interface Purchase {
  checkout_id: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  amount_total?: number | null;
  currency?: string | null;
  buyer_email?: string | null;
  /** Always null unless called with the service role. */
  metadata?: Record<string, string> | null;
  /** For recurring purchases. */
  subscription_id?: string | null;
  /** Always null unless called with the service role. */
  shipping_address?: ShippingAddress | null;
  shipping_amount?: number | null;
  /**
   * ID to pass to refund(). For a PayPal subscription it's the latest charge,
   * returned only with the service role. Null when the provider doesn't name a
   * payment, e.g. a PayPal subscription whose latest charge is already refunded.
   */
  payment_id?: string | null;
}

interface ListPurchasesParams {
  checkout_id?: string;
  subscription_id?: string;
  /** 1 to 100. Defaults to 20. */
  limit?: number;
  /** next_cursor from the previous page; send the same filters/limit. */
  cursor?: string;
}

/** listPurchases() params with the service role. */
interface ServiceRoleListPurchasesParams extends ListPurchasesParams {
  buyer_email?: string;
}

interface ListPurchasesResult {
  items: Purchase[];
  next_cursor: string | null;
}

interface RefundParams {
  payment_id: string;
  /** Integer, minor units. Must be > 0. */
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

interface CancelSubscriptionOptions {
  /** Defaults to false. Not supported for PayPal. */
  at_period_end?: boolean;
}

interface SubscriptionResult {
  subscription_id: string;
  status: "active" | "past_due" | "paused" | "canceled";
  cancel_at_period_end: boolean;
}

/**
 * Error codes payments methods set in a Base44Error's `code` when they reject.
 * Invalid arguments and mountCheckout() failures reject with a plain Error instead.
 *
 * Notable codes:
 * - payment_declined: the buyer's payment method was declined completing the checkout
 * - refund_failed: outcome unknown — retry with the same idempotency_key/amount
 * - refund_in_progress: a refund with the same idempotency_key is still running
 * - refund_amount_mismatch: the idempotency_key was already used for a different amount
 * - rate_limited: wait for the seconds in error.originalError.response.headers['retry-after']
 * - refund_not_supported / subscription_action_not_supported / complete_not_supported /
 *   presentation_not_supported: the app's provider doesn't support the operation
 */
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
  /**
   * Called after the buyer approves a PayPal payment and the SDK completes the
   * checkout. Use it to update the page, not to grant access. Stripe doesn't call
   * this — after paying, the buyer returns to success_path with a session_id query
   * parameter, which is the checkout_id; show the result with listPurchases().
   */
  onComplete?: (result: CompleteCheckoutResult) => void;
  /** Called when the buyer closes the PayPal window without paying. The button stays mounted. */
  onCancel?: () => void;
  /**
   * Called when a PayPal checkout fails after it's mounted, including a declined
   * payment (payment_declined). The button stays mounted so the buyer can retry.
   * If it keeps failing with payment_declined, create a new checkout and mount it.
   * Stripe shows its own errors inside the checkout.
   */
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
  /** Mounting rejects when this is null. */
  embedded: EmbeddedCheckout | null;
}

/**
 * A PayPal checkout that mountCheckout() creates when the buyer clicks PayPal's
 * button. The button shows as soon as the page loads; no order is created until
 * the buyer clicks.
 */
interface PayPalCheckoutOnClick {
  /** Only PayPal can create its checkout on click. */
  provider: "paypal";
  currency: string;
  intent: "capture" | "subscription";
  /**
   * Creates the checkout when the buyer clicks, usually by calling a backend
   * function that calls createCheckout(). Resolve with its result. Reject to
   * stop (e.g. a required form field is empty): PayPal's window closes and
   * onError receives the error.
   */
  createCheckout: () => Promise<MountableCheckout>;
}

/** A mounted embedded checkout. */
interface CheckoutMount {
  /** Removes the checkout from the page. For Stripe, mounting another destroys this one for you. */
  destroy: () => void;
  /**
   * PayPal: greys out the button and ignores clicks. After a payment completes,
   * the button stays off, so setDisabled(false) can't start a second payment.
   * Stripe ignores it.
   */
  setDisabled: (disabled: boolean) => void;
}

/** Payments module for anonymous/user authentication, via base44.payments. */
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

/** Payments module for service-role authentication, via base44.asServiceRole.payments. Backend only. */
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

---

## Notes

**Frontend vs backend availability**

| Method | `base44.payments` (frontend) | `base44.asServiceRole.payments` (backend) |
| :- | :-: | :-: |
| `preloadCheckout()` | Yes (browser only; no-op in backend) | No |
| `mountCheckout()` | Yes (browser only; rejects in backend) | No |
| `completeCheckout()` | Yes | Yes |
| `listPurchases()` | Yes (own purchases only) | Yes (any buyer, includes `metadata`/`shipping_address`) |
| `createCheckout()` | No | Yes |
| `refund()` | No | Yes |
| `cancelSubscription()` | No | Yes |
| `pauseSubscription()` | No | Yes |
| `resumeSubscription()` | No | Yes |

This asymmetry is enforced by the SDK itself: the test suite confirms `"createCheckout" in base44.payments === false`, `"refund" in base44.payments === false`, and `"mountCheckout" in base44.asServiceRole.payments === false`.

**Provider script loading**

- `mountCheckout()` and `preloadCheckout()` fetch a payments config (`GET /apps/:appId/payments/config`) to learn the provider's script URL, then load it with an internal `loadScript()` that appends a `<script>` tag once per URL (concurrent calls for the same URL share one load; a failed load is forgotten so the next mount retries).
- The config response is fetched once per client and cached as a pending promise; a failed fetch clears the cache so the next call retries.
- Script URLs are restricted to an allowlist of hosts (`js.stripe.com` for Stripe; `www.paypal.com` / `www.sandbox.paypal.com` for PayPal), must be plain `https:` with no port, username, or password. A config with an invalid or missing URL makes `mountCheckout()` reject with "no valid \<provider\> script URL", without loading anything.
- `preloadCheckout()` is a best-effort hint: it swallows every error and always resolves. If preloading fails, `mountCheckout()` repeats the fetch/load and surfaces the real error there.

**Gotchas**

- IDs (`checkoutId`, `subscriptionId`) are required, non-empty strings — passing `""` rejects synchronously (e.g. `"Checkout ID is required and must be a string"`) without making a network call.
- `cancelSubscription()`'s `options` defaults to `{}` (not `{ at_period_end: false }`) when omitted — the backend decides the default behavior for an empty body.
- Calling `completeCheckout()` or a subscription method again with the same ID is safe and returns the current/previous result rather than erroring.
- For Stripe, `onComplete`/`onCancel`/`onError` in `mountCheckout()` are never called — Stripe redirects the buyer back to `success_path` with a `session_id` query parameter (the `checkout_id`); use `listPurchases({ checkout_id })` on that page to read the outcome.
- A `mountCheckout()` callback that throws is caught and logged to the console — it won't be reported as a failed payment or crash the checkout.
- Errors from payments methods are `Base44Error`s with a `code` from `PaymentsErrorCode` (see [Error Handling](https://docs.base44.com/developers/references/sdk/getting-started/work-with-sdk#error-handling)); invalid-argument errors and most `mountCheckout()` setup failures are plain `Error` objects instead, so check `error instanceof Base44Error` before reading `.code`.
