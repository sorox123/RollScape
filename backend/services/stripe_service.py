"""
Stripe payment service for subscription management.
"""

import stripe
from typing import Dict, List, Optional
from datetime import datetime
from services.service_config import ServiceConfig
import os


class StripeConfig(ServiceConfig):
    """Stripe service configuration"""
    api_key: str = os.getenv("STRIPE_API_KEY", "")
    publishable_key: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    price_basic_monthly: str = os.getenv("STRIPE_PRICE_BASIC_MONTHLY", "")
    price_basic_yearly: str = os.getenv("STRIPE_PRICE_BASIC_YEARLY", "")
    price_premium_monthly: str = os.getenv("STRIPE_PRICE_PREMIUM_MONTHLY", "")
    price_premium_yearly: str = os.getenv("STRIPE_PRICE_PREMIUM_YEARLY", "")
    price_ultimate_monthly: str = os.getenv("STRIPE_PRICE_ULTIMATE_MONTHLY", "")
    price_ultimate_yearly: str = os.getenv("STRIPE_PRICE_ULTIMATE_YEARLY", "")


stripe_config = StripeConfig()


class StripeService:
    """Stripe payment processing service"""
    
    def __init__(self):
        self.config = stripe_config
        
        if self.config.api_key:
            stripe.api_key = self.config.api_key
            self.is_mock = False
        else:
            self.is_mock = True
            print("⚠️ Stripe API key not found. Running in mock mode.")
    
    # ========================================================================
    # CUSTOMER MANAGEMENT
    # ========================================================================
    
    def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Create a Stripe customer.
        
        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata
        
        Returns:
            Customer object
        """
        if self.is_mock:
            return {
                "id": f"cus_mock_{email}",
                "email": email,
                "name": name,
                "metadata": metadata or {},
                "created": int(datetime.utcnow().timestamp())
            }
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create customer: {str(e)}")
    
    def get_customer(self, customer_id: str) -> Dict:
        """Get customer by ID"""
        if self.is_mock:
            return {
                "id": customer_id,
                "email": f"{customer_id}@example.com",
                "name": "Mock Customer"
            }
        
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to retrieve customer: {str(e)}")
    
    def update_customer(
        self,
        customer_id: str,
        email: Optional[str] = None,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Update customer information"""
        if self.is_mock:
            return {
                "id": customer_id,
                "email": email or f"{customer_id}@example.com",
                "name": name or "Mock Customer",
                "metadata": metadata or {}
            }
        
        try:
            update_data = {}
            if email:
                update_data["email"] = email
            if name:
                update_data["name"] = name
            if metadata:
                update_data["metadata"] = metadata
            
            return stripe.Customer.modify(customer_id, **update_data)
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to update customer: {str(e)}")
    
    # ========================================================================
    # CHECKOUT SESSION
    # ========================================================================
    
    def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Create a Stripe Checkout session for subscription.
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment canceled
            metadata: Additional metadata
        
        Returns:
            Checkout session object with URL
        """
        if self.is_mock:
            return {
                "id": f"cs_mock_{datetime.utcnow().timestamp()}",
                "url": f"{success_url}?session_id=cs_mock&mock=true",
                "customer": customer_id,
                "mode": "subscription",
                "metadata": metadata or {}
            }
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
                allow_promotion_codes=True,
                billing_address_collection="auto",
            )
            return session
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    # ========================================================================
    # SUBSCRIPTION MANAGEMENT
    # ========================================================================
    
    def get_subscription(self, subscription_id: str) -> Dict:
        """Get subscription by ID"""
        if self.is_mock:
            return {
                "id": subscription_id,
                "customer": "cus_mock",
                "status": "active",
                "current_period_start": int(datetime.utcnow().timestamp()),
                "current_period_end": int(datetime.utcnow().timestamp()) + (30 * 24 * 3600),
                "cancel_at_period_end": False
            }
        
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to retrieve subscription: {str(e)}")
    
    def list_subscriptions(self, customer_id: str) -> List[Dict]:
        """List all subscriptions for a customer"""
        if self.is_mock:
            return [{
                "id": f"sub_mock_{customer_id}",
                "customer": customer_id,
                "status": "active",
                "current_period_start": int(datetime.utcnow().timestamp()),
                "current_period_end": int(datetime.utcnow().timestamp()) + (30 * 24 * 3600)
            }]
        
        try:
            subscriptions = stripe.Subscription.list(customer=customer_id)
            return subscriptions.data
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to list subscriptions: {str(e)}")
    
    def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> Dict:
        """
        Cancel a subscription.
        
        Args:
            subscription_id: Subscription ID
            at_period_end: If True, cancel at end of billing period
        
        Returns:
            Updated subscription object
        """
        if self.is_mock:
            return {
                "id": subscription_id,
                "status": "active" if at_period_end else "canceled",
                "cancel_at_period_end": at_period_end,
                "canceled_at": int(datetime.utcnow().timestamp()) if not at_period_end else None
            }
        
        try:
            if at_period_end:
                # Schedule cancellation at period end
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                # Cancel immediately
                subscription = stripe.Subscription.cancel(subscription_id)
            
            return subscription
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    def reactivate_subscription(self, subscription_id: str) -> Dict:
        """Reactivate a canceled subscription (if not yet ended)"""
        if self.is_mock:
            return {
                "id": subscription_id,
                "status": "active",
                "cancel_at_period_end": False
            }
        
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            return subscription
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to reactivate subscription: {str(e)}")
    
    # ========================================================================
    # INVOICES
    # ========================================================================
    
    def list_invoices(self, customer_id: str, limit: int = 10) -> List[Dict]:
        """List invoices for a customer"""
        if self.is_mock:
            return [{
                "id": f"in_mock_{i}",
                "customer": customer_id,
                "amount_paid": 999,
                "status": "paid",
                "created": int(datetime.utcnow().timestamp()) - (i * 30 * 24 * 3600),
                "invoice_pdf": f"https://example.com/invoice_{i}.pdf"
            } for i in range(min(3, limit))]
        
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            return invoices.data
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to list invoices: {str(e)}")
    
    def get_invoice(self, invoice_id: str) -> Dict:
        """Get invoice by ID"""
        if self.is_mock:
            return {
                "id": invoice_id,
                "amount_paid": 999,
                "status": "paid",
                "invoice_pdf": f"https://example.com/invoice.pdf"
            }
        
        try:
            return stripe.Invoice.retrieve(invoice_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to retrieve invoice: {str(e)}")
    
    # ========================================================================
    # WEBHOOKS
    # ========================================================================
    
    def construct_webhook_event(
        self,
        payload: bytes,
        signature: str
    ) -> Dict:
        """
        Verify and construct webhook event.
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header
        
        Returns:
            Verified event object
        """
        if self.is_mock:
            import json
            return json.loads(payload.decode('utf-8'))
        
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                self.config.webhook_secret
            )
            return event
        except ValueError:
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise Exception("Invalid signature")
    
    # ========================================================================
    # PRICE HELPERS
    # ========================================================================
    
    def get_price_id(self, tier: str, billing_period: str) -> str:
        """Get Stripe price ID for tier and billing period"""
        price_map = {
            ("basic", "monthly"): self.config.price_basic_monthly,
            ("basic", "yearly"): self.config.price_basic_yearly,
            ("premium", "monthly"): self.config.price_premium_monthly,
            ("premium", "yearly"): self.config.price_premium_yearly,
            ("ultimate", "monthly"): self.config.price_ultimate_monthly,
            ("ultimate", "yearly"): self.config.price_ultimate_yearly,
        }
        
        price_id = price_map.get((tier.lower(), billing_period.lower()))
        
        if not price_id and not self.is_mock:
            raise Exception(f"No price ID configured for {tier} {billing_period}")
        
        return price_id or f"price_mock_{tier}_{billing_period}"


# Global service instance
stripe_service = StripeService()
