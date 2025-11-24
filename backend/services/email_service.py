"""
Email service for notifications.
"""

import os
from typing import Optional, Dict
from datetime import datetime
from services.service_config import ServiceConfig


class EmailConfig(ServiceConfig):
    """Email service configuration"""
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    from_email: str = os.getenv("FROM_EMAIL", "noreply@rollscape.com")
    from_name: str = os.getenv("FROM_NAME", "RollScape")


email_config = EmailConfig()


class EmailService:
    """Email notification service"""
    
    def __init__(self):
        self.config = email_config
        self.is_mock = not self.config.smtp_user or not self.config.smtp_password
        
        if self.is_mock:
            print("⚠️ Email credentials not configured. Running in mock mode (emails will be logged).")
    
    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional)
        
        Returns:
            True if sent successfully
        """
        if self.is_mock:
            print(f"\n📧 [MOCK EMAIL] To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content:\n{text_content or html_content}")
            return True
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.config.from_name} <{self.config.from_email}>"
            msg['To'] = to_email
            
            # Add plain text version
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                server.starttls()
                server.login(self.config.smtp_user, self.config.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    # ========================================================================
    # PAYMENT NOTIFICATIONS
    # ========================================================================
    
    def send_payment_success(
        self,
        to_email: str,
        user_name: str,
        tier: str,
        amount: float,
        billing_period: str,
        next_billing_date: datetime
    ) -> bool:
        """Send payment success notification."""
        subject = "Payment Successful - Welcome to RollScape!"
        
        text_content = f"""
Hi {user_name},

Thank you for subscribing to RollScape {tier.title()}!

Payment Details:
- Plan: {tier.title()} ({billing_period})
- Amount: ${amount:.2f}
- Next billing date: {next_billing_date.strftime('%B %d, %Y')}

You now have access to:
{'- 3 active campaigns' if tier == 'basic' else '- 10 active campaigns' if tier == 'premium' else '- Unlimited campaigns'}
{'- 25 AI-generated images per month' if tier == 'basic' else '- 100 AI-generated images per month' if tier == 'premium' else '- 500 AI-generated images per month'}
{'- 4 AI players per campaign' if tier == 'basic' else '- 6 AI players per campaign' if tier == 'premium' else '- 10 AI players per campaign'}
- Map-based gameplay
- Voice chat
{'- Priority support' if tier in ['premium', 'ultimate'] else ''}

Start your adventure at: https://rollscape.com/dashboard

Questions? Contact us at support@rollscape.com

Happy adventuring!
The RollScape Team
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .detail-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }}
        .features {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }}
        .features ul {{ list-style: none; padding: 0; }}
        .features li {{ padding: 8px 0; padding-left: 30px; position: relative; }}
        .features li:before {{ content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Payment Successful!</h1>
            <p>Welcome to RollScape {tier.title()}</p>
        </div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>Thank you for subscribing to RollScape! Your payment has been processed successfully.</p>
            
            <div class="detail-box">
                <h3>Payment Details</h3>
                <p><strong>Plan:</strong> {tier.title()} ({billing_period})<br>
                <strong>Amount:</strong> ${amount:.2f}<br>
                <strong>Next billing date:</strong> {next_billing_date.strftime('%B %d, %Y')}</p>
            </div>
            
            <div class="features">
                <h3>Your New Features</h3>
                <ul>
                    <li>{'3 active campaigns' if tier == 'basic' else '10 active campaigns' if tier == 'premium' else 'Unlimited campaigns'}</li>
                    <li>{'25' if tier == 'basic' else '100' if tier == 'premium' else '500'} AI-generated images per month</li>
                    <li>{'4' if tier == 'basic' else '6' if tier == 'premium' else '10'} AI players per campaign</li>
                    <li>Map-based gameplay with fog of war</li>
                    <li>Voice & video chat</li>
                    {'<li>Priority support</li>' if tier in ['premium', 'ultimate'] else ''}
                </ul>
            </div>
            
            <center>
                <a href="https://rollscape.com/dashboard" class="button">Start Your Adventure</a>
            </center>
            
            <p class="footer">
                Questions? Contact us at <a href="mailto:support@rollscape.com">support@rollscape.com</a><br>
                © 2025 RollScape. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return self._send_email(to_email, subject, html_content, text_content)
    
    def send_payment_failed(
        self,
        to_email: str,
        user_name: str,
        tier: str,
        amount: float,
        retry_date: datetime
    ) -> bool:
        """Send payment failed notification."""
        subject = "Payment Failed - Action Required"
        
        text_content = f"""
Hi {user_name},

We were unable to process your payment for RollScape {tier.title()}.

Payment Details:
- Plan: {tier.title()}
- Amount: ${amount:.2f}
- Next retry: {retry_date.strftime('%B %d, %Y')}

Your subscription is currently in a grace period. Please update your payment method to continue enjoying RollScape premium features.

Update payment method: https://rollscape.com/settings/billing

If you need assistance, please contact us at support@rollscape.com

The RollScape Team
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .warning-box {{ background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }}
        .button {{ display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Payment Failed</h1>
        </div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>We were unable to process your payment for RollScape {tier.title()}.</p>
            
            <div class="warning-box">
                <h3>Action Required</h3>
                <p><strong>Plan:</strong> {tier.title()}<br>
                <strong>Amount:</strong> ${amount:.2f}<br>
                <strong>Next retry:</strong> {retry_date.strftime('%B %d, %Y')}</p>
                <p>Your subscription is currently in a grace period. Please update your payment method to avoid service interruption.</p>
            </div>
            
            <center>
                <a href="https://rollscape.com/settings/billing" class="button">Update Payment Method</a>
            </center>
            
            <p class="footer">
                Need help? Contact us at <a href="mailto:support@rollscape.com">support@rollscape.com</a><br>
                © 2025 RollScape. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return self._send_email(to_email, subject, html_content, text_content)
    
    def send_subscription_ending(
        self,
        to_email: str,
        user_name: str,
        tier: str,
        end_date: datetime
    ) -> bool:
        """Send subscription ending notification."""
        subject = "Your RollScape Subscription is Ending"
        
        text_content = f"""
Hi {user_name},

Your RollScape {tier.title()} subscription is ending on {end_date.strftime('%B %d, %Y')}.

After this date, you'll be downgraded to the Free plan, but you'll keep:
- All your campaigns and characters
- Access to text-based gameplay
- Your account and progress

Want to keep your premium features? Reactivate anytime at:
https://rollscape.com/settings/subscription

We'd love to have you back!
The RollScape Team
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Subscription Ending</h1>
        </div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>Your RollScape {tier.title()} subscription is ending on <strong>{end_date.strftime('%B %d, %Y')}</strong>.</p>
            
            <div class="info-box">
                <h3>What Happens Next</h3>
                <p>After your subscription ends, you'll be downgraded to the Free plan.</p>
                <p><strong>You'll keep:</strong></p>
                <ul>
                    <li>All your campaigns and characters</li>
                    <li>Access to text-based gameplay</li>
                    <li>Your account and progress</li>
                </ul>
            </div>
            
            <p>Want to keep your premium features?</p>
            
            <center>
                <a href="https://rollscape.com/settings/subscription" class="button">Reactivate Subscription</a>
            </center>
            
            <p class="footer">
                We'd love to have you back!<br>
                © 2025 RollScape. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return self._send_email(to_email, subject, html_content, text_content)
    
    def send_subscription_canceled(
        self,
        to_email: str,
        user_name: str,
        tier: str
    ) -> bool:
        """Send subscription canceled confirmation."""
        subject = "Your RollScape Subscription Has Been Canceled"
        
        text_content = f"""
Hi {user_name},

Your RollScape {tier.title()} subscription has been canceled.

You now have access to the Free plan, which includes:
- 1 active campaign
- Text-based gameplay
- Up to 2 AI players
- Your saved campaigns and characters

We're sorry to see you go! If you change your mind, you can resubscribe anytime at:
https://rollscape.com/pricing

Thank you for being part of RollScape.
The RollScape Team
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Subscription Canceled</h1>
        </div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>Your RollScape {tier.title()} subscription has been canceled.</p>
            
            <div class="info-box">
                <h3>Your Free Plan</h3>
                <p>You now have access to:</p>
                <ul>
                    <li>1 active campaign</li>
                    <li>Text-based gameplay</li>
                    <li>Up to 2 AI players</li>
                    <li>All your saved campaigns and characters</li>
                </ul>
            </div>
            
            <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
            
            <center>
                <a href="https://rollscape.com/pricing" class="button">View Plans</a>
            </center>
            
            <p class="footer">
                Thank you for being part of RollScape.<br>
                © 2025 RollScape. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return self._send_email(to_email, subject, html_content, text_content)


# Global service instance
email_service = EmailService()
