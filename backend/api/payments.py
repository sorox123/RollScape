"""
Payment and subscription API endpoints.
"""

from fastapi import APIRouter, HTTPException, Request, Header, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from services.stripe_service import stripe_service
from database import get_db
from models.user import User, SubscriptionTier, SubscriptionStatus

router = APIRouter(prefix="/api/payments", tags=["payments"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateCheckoutRequest(BaseModel):
    """Request to create checkout session"""
    user_id: str
    email: str
    tier: str  # "basic", "premium", "ultimate"
    billing_period: str  # "monthly", "yearly"
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    """Checkout session response"""
    session_id: str
    checkout_url: str
    customer_id: str


class SubscriptionInfo(BaseModel):
    """Subscription information"""
    id: str
    customer_id: str
    status: str
    tier: str
    billing_period: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool


class CancelSubscriptionRequest(BaseModel):
    """Request to cancel subscription"""
    subscription_id: str
    immediate: bool = False  # True = cancel now, False = cancel at period end


class InvoiceInfo(BaseModel):
    """Invoice information"""
    id: str
    amount_paid: int
    currency: str
    status: str
    created: datetime
    invoice_pdf: Optional[str]


# ============================================================================
# CHECKOUT
# ============================================================================

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(request: CreateCheckoutRequest):
    """
    Create a Stripe Checkout session for subscription.
    
    Returns checkout URL to redirect user to payment page.
    """
    try:
        # Get or create Stripe customer
        # In production, check if user already has stripe_customer_id
        customer = stripe_service.create_customer(
            email=request.email,
            name=request.email.split('@')[0],
            metadata={"user_id": request.user_id}
        )
        
        # Get price ID for tier and billing period
        price_id = stripe_service.get_price_id(
            request.tier,
            request.billing_period
        )
        
        # Create checkout session
        session = stripe_service.create_checkout_session(
            customer_id=customer["id"],
            price_id=price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "user_id": request.user_id,
                "tier": request.tier,
                "billing_period": request.billing_period
            }
        )
        
        return CheckoutResponse(
            session_id=session["id"],
            checkout_url=session["url"],
            customer_id=customer["id"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SUBSCRIPTION MANAGEMENT
# ============================================================================

@router.get("/subscription/{customer_id}", response_model=SubscriptionInfo)
async def get_subscription_status(customer_id: str):
    """
    Get current subscription status for a customer.
    """
    try:
        subscriptions = stripe_service.list_subscriptions(customer_id)
        
        if not subscriptions:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        # Get the first active subscription
        subscription = subscriptions[0]
        
        # Parse tier from price metadata (in production, store this in DB)
        tier = "basic"  # Default, should be fetched from DB
        billing_period = "monthly"  # Default
        
        return SubscriptionInfo(
            id=subscription["id"],
            customer_id=subscription["customer"],
            status=subscription["status"],
            tier=tier,
            billing_period=billing_period,
            current_period_start=datetime.fromtimestamp(subscription["current_period_start"]),
            current_period_end=datetime.fromtimestamp(subscription["current_period_end"]),
            cancel_at_period_end=subscription.get("cancel_at_period_end", False)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel-subscription", response_model=dict)
async def cancel_subscription(request: CancelSubscriptionRequest):
    """
    Cancel a subscription.
    
    By default, cancels at end of billing period.
    Set immediate=true to cancel immediately.
    """
    try:
        subscription = stripe_service.cancel_subscription(
            request.subscription_id,
            at_period_end=not request.immediate
        )
        
        return {
            "success": True,
            "subscription_id": subscription["id"],
            "status": subscription["status"],
            "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            "message": "Subscription canceled at end of billing period" if not request.immediate 
                      else "Subscription canceled immediately"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reactivate-subscription/{subscription_id}", response_model=dict)
async def reactivate_subscription(subscription_id: str):
    """
    Reactivate a canceled subscription (before period ends).
    """
    try:
        subscription = stripe_service.reactivate_subscription(subscription_id)
        
        return {
            "success": True,
            "subscription_id": subscription["id"],
            "status": subscription["status"],
            "message": "Subscription reactivated successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INVOICES
# ============================================================================

@router.get("/invoices/{customer_id}", response_model=List[InvoiceInfo])
async def list_invoices(customer_id: str, limit: int = 10):
    """
    List invoices for a customer.
    """
    try:
        invoices = stripe_service.list_invoices(customer_id, limit=limit)
        
        return [
            InvoiceInfo(
                id=invoice["id"],
                amount_paid=invoice["amount_paid"],
                currency=invoice.get("currency", "usd"),
                status=invoice["status"],
                created=datetime.fromtimestamp(invoice["created"]),
                invoice_pdf=invoice.get("invoice_pdf")
            )
            for invoice in invoices
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoice/{invoice_id}")
async def get_invoice(invoice_id: str):
    """
    Get a specific invoice.
    """
    try:
        invoice = stripe_service.get_invoice(invoice_id)
        
        return {
            "id": invoice["id"],
            "amount_paid": invoice["amount_paid"],
            "status": invoice["status"],
            "invoice_pdf": invoice.get("invoice_pdf"),
            "created": datetime.fromtimestamp(invoice["created"])
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBHOOKS
# ============================================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """
    Handle Stripe webhook events.
    
    Events:
    - checkout.session.completed: User completed payment
    - customer.subscription.created: Subscription created
    - customer.subscription.updated: Subscription updated
    - customer.subscription.deleted: Subscription canceled
    - invoice.paid: Invoice paid
    - invoice.payment_failed: Payment failed
    """
    try:
        # Get raw request body
        payload = await request.body()
        
        # Verify webhook signature and construct event
        event = stripe_service.construct_webhook_event(payload, stripe_signature)
        
        event_type = event["type"]
        data = event["data"]["object"]
        
        print(f"📥 Webhook received: {event_type}")
        
        # Handle different event types
        if event_type == "checkout.session.completed":
            # Payment successful, subscription created
            session = data
            customer_id = session["customer"]
            subscription_id = session.get("subscription")
            customer_email = session.get("customer_email")
            
            print(f"✅ Checkout completed for customer {customer_id}")
            print(f"   Subscription: {subscription_id}")
            
            # Update user record in database
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                user.stripe_customer_id = customer_id
                user.stripe_subscription_id = subscription_id
                user.subscription_status = SubscriptionStatus.ACTIVE
                user.subscription_started_at = datetime.now()
                
                # Get subscription details to set tier
                if subscription_id:
                    sub = stripe_service.get_subscription(subscription_id)
                    # Extract tier from metadata or price_id
                    price_id = sub["items"]["data"][0]["price"]["id"]
                    if "basic" in price_id:
                        user.subscription_tier = SubscriptionTier.BASIC
                    elif "premium" in price_id:
                        user.subscription_tier = SubscriptionTier.PREMIUM
                    elif "ultimate" in price_id:
                        user.subscription_tier = SubscriptionTier.ULTIMATE
                    
                    user.current_period_end = datetime.fromtimestamp(sub["current_period_end"])
                    user.subscription_ends_at = datetime.fromtimestamp(sub["current_period_end"])
                
                db.commit()
                print(f"   ✓ User {user.email} upgraded to {user.subscription_tier}")
        
        elif event_type == "customer.subscription.created":
            subscription = data
            customer_id = subscription["customer"]
            subscription_id = subscription["id"]
            
            print(f"🆕 Subscription created for customer {customer_id}")
            
            # Update user with subscription ID
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.stripe_subscription_id = subscription_id
                user.subscription_status = SubscriptionStatus.ACTIVE
                user.current_period_end = datetime.fromtimestamp(subscription["current_period_end"])
                db.commit()
        
        elif event_type == "customer.subscription.updated":
            subscription = data
            customer_id = subscription["customer"]
            status = subscription["status"]
            subscription_id = subscription["id"]
            
            print(f"🔄 Subscription updated for customer {customer_id}")
            print(f"   Status: {status}")
            
            # Update subscription status in database
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                # Map Stripe status to our status enum
                status_map = {
                    "active": SubscriptionStatus.ACTIVE,
                    "canceled": SubscriptionStatus.CANCELED,
                    "past_due": SubscriptionStatus.PAST_DUE,
                    "trialing": SubscriptionStatus.TRIALING,
                }
                user.subscription_status = status_map.get(status, SubscriptionStatus.ACTIVE)
                user.current_period_end = datetime.fromtimestamp(subscription["current_period_end"])
                user.subscription_ends_at = datetime.fromtimestamp(subscription["current_period_end"])
                
                # If canceled, check cancel_at_period_end
                if subscription.get("cancel_at_period_end"):
                    user.subscription_status = SubscriptionStatus.CANCELED
                
                db.commit()
                print(f"   ✓ User {user.email} status: {user.subscription_status}")
        
        elif event_type == "customer.subscription.deleted":
            subscription = data
            customer_id = subscription["customer"]
            
            print(f"❌ Subscription deleted for customer {customer_id}")
            
            # Downgrade user to free tier
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.subscription_tier = SubscriptionTier.FREE
                user.subscription_status = SubscriptionStatus.CANCELED
                user.stripe_subscription_id = None
                db.commit()
                print(f"   ✓ User {user.email} downgraded to FREE")
        
        elif event_type == "invoice.paid":
            invoice = data
            customer_id = invoice["customer"]
            amount = invoice["amount_paid"] / 100  # Convert cents to dollars
            
            print(f"💰 Invoice paid by customer {customer_id}: ${amount}")
            
            # Ensure user status is active
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user and user.subscription_status == SubscriptionStatus.PAST_DUE:
                user.subscription_status = SubscriptionStatus.ACTIVE
                db.commit()
                print(f"   ✓ User {user.email} reactivated")
        
        elif event_type == "invoice.payment_failed":
            invoice = data
            customer_id = invoice["customer"]
            
            print(f"⚠️ Payment failed for customer {customer_id}")
            
            # Set subscription status to past_due
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.subscription_status = SubscriptionStatus.PAST_DUE
                db.commit()
                print(f"   ✓ User {user.email} marked as PAST_DUE")
                # TODO: Send notification email to user
        
        else:
            print(f"⚠️ Unhandled event type: {event_type}")
        
        return {"received": True, "event": event_type}
    
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# CONFIGURATION
# ============================================================================

@router.get("/config")
async def get_payment_config():
    """
    Get public payment configuration.
    
    Returns publishable key and available plans.
    """
    return {
        "publishable_key": stripe_service.config.publishable_key,
        "is_mock": stripe_service.is_mock,
        "plans": {
            "basic": {
                "monthly": {
                    "price": 9.99,
                    "price_id": stripe_service.get_price_id("basic", "monthly")
                },
                "yearly": {
                    "price": 99.99,
                    "price_id": stripe_service.get_price_id("basic", "yearly"),
                    "savings": "Save $20"
                }
            },
            "premium": {
                "monthly": {
                    "price": 19.99,
                    "price_id": stripe_service.get_price_id("premium", "monthly")
                },
                "yearly": {
                    "price": 199.99,
                    "price_id": stripe_service.get_price_id("premium", "yearly"),
                    "savings": "Save $40"
                }
            },
            "ultimate": {
                "monthly": {
                    "price": 39.99,
                    "price_id": stripe_service.get_price_id("ultimate", "monthly")
                },
                "yearly": {
                    "price": 399.99,
                    "price_id": stripe_service.get_price_id("ultimate", "yearly"),
                    "savings": "Save $80"
                }
            }
        }
    }
