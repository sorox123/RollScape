# Stripe Payment Integration

Complete subscription payment system with checkout, webhooks, and quota enforcement.

## Overview

RollScape uses Stripe for subscription payments with 3 paid tiers:
- **Basic**: $9.99/month or $99.99/year (Save $20)
- **Premium**: $19.99/month or $199.99/year (Save $40)
- **Ultimate**: $39.99/month or $399.99/year (Save $80)

## Features

- ✅ Stripe Checkout (hosted payment pages)
- ✅ Subscription lifecycle management (create, update, cancel, reactivate)
- ✅ Webhook event handling with signature verification
- ✅ Mock mode for development (no API key required)
- ✅ Usage quota enforcement with HTTP 402 responses
- ✅ Invoice management and PDF access
- ✅ Automatic tier upgrades/downgrades
- ✅ Database synchronization via webhooks

## Setup

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Create Products and Prices:
   - Basic Monthly ($9.99)
   - Basic Yearly ($99.99)
   - Premium Monthly ($19.99)
   - Premium Yearly ($199.99)
   - Ultimate Monthly ($39.99)
   - Ultimate Yearly ($399.99)
4. Copy the Price IDs for each product

### 2. Environment Variables

Add to your `.env` file:

```env
# Stripe API Keys
STRIPE_API_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_ULTIMATE_MONTHLY=price_...
STRIPE_PRICE_ULTIMATE_YEARLY=price_...
```

### 3. Webhook Setup

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:8000/api/payments/webhook
```

### 4. Database Migration

The User model includes Stripe fields:
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Active subscription ID
- `subscription_tier` - Current tier (FREE, BASIC, PREMIUM, ULTIMATE)
- `subscription_status` - Status (ACTIVE, CANCELED, PAST_DUE, TRIALING)
- `subscription_started_at` - Subscription start date
- `subscription_ends_at` - Billing period end
- `current_period_end` - Current period end (for cancellations)
- `monthly_ai_images_used` - AI image quota tracking
- `monthly_ai_players_used` - AI player quota tracking

If migrating from old tier names (CREATOR, MASTER), update existing records:
```sql
UPDATE users SET subscription_tier = 'basic' WHERE subscription_tier = 'creator';
UPDATE users SET subscription_tier = 'premium' WHERE subscription_tier = 'master';
```

## Development Mode

The system includes a **mock mode** that works without Stripe API keys:

- Returns realistic mock data for all operations
- Mock customer IDs: `cus_mock_{email}`
- Mock subscription IDs: `sub_mock_{customer_id}`
- Allows full frontend development without Stripe account
- Automatically enabled when `STRIPE_API_KEY` is not set

## API Endpoints

### Create Checkout Session
```http
POST /api/payments/create-checkout
Content-Type: application/json

{
  "user_id": "user-123",
  "email": "user@example.com",
  "tier": "premium",
  "billing_period": "monthly",
  "success_url": "https://your-app.com/success",
  "cancel_url": "https://your-app.com/canceled"
}

Response:
{
  "session_id": "cs_test_...",
  "checkout_url": "https://checkout.stripe.com/...",
  "customer_id": "cus_..."
}
```

### Get Subscription
```http
GET /api/payments/subscription/{customer_id}

Response:
{
  "id": "sub_...",
  "status": "active",
  "tier": "premium",
  "current_period_start": "2024-01-01T00:00:00",
  "current_period_end": "2024-02-01T00:00:00",
  "cancel_at_period_end": false
}
```

### Cancel Subscription
```http
POST /api/payments/cancel-subscription
Content-Type: application/json

{
  "subscription_id": "sub_...",
  "immediate": false
}
```

### Reactivate Subscription
```http
POST /api/payments/reactivate-subscription/{subscription_id}
```

### List Invoices
```http
GET /api/payments/invoices/{customer_id}?limit=10

Response:
[
  {
    "id": "in_...",
    "amount_paid": 1999,
    "status": "paid",
    "invoice_pdf": "https://...",
    "created": "2024-01-01T00:00:00"
  }
]
```

### Get Config (Public)
```http
GET /api/payments/config

Response:
{
  "publishable_key": "pk_test_...",
  "is_mock": false,
  "plans": {
    "basic": {
      "monthly": {"price": 9.99, "price_id": "price_..."},
      "yearly": {"price": 99.99, "price_id": "price_...", "savings": "Save $20"}
    },
    ...
  }
}
```

## Frontend Integration

### Pricing Page

The pricing page (`/pricing`) displays all tiers and initiates checkout:

```tsx
import axios from 'axios';

async function handleCheckout(tier: string, billingPeriod: 'monthly' | 'yearly') {
  const response = await axios.post('/api/payments/create-checkout', {
    user_id: currentUser.id,
    email: currentUser.email,
    tier,
    billing_period: billingPeriod,
    success_url: `${window.location.origin}/dashboard?success=true`,
    cancel_url: `${window.location.origin}/pricing?canceled=true`
  });
  
  // Redirect to Stripe Checkout
  window.location.href = response.data.checkout_url;
}
```

### Subscription Dashboard

Display current subscription and usage:

```tsx
import SubscriptionDashboard from '@/components/subscription/SubscriptionDashboard';

export default function SettingsPage() {
  return <SubscriptionDashboard />;
}
```

### Checkout Button Component

```tsx
import CheckoutButton from '@/components/subscription/CheckoutButton';

<CheckoutButton
  tier="premium"
  billingPeriod="monthly"
  className="bg-blue-600 hover:bg-blue-700"
>
  Upgrade to Premium
</CheckoutButton>
```

### Usage Quota Display

```tsx
import UsageQuota from '@/components/subscription/UsageQuota';
import { Image } from 'lucide-react';

<UsageQuota
  used={user.monthly_ai_images_used}
  limit={user.ai_image_quota}
  label="AI Images This Month"
  icon={<Image className="w-4 h-4" />}
/>
```

## Quota Enforcement

The `quota_enforcement` middleware checks limits before expensive operations:

```python
from fastapi import Depends
from middleware import check_quota, increment_usage

@router.post("/generate-image")
async def generate_image(
    user_id: str,
    db: Session = Depends(get_db)
):
    # Check quota (raises 402 if exceeded)
    check_quota(user_id, "ai_images", db)
    
    # Generate image...
    image_url = dalle_service.generate(prompt)
    
    # Increment usage counter
    increment_usage(user_id, "ai_images", 1, db)
    
    return {"image_url": image_url}
```

### Quota Types

- `ai_images` - Monthly AI image generation limit
- `campaigns` - Active campaign limit
- `ai_players` - AI players per campaign limit

### HTTP 402 Response

When quota is exceeded, API returns HTTP 402 Payment Required:

```json
{
  "error": "AI image quota exceeded",
  "used": 25,
  "limit": 25,
  "upgrade_prompt": "Upgrade to Premium for 100 AI images per month",
  "recommended_tier": "premium"
}
```

## Webhook Events

Webhooks automatically sync Stripe events to the database:

### checkout.session.completed
- Sets `stripe_customer_id` and `stripe_subscription_id`
- Updates `subscription_tier` based on purchased plan
- Sets `subscription_status = ACTIVE`
- Records `subscription_started_at` and `current_period_end`

### customer.subscription.updated
- Updates `subscription_status` (active, canceled, past_due, trialing)
- Updates `current_period_end` and `subscription_ends_at`
- Handles cancellation flags

### customer.subscription.deleted
- Downgrades user to FREE tier
- Sets `subscription_status = CANCELED`
- Clears `stripe_subscription_id`

### invoice.paid
- Reactivates user if status was PAST_DUE
- Sets `subscription_status = ACTIVE`

### invoice.payment_failed
- Sets `subscription_status = PAST_DUE`
- (TODO: Send notification email)

## Testing

### Test with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC

### Test Webhooks Locally

1. Install Stripe CLI:
   ```bash
   stripe login
   ```

2. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook
   ```

3. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   stripe trigger invoice.payment_failed
   ```

### Test Quota Enforcement

```python
# backend/test_quota.py
from middleware import check_quota
from database import SessionLocal

db = SessionLocal()
user_id = "test-user-123"

try:
    check_quota(user_id, "ai_images", db)
    print("✅ Quota check passed")
except HTTPException as e:
    print(f"❌ Quota exceeded: {e.detail}")
```

## Subscription Tiers

### Free Tier
- **Price**: $0/month
- **Campaigns**: 1 active
- **AI Images**: 0 per month
- **AI Players**: 2 per campaign
- **Features**: Text-based gameplay, basic DM

### Basic Tier
- **Price**: $9.99/month or $99.99/year
- **Campaigns**: 3 active
- **AI Images**: 25 per month
- **AI Players**: 4 per campaign
- **Features**: Map gameplay, fog of war, voice chat

### Premium Tier
- **Price**: $19.99/month or $199.99/year
- **Campaigns**: 10 active
- **AI Images**: 100 per month
- **AI Players**: 6 per campaign
- **Features**: All Basic + animated tokens, dynamic lighting, priority support

### Ultimate Tier
- **Price**: $39.99/month or $399.99/year
- **Campaigns**: Unlimited
- **AI Images**: 500 per month
- **AI Players**: 10 per campaign
- **Features**: All Premium features

## Troubleshooting

### "No checkout URL received"
- Check that Stripe API key is set correctly
- Verify Price IDs match Stripe Dashboard
- Check server logs for Stripe API errors

### Webhook signature verification failed
- Ensure `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret
- Check that request body is not modified before webhook handler
- Verify webhook is sending to correct URL

### User not upgraded after payment
- Check webhook is configured correctly in Stripe Dashboard
- Verify webhook events are being received (check server logs)
- Ensure database is being updated in webhook handler
- Check for errors in `stripe_webhook` endpoint logs

### Quota not resetting
- Implement monthly quota reset cron job:
  ```python
  from datetime import datetime
  from models.user import User
  
  def reset_monthly_quotas():
      db = SessionLocal()
      users = db.query(User).filter(User.quota_reset_date < datetime.now()).all()
      for user in users:
          user.monthly_ai_images_used = 0
          user.monthly_ai_players_used = 0
          user.quota_reset_date = datetime.now() + timedelta(days=30)
      db.commit()
  ```

### Mock mode not working
- Mock mode is automatically enabled when `STRIPE_API_KEY` is not set
- Check `is_mock` field in `/api/payments/config` response
- Mock mode returns test data but doesn't actually process payments

## Security

- ✅ Webhook signature verification prevents spoofed events
- ✅ Stripe handles PCI compliance (we never see card numbers)
- ✅ API keys stored in environment variables (not in code)
- ✅ Checkout sessions expire after 24 hours
- ✅ Customer IDs are unique and indexed in database
- ⚠️ TODO: Add rate limiting to payment endpoints
- ⚠️ TODO: Add CSRF protection to checkout creation

## Next Steps

- [ ] Add email notifications for payment events
- [ ] Implement usage analytics dashboard
- [ ] Add proration for plan changes
- [ ] Support discount codes and coupons
- [ ] Add team/organization subscriptions
- [ ] Implement student/educator discounts
- [ ] Add gifting subscriptions
- [ ] Create affiliate/referral program
