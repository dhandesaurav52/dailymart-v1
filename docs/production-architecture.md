# DailyMart production architecture

## Audit and blockers addressed

The original client context was a demo-oriented data access layer: it seeded production collections from a browser, listened to every order, payment, user, audit and dispute record, and wrote orders, payments, stock, refunds and roles directly from React. `firestore.rules` consequently allowed unrestricted reads and writes. The former browser-generated customer identifier and the simulated admin login were not an authorization boundary.

This change makes Firestore a read model and moves privileged commerce mutations into Firebase Functions. Firestore rules deny all unrecognised paths and all direct financial, inventory, membership and privileged status mutations. Existing UI actions must be migrated to callable functions before rules are deployed; direct calls are deliberately denied rather than silently preserving a privilege escalation.

## Canonical schema

* `users/{uid}` is server-created from Firebase Auth and contains no client-editable roles.
* `shopMembers/{uid}_{shopId}` is the membership authority. It contains `shopId`, `userId`, role, explicit permissions and status.
* `shops`, `products`, `orders`, `orderPayments`, `deliveryAssignments`, `merchantSubscriptions`, `supportTickets`, `supportMessages`, `refunds`, `payouts`, `notifications`, and append-only `auditLogs` are the canonical collections.
* Orders contain immutable item and financial snapshots. Product stock is reserved in the order transaction and every adjustment is appended to `inventoryAdjustments`.

## Authorization matrix

| Actor | Allowed scope |
| --- | --- |
| Customer | Their profile, orders, payments, tickets and notifications |
| Shop owner/employee | A single active `shopMembers` membership and its permitted shop resources |
| Delivery staff | Only their delivery assignments; COD collection is a trusted action |
| Admin | Custom-claim scoped operations (`SUPER_ADMIN`, `OPERATIONS_ADMIN`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`) |
| Client | Never payment/refund/payout/subscription status, platform fee, inventory reservation, role or audit mutation |

## Authentication and portals

DailyMart has one email/password authentication screen and does not ask a person to select an internal role. After Firebase Authentication succeeds, `resolveAccess` creates a minimal normal-user profile when required, resolves active `shopMembers` on the server, and returns only the authenticated user's accessible portals. Admin access is based exclusively on the `platformRole` custom claim. The portal switcher changes presentation only; callable functions and Firestore rules remain the authorization boundary.

A normal user may submit a seller application from Profile. The trusted `submitSellerApplication` function binds the application to `request.auth.uid`, always starts it in `PENDING`, and refuses to accept an applicant-supplied approval status. A future admin review callable must create the approved shop and owner membership atomically; the client must never do either.

## State machines

Orders move only through `ORDER_PLACED → SHOP_ACCEPTED → PREPARING → READY_FOR_PICKUP → ASSIGNED_TO_DELIVERY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`, with explicit rejection/cancellation/failure exits. Payments are `PENDING → AUTHORIZED/PAID → REFUNDED` (or `FAILED`); COD is `PENDING → COLLECTED → SETTLED`. Subscriptions are `TRIAL`, `ACTIVE`, `EXPIRING`, `EXPIRED`, `SUSPENDED`, or `CANCELLED`; only a verified webhook may activate one.

## Payments and webhooks

The client creates neither a payment success record nor a refund. A provider-specific HTTPS endpoint must verify the raw webhook signature, use the provider event ID as an idempotency key, persist the event before applying a transaction, and log a redacted audit event. Configure provider secrets with Firebase/Google secret management, never in Vite variables or Firestore.

## Migration and deployment

1. Export Firestore and back up the existing project.
2. Backfill authenticated `users`, normalized `shopMembers`, `status`/`operationalStatus`, order financial snapshots, and payment records; do not run browser seeding.
3. Deploy Functions and configure custom claims/secret-backed webhooks.
4. Deploy `firestore.indexes.json`, Storage rules, then Firestore rules in staging. Migrate every remaining legacy context mutation to a callable before production rules are deployed.
5. Validate customer/shop/admin isolation with emulator tests, then promote the same artifacts.

## Remaining integration decisions

A live payment provider and its marketplace account model have not been selected. Provider selection, webhook secret provisioning, online checkout UI, and the exact tax/commission policy are required before enabling online payments or declaring a production launch.
