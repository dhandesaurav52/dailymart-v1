# DailyMart

## Development demo data

Seed development or staging only (it uses Firebase Admin Application Default Credentials and never deletes or resets Firestore):

```bash
export FIREBASE_PROJECT_ID=your-development-project
# Set GOOGLE_APPLICATION_CREDENTIALS when ADC is not already configured.
npm run seed:demo
```

The command is idempotent. It only upserts documents marked `isDemoData: true` / `environment: "demo"`; it does not overwrite unrelated records.

### Demo accounts (development only)

| Account | Relationship |
| --- | --- |
| `admin@dailmart.com` | `SUPER_ADMIN` custom claim |
| `shopowner@dailymart.com` | owner of Shree Krishna General Store |
| `user@dailymart.com` | customer with three demo orders |
| `delivery@dailymart.com` | `DELIVERY_STAFF` member of the same shop |

Newly created demo accounts use `Demo@12345`; set `DAILYMART_DEMO_PASSWORD` to override it. This password is for local/development seeding only and is never written to Firestore.

The dataset includes Shree Krishna General Store, **30** grocery/general-store products in twelve categories, three order states, an assigned delivery, an active yearly ₹999 demo subscription, a customer/shop support conversation, and an escalated admin dispute.
