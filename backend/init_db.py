# seed_data.py - Comprehensive seed data for Aleyo
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys
import uuid
from datetime import datetime, timedelta

# Add the current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import (
    User, UserSession, APIKey, CreditTransaction, Project, ProjectVersion,
    Component, Integration, VoiceCommand, SubscriptionPlan, Invoice,
    AnalyticsEvent, DailyStats, Slug, Design, Template, SubscriptionTier,
    DesignCategory, Tutorial, TutorialCompletion, UserTutorialProgress,
    TutorialView, TutorialComment, TutorialCategory as TutorialCategoryModel,
    TutorialLike, TutorialBookmark, TutorialTag, TutorialTagMapping,
)


# seed_data.py - Corrected Integration Seeding

def seed_subscription_plans(session):
    """Seed the three subscription/pricing tiers (GBP).

    Yearly price = 10x monthly (2 months free) — adjust if your actual
    yearly discount differs.
    """
    plans = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter",
            "tier": SubscriptionTier.STARTER,
            "description": "For individuals launching their first site.",
            "price_monthly": 29,
            "price_yearly": 290,
            "monthly_credits": 500,
            "additional_credit_price": 0.05,
            "max_projects": 3,
            "max_custom_domains": 1,
            "team_members": 1,
            "priority_support": False,
            "custom_integrations": False,
            "white_label": False,
            "api_access": False,
            "features": [
                "500 AI credits per month",
                "Up to 3 websites",
                "Basic templates",
                "Email support",
                "SSL certificate",
                "Custom domain",
            ],
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pro",
            "tier": SubscriptionTier.PRO,
            "description": "For growing teams and businesses.",
            "price_monthly": 79,
            "price_yearly": 790,
            "monthly_credits": 2000,
            "additional_credit_price": 0.05,
            "max_projects": 15,
            "max_custom_domains": 5,
            "team_members": 5,
            "priority_support": True,
            "custom_integrations": True,
            "white_label": False,
            "api_access": True,
            "features": [
                "2000 AI credits per month",
                "Up to 15 websites",
                "All templates",
                "Priority support",
                "Advanced analytics",
                "Custom code injection",
                "E-commerce features",
                "API access",
            ],
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Enterprise",
            "tier": SubscriptionTier.ENTERPRISE,
            "description": "For large teams needing unlimited scale.",
            "price_monthly": 99,
            "price_yearly": 990,
            "monthly_credits": 10000,
            "additional_credit_price": 0.04,
            "max_projects": -1,  # -1 = unlimited
            "max_custom_domains": -1,
            "team_members": -1,
            "priority_support": True,
            "custom_integrations": True,
            "white_label": True,
            "api_access": True,
            "features": [
                "10000 AI credits per month",
                "Unlimited websites",
                "Custom templates",
                "24/7 dedicated support",
                "White-label options",
                "Team collaboration",
                "Advanced security",
                "SLA guarantee",
                "Custom integrations",
            ],
        },
    ]

    for plan_data in plans:
        existing = session.query(SubscriptionPlan).filter_by(tier=plan_data["tier"]).first()
        if not existing:
            plan = SubscriptionPlan(**plan_data)
            session.add(plan)
            print(f"Added subscription plan: {plan_data['name']} (£{plan_data['price_monthly']}/mo)")
        else:
            existing.price_monthly = plan_data["price_monthly"]
            existing.price_yearly = plan_data["price_yearly"]
            print(f"Updated subscription plan: {plan_data['name']} (£{plan_data['price_monthly']}/mo)")


def seed_integrations(session):
    """Seed integration data"""
    integrations = [
        {
            "id": "int_analytics_google",
            "project_id": "system",  # System integrations
            "type": "analytics",
            "provider": "google_analytics",
            "settings": {
                "name": "Google Analytics",
                "description": "Track website traffic, user behavior, and conversions with Google's powerful analytics platform.",
                "icon": "Analytics",
                "color": "#EA4335",
                "config_schema": {
                    "tracking_id": {
                        "type": "string",
                        "required": True,
                        "label": "Tracking ID (UA-XXXXXXXXX-X)",
                        "placeholder": "UA-123456789-1",
                        "help": "Find this in your Google Analytics admin settings"
                    },
                    "anonymize_ip": {
                        "type": "boolean",
                        "default": True,
                        "label": "Anonymize IP",
                        "help": "Enables IP anonymization for GDPR compliance"
                    },
                    "enhanced_measurement": {
                        "type": "boolean",
                        "default": True,
                        "label": "Enhanced Measurement",
                        "help": "Automatically track page views, scrolls, and outbound clicks"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Google Analytics account",
                        "Set up a new property for your website",
                        "Copy your tracking ID",
                        "Paste the tracking ID in the configuration field",
                        "Save and publish your site"
                    ]
                },
                "popularity_score": 95,
                "docs_url": "https://developers.google.com/analytics",
                "support_url": "https://support.google.com/analytics",
                "category": "analytics"
            },
            "is_active": True
        },
        {
            "id": "int_analytics_facebook",
            "project_id": "system",
            "type": "analytics",
            "provider": "facebook_pixel",
            "settings": {
                "name": "Facebook Pixel",
                "description": "Measure, optimize, and build audiences for your advertising campaigns with Facebook Pixel.",
                "icon": "Facebook",
                "color": "#1877F2",
                "config_schema": {
                    "pixel_id": {
                        "type": "string",
                        "required": True,
                        "label": "Pixel ID",
                        "placeholder": "123456789012345",
                        "help": "Find your Pixel ID in Facebook Events Manager"
                    },
                    "auto_events": {
                        "type": "boolean",
                        "default": True,
                        "label": "Auto-track Events",
                        "help": "Automatically track page views and standard events"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Facebook Pixel in Events Manager",
                        "Copy your Pixel ID",
                        "Enter the Pixel ID in the configuration",
                        "Test your pixel with Facebook Pixel Helper",
                        "Start tracking conversions"
                    ]
                },
                "popularity_score": 85,
                "docs_url": "https://developers.facebook.com/docs/facebook-pixel",
                "support_url": "https://www.facebook.com/business/help",
                "category": "analytics"
            },
            "is_active": True
        },
        {
            "id": "int_crm_hubspot",
            "project_id": "system",
            "type": "crm",
            "provider": "hubspot",
            "settings": {
                "name": "HubSpot CRM",
                "description": "Sync leads, contacts, and deals between your website and HubSpot CRM for seamless sales operations.",
                "icon": "Work",
                "color": "#FF7A59",
                "is_premium": True,
                "config_schema": {
                    "api_key": {
                        "type": "string",
                        "required": True,
                        "label": "HubSpot API Key",
                        "placeholder": "your-api-key",
                        "help": "Generate from HubSpot Settings > Integrations > API Key"
                    },
                    "sync_contacts": {
                        "type": "boolean",
                        "default": True,
                        "label": "Sync Contacts",
                        "help": "Automatically sync form submissions to contacts"
                    },
                    "track_conversions": {
                        "type": "boolean",
                        "default": True,
                        "label": "Track Conversions",
                        "help": "Track conversions and attribution in HubSpot"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Log in to your HubSpot account",
                        "Navigate to Settings > Integrations > API Key",
                        "Generate a new API key",
                        "Copy and paste the API key",
                        "Select sync preferences",
                        "Save and enable integration"
                    ]
                },
                "popularity_score": 75,
                "docs_url": "https://developers.hubspot.com/docs/api",
                "support_url": "https://knowledge.hubspot.com",
                "category": "crm"
            },
            "is_active": True
        },
        {
            "id": "int_crm_salesforce",
            "project_id": "system",
            "type": "crm",
            "provider": "salesforce",
            "settings": {
                "name": "Salesforce CRM",
                "description": "Connect your website to Salesforce for powerful lead management, customer insights, and sales automation.",
                "icon": "Cloud",
                "color": "#00A1E0",
                "is_premium": True,
                "config_schema": {
                    "instance_url": {
                        "type": "string",
                        "required": True,
                        "label": "Instance URL",
                        "placeholder": "https://your-instance.salesforce.com",
                        "help": "Your Salesforce instance URL"
                    },
                    "client_id": {
                        "type": "string",
                        "required": True,
                        "label": "Consumer Key",
                        "placeholder": "your-consumer-key",
                        "help": "From Connected App in Salesforce Setup"
                    },
                    "client_secret": {
                        "type": "string",
                        "required": True,
                        "label": "Consumer Secret",
                        "placeholder": "your-consumer-secret",
                        "help": "From Connected App in Salesforce Setup"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Connected App in Salesforce Setup",
                        "Enable OAuth Settings",
                        "Copy Consumer Key and Consumer Secret",
                        "Enter your Salesforce instance URL",
                        "Enter credentials in configuration",
                        "Save and authenticate"
                    ]
                },
                "popularity_score": 80,
                "docs_url": "https://developer.salesforce.com/docs",
                "support_url": "https://help.salesforce.com",
                "category": "crm"
            },
            "is_active": True
        },
        {
            "id": "int_payment_stripe",
            "project_id": "system",
            "type": "payment",
            "provider": "stripe",
            "settings": {
                "name": "Stripe",
                "description": "Accept payments, manage subscriptions, and handle transactions securely with Stripe.",
                "icon": "Payment",
                "color": "#6772E5",
                "is_premium": True,
                "config_schema": {
                    "publishable_key": {
                        "type": "string",
                        "required": True,
                        "label": "Publishable Key",
                        "placeholder": "pk_test_...",
                        "help": "Found in Stripe Dashboard > Developers > API Keys"
                    },
                    "secret_key": {
                        "type": "string",
                        "required": True,
                        "label": "Secret Key",
                        "placeholder": "sk_test_...",
                        "help": "Found in Stripe Dashboard > Developers > API Keys"
                    },
                    "webhook_secret": {
                        "type": "string",
                        "required": False,
                        "label": "Webhook Secret",
                        "placeholder": "whsec_...",
                        "help": "For receiving payment events (optional)"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Stripe account",
                        "Get your API keys from Dashboard",
                        "Set up webhooks for payment events",
                        "Enter your publishable and secret keys",
                        "Configure payment options",
                        "Test with test cards before going live"
                    ]
                },
                "popularity_score": 98,
                "docs_url": "https://stripe.com/docs/api",
                "support_url": "https://support.stripe.com",
                "category": "payment"
            },
            "is_active": True
        },
        {
            "id": "int_payment_paypal",
            "project_id": "system",
            "type": "payment",
            "provider": "paypal",
            "settings": {
                "name": "PayPal",
                "description": "Accept PayPal payments for products, services, and subscriptions with secure checkout.",
                "icon": "Payment",
                "color": "#003087",
                "is_premium": True,
                "config_schema": {
                    "client_id": {
                        "type": "string",
                        "required": True,
                        "label": "Client ID",
                        "placeholder": "your-client-id",
                        "help": "Found in PayPal Developer Dashboard"
                    },
                    "secret": {
                        "type": "string",
                        "required": True,
                        "label": "Client Secret",
                        "placeholder": "your-client-secret",
                        "help": "Found in PayPal Developer Dashboard"
                    },
                    "mode": {
                        "type": "select",
                        "required": True,
                        "label": "Mode",
                        "options": ["sandbox", "live"],
                        "default": "sandbox",
                        "help": "Use sandbox for testing, live for production"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a PayPal Developer account",
                        "Create a new app in Developer Dashboard",
                        "Get your Client ID and Client Secret",
                        "Choose mode (sandbox or live)",
                        "Enter credentials in configuration",
                        "Test with sandbox accounts"
                    ]
                },
                "popularity_score": 90,
                "docs_url": "https://developer.paypal.com/docs",
                "support_url": "https://www.paypal.com/us/smarthelp/contact",
                "category": "payment"
            },
            "is_active": True
        },
        {
            "id": "int_marketing_mailchimp",
            "project_id": "system",
            "type": "email",
            "provider": "mailchimp",
            "settings": {
                "name": "Mailchimp",
                "description": "Build email lists, create campaigns, and automate marketing with Mailchimp integration.",
                "icon": "Email",
                "color": "#FFE01B",
                "config_schema": {
                    "api_key": {
                        "type": "string",
                        "required": True,
                        "label": "API Key",
                        "placeholder": "your-api-key-usX",
                        "help": "Found in Mailchimp Account > Extras > API Keys"
                    },
                    "list_id": {
                        "type": "string",
                        "required": True,
                        "label": "List ID",
                        "placeholder": "your-list-id",
                        "help": "Found in Mailchimp Audience settings"
                    },
                    "double_optin": {
                        "type": "boolean",
                        "default": True,
                        "label": "Double Opt-in",
                        "help": "Require confirmation email for new subscribers"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Log in to Mailchimp",
                        "Generate an API key",
                        "Find your Audience List ID",
                        "Enter API key and List ID",
                        "Configure double opt-in preference",
                        "Test subscription form"
                    ]
                },
                "popularity_score": 88,
                "docs_url": "https://mailchimp.com/developer",
                "support_url": "https://mailchimp.com/help",
                "category": "marketing"
            },
            "is_active": True
        },
        {
            "id": "int_marketing_google_ads",
            "project_id": "system",
            "type": "ads",
            "provider": "google_ads",
            "settings": {
                "name": "Google Ads",
                "description": "Track conversions, optimize campaigns, and measure ROI from your Google Ads campaigns.",
                "icon": "Campaign",
                "color": "#34A853",
                "config_schema": {
                    "conversion_id": {
                        "type": "string",
                        "required": True,
                        "label": "Conversion ID",
                        "placeholder": "AW-123456789",
                        "help": "Found in Google Ads > Tools > Conversions"
                    },
                    "conversion_label": {
                        "type": "string",
                        "required": True,
                        "label": "Conversion Label",
                        "placeholder": "your-label",
                        "help": "Found in Google Ads > Tools > Conversions"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Sign in to Google Ads",
                        "Set up conversion tracking",
                        "Get your conversion ID and label",
                        "Enter both IDs in configuration",
                        "Save and test with Google Tag Assistant"
                    ]
                },
                "popularity_score": 82,
                "docs_url": "https://developers.google.com/google-ads",
                "support_url": "https://support.google.com/google-ads",
                "category": "marketing"
            },
            "is_active": True
        },
        {
            "id": "int_social_instagram",
            "project_id": "system",
            "type": "social",
            "provider": "instagram",
            "settings": {
                "name": "Instagram Feed",
                "description": "Display your Instagram feed on your website with customizable layouts and auto-refresh.",
                "icon": "Instagram",
                "color": "#E4405F",
                "config_schema": {
                    "access_token": {
                        "type": "string",
                        "required": True,
                        "label": "Access Token",
                        "placeholder": "your-access-token",
                        "help": "Generate from Instagram Basic Display API"
                    },
                    "user_id": {
                        "type": "string",
                        "required": True,
                        "label": "User ID",
                        "placeholder": "your-user-id",
                        "help": "Your Instagram Business Account ID"
                    },
                    "posts_display": {
                        "type": "number",
                        "default": 12,
                        "label": "Number of Posts",
                        "help": "How many posts to display (max 20)"
                    },
                    "layout": {
                        "type": "select",
                        "required": True,
                        "label": "Layout Style",
                        "options": ["grid", "masonry", "carousel"],
                        "default": "grid",
                        "help": "Choose how posts are displayed"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Facebook App",
                        "Add Instagram Basic Display product",
                        "Generate access token with required permissions",
                        "Get your Instagram Business User ID",
                        "Enter credentials and configure display",
                        "Embed feed on your site"
                    ]
                },
                "popularity_score": 78,
                "docs_url": "https://developers.facebook.com/docs/instagram-basic-display-api",
                "support_url": "https://www.facebook.com/business/help/instagram",
                "category": "social"
            },
            "is_active": True
        },
        {
            "id": "int_ai_chatgpt",
            "project_id": "system",
            "type": "ai",
            "provider": "openai",
            "settings": {
                "name": "ChatGPT Integration",
                "description": "Enhance your website with AI-powered chatbot capabilities using OpenAI's ChatGPT.",
                "icon": "AutoAwesome",
                "color": "#10A37F",
                "is_premium": True,
                "config_schema": {
                    "api_key": {
                        "type": "string",
                        "required": True,
                        "label": "OpenAI API Key",
                        "placeholder": "sk-...",
                        "help": "Generate from OpenAI Platform"
                    },
                    "model": {
                        "type": "select",
                        "required": True,
                        "label": "Model",
                        "options": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                        "default": "gpt-3.5-turbo",
                        "help": "Select the GPT model to use"
                    },
                    "personality": {
                        "type": "text",
                        "required": False,
                        "label": "AI Personality",
                        "placeholder": "You are a helpful assistant for our website...",
                        "help": "Customize the AI's behavior and tone"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create an OpenAI account",
                        "Generate an API key",
                        "Choose your preferred model",
                        "Set AI personality (optional)",
                        "Configure chat interface",
                        "Embed chat widget on your site"
                    ]
                },
                "popularity_score": 92,
                "docs_url": "https://platform.openai.com/docs",
                "support_url": "https://help.openai.com",
                "category": "ai"
            },
            "is_active": True
        },
        {
            "id": "int_storage_cloudinary",
            "project_id": "system",
            "type": "storage",
            "provider": "cloudinary",
            "settings": {
                "name": "Cloudinary",
                "description": "Manage, optimize, and deliver images and videos with Cloudinary's cloud-based media platform.",
                "icon": "Cloud",
                "color": "#3448C5",
                "config_schema": {
                    "cloud_name": {
                        "type": "string",
                        "required": True,
                        "label": "Cloud Name",
                        "placeholder": "your-cloud-name",
                        "help": "Find in Cloudinary Dashboard"
                    },
                    "api_key": {
                        "type": "string",
                        "required": True,
                        "label": "API Key",
                        "placeholder": "your-api-key",
                        "help": "Find in Cloudinary Dashboard"
                    },
                    "api_secret": {
                        "type": "string",
                        "required": True,
                        "label": "API Secret",
                        "placeholder": "your-api-secret",
                        "help": "Find in Cloudinary Dashboard"
                    },
                    "upload_preset": {
                        "type": "string",
                        "required": False,
                        "label": "Upload Preset",
                        "placeholder": "unsigned-preset",
                        "help": "For unsigned uploads (optional)"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create Cloudinary account",
                        "Get cloud name, API key, and API secret",
                        "Configure upload settings",
                        "Set up image transformations",
                        "Integrate with media uploader"
                    ]
                },
                "popularity_score": 76,
                "docs_url": "https://cloudinary.com/documentation",
                "support_url": "https://support.cloudinary.com",
                "category": "storage"
            },
            "is_active": True
        },
        {
            "id": "int_communication_slack",
            "project_id": "system",
            "type": "communication",
            "provider": "slack",
            "settings": {
                "name": "Slack Integration",
                "description": "Get notifications, alerts, and updates from your website directly in your Slack channels.",
                "icon": "Message",
                "color": "#4A154B",
                "config_schema": {
                    "webhook_url": {
                        "type": "string",
                        "required": True,
                        "label": "Webhook URL",
                        "placeholder": "https://hooks.slack.com/services/...",
                        "help": "Create in Slack > Apps > Incoming Webhooks"
                    },
                    "channel": {
                        "type": "string",
                        "required": True,
                        "label": "Channel",
                        "placeholder": "#general",
                        "help": "Default channel for notifications"
                    },
                    "notifications": {
                        "type": "multiselect",
                        "required": True,
                        "label": "Notifications",
                        "options": ["new_lead", "new_comment", "form_submission", "sale", "error"],
                        "default": ["new_lead", "form_submission"],
                        "help": "Which events to send to Slack"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Slack app",
                        "Enable Incoming Webhooks",
                        "Create a webhook URL",
                        "Choose default channel",
                        "Select notification types",
                        "Test with sample notification"
                    ]
                },
                "popularity_score": 68,
                "docs_url": "https://api.slack.com/messaging/webhooks",
                "support_url": "https://slack.com/help",
                "category": "communication"
            },
            "is_active": True
        },
        {
            "id": "int_automation_zapier",
            "project_id": "system",
            "type": "automation",
            "provider": "zapier",
            "settings": {
                "name": "Zapier",
                "description": "Connect your website to thousands of apps with automated workflows via Zapier.",
                "icon": "FlashOn",
                "color": "#FF4A00",
                "is_premium": True,
                "config_schema": {
                    "zapier_webhook": {
                        "type": "string",
                        "required": True,
                        "label": "Webhook URL",
                        "placeholder": "https://hooks.zapier.com/hooks/catch/...",
                        "help": "Generate from Zapier webhook trigger"
                    },
                    "events_to_trigger": {
                        "type": "multiselect",
                        "required": True,
                        "label": "Trigger Events",
                        "options": [
                            "form_submission",
                            "new_user",
                            "purchase",
                            "project_created",
                            "subscription_change"
                        ],
                        "default": ["form_submission", "new_user"],
                        "help": "Events that will trigger Zapier zaps"
                    }
                },
                "setup_instructions": {
                    "steps": [
                        "Create a Zapier account",
                        "Set up a Webhook trigger in Zapier",
                        "Copy your webhook URL",
                        "Enter the webhook URL in configuration",
                        "Select trigger events",
                        "Create zaps to connect to other apps"
                    ]
                },
                "popularity_score": 86,
                "docs_url": "https://zapier.com/apps/webhook/integrations",
                "support_url": "https://help.zapier.com",
                "category": "automation"
            },
            "is_active": True
        }
    ]

    for int_data in integrations:
        existing = session.query(Integration).filter_by(id=int_data["id"]).first()
        if not existing:
            integration = Integration(**int_data)
            session.add(integration)
            print(f"Added integration: {int_data['settings']['name']}")


def seed_designs(session):
    """Seed design data with components"""
    designs = [
        {
            "id": "design_modern_agency",
            "name": "Modern Agency",
            "category": DesignCategory.BUSINESS.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "header-nav-hero-services-portfolio-team-contact-footer",
                "grid": "12-column",
                "spacing": "comfortable",
                "sections": ["header", "hero", "services", "portfolio", "team", "contact"]
            },
            "styles": {
                "primaryColor": "#6366F1",
                "secondaryColor": "#8B5CF6",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "12px",
                "shadow": "soft",
                "animations": True,
                "darkMode": False
            },
            "description": "A modern agency website design with service showcases, portfolio, and team sections.",
            "image_url": "https://placehold.co/600x400/6366F1/FFFFFF?text=Modern+Agency",
            "rating": 4.9,
            "reviews": 245,
            "features": [
                "Responsive Design",
                "Interactive Animations",
                "Service Showcase",
                "Portfolio Grid",
                "Team Profiles",
                "Contact Forms"
            ],
            "popular": True,
            "icon": "DesignServices"
        },
        {
            "id": "design_saas_dashboard",
            "name": "SaaS Dashboard",
            "category": DesignCategory.BUSINESS.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "sidebar-header-metrics-charts-tables-footer",
                "grid": "custom",
                "spacing": "compact",
                "sections": ["sidebar", "header", "metrics", "charts", "tables"]
            },
            "styles": {
                "primaryColor": "#0EA5E9",
                "secondaryColor": "#3B82F6",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "8px",
                "shadow": "subtle",
                "animations": False,
                "darkMode": True
            },
            "description": "Professional SaaS dashboard with metrics, charts, and data tables.",
            "image_url": "https://placehold.co/600x400/0EA5E9/FFFFFF?text=SaaS+Dashboard",
            "rating": 4.7,
            "reviews": 189,
            "features": [
                "Dark Mode Ready",
                "Interactive Charts",
                "Data Tables",
                "Metric Cards",
                "Sidebar Navigation",
                "Responsive Layout"
            ],
            "popular": True,
            "icon": "Dashboard"
        },
        {
            "id": "design_portfolio_creative",
            "name": "Creative Portfolio",
            "category": DesignCategory.PORTFOLIO.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "hero-gallery-about-skills-projects-testimonials-footer",
                "grid": "masonry",
                "spacing": "artistic",
                "sections": ["hero", "gallery", "about", "skills", "projects", "testimonials"]
            },
            "styles": {
                "primaryColor": "#EC4899",
                "secondaryColor": "#F43F5E",
                "fontFamily": "Poppins, sans-serif",
                "borderRadius": "16px",
                "shadow": "bold",
                "animations": True,
                "darkMode": False
            },
            "description": "Creative portfolio design perfect for artists, photographers, and designers.",
            "image_url": "https://placehold.co/600x400/EC4899/FFFFFF?text=Creative+Portfolio",
            "rating": 4.8,
            "reviews": 312,
            "features": [
                "Masonry Gallery",
                "Project Filtering",
                "Animation Effects",
                "Skill Showcase",
                "Client Testimonials",
                "About Section"
            ],
            "popular": True,
            "icon": "Brush"
        },
        {
            "id": "design_blog_magazine",
            "name": "Blog Magazine",
            "category": DesignCategory.BLOG.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "header-featured-posts-category-grid-sidebar-footer",
                "grid": "blog-layout",
                "spacing": "readable",
                "sections": ["header", "featured", "grid", "sidebar"]
            },
            "styles": {
                "primaryColor": "#10B981",
                "secondaryColor": "#059669",
                "fontFamily": "Merriweather, serif",
                "borderRadius": "8px",
                "shadow": "subtle",
                "animations": False,
                "darkMode": False
            },
            "description": "Elegant blog magazine design with featured posts and category organization.",
            "image_url": "https://placehold.co/600x400/10B981/FFFFFF?text=Blog+Magazine",
            "rating": 4.6,
            "reviews": 178,
            "features": [
                "Featured Posts",
                "Category Navigation",
                "Sidebar Widgets",
                "Reading Optimized",
                "Related Posts",
                "Comment Section"
            ],
            "popular": False,
            "icon": "Article"
        },
        {
            "id": "design_ecommerce_store",
            "name": "E-Commerce Store",
            "category": DesignCategory.ECOMMERCE.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "header-nav-search-products-cart-footer",
                "grid": "product-grid",
                "spacing": "compact",
                "sections": ["header", "categories", "products", "cart"]
            },
            "styles": {
                "primaryColor": "#F59E0B",
                "secondaryColor": "#92400E",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "4px",
                "shadow": "subtle",
                "animations": False,
                "darkMode": False
            },
            "description": "Full-featured e-commerce store with product catalog, search, and cart.",
            "image_url": "https://placehold.co/600x400/F59E0B/FFFFFF?text=E-Commerce+Store",
            "rating": 4.7,
            "reviews": 456,
            "features": [
                "Product Grid",
                "Search Functionality",
                "Category Filtering",
                "Shopping Cart",
                "Checkout Process",
                "Product Reviews"
            ],
            "popular": True,
            "icon": "ShoppingBag"
        },
        {
            "id": "design_landing_conv",
            "name": "High-Conversion Landing",
            "category": DesignCategory.LANDING.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "hero-features-benefits-testimonials-cta-footer",
                "grid": "simple",
                "spacing": "conversion",
                "sections": ["hero", "features", "benefits", "testimonials", "cta"]
            },
            "styles": {
                "primaryColor": "#EF4444",
                "secondaryColor": "#DC2626",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "8px",
                "shadow": "bold",
                "animations": True,
                "darkMode": False
            },
            "description": "High-converting landing page designed for marketing campaigns and lead generation.",
            "image_url": "https://placehold.co/600x400/EF4444/FFFFFF?text=Landing+Page",
            "rating": 4.9,
            "reviews": 589,
            "features": [
                "Conversion Optimized",
                "A/B Testing Ready",
                "Trust Signals",
                "Call to Action",
                "Testimonials",
                "Lead Capture"
            ],
            "popular": True,
            "icon": "Campaign"
        },
        {
            "id": "design_tech_startup",
            "name": "Tech Startup",
            "category": DesignCategory.CREATIVE.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "header-nav-hero-features-product-showcase-pricing-team-footer",
                "grid": "12-column",
                "spacing": "modern",
                "sections": ["header", "hero", "features", "product", "pricing", "team"]
            },
            "styles": {
                "primaryColor": "#7C3AED",
                "secondaryColor": "#6D28D9",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "12px",
                "shadow": "soft",
                "animations": True,
                "darkMode": True
            },
            "description": "Modern tech startup website with product showcase, pricing, and team sections.",
            "image_url": "https://placehold.co/600x400/7C3AED/FFFFFF?text=Tech+Startup",
            "rating": 4.8,
            "reviews": 234,
            "features": [
                "Dark Mode",
                "Product Showcase",
                "Pricing Tables",
                "Team Profiles",
                "Smooth Animations",
                "Responsive Design"
            ],
            "popular": False,
            "icon": "Rocket"
        },
        {
            "id": "design_course_platform",
            "name": "Course Platform",
            "category": DesignCategory.BUSINESS.value,
            "is_predefined": True,
            "is_public": True,
            "layout": {
                "structure": "header-search-categories-course-grid-lesson-view-footer",
                "grid": "course-layout",
                "spacing": "educational",
                "sections": ["header", "categories", "courses", "lesson"]
            },
            "styles": {
                "primaryColor": "#2563EB",
                "secondaryColor": "#1E40AF",
                "fontFamily": "Inter, sans-serif",
                "borderRadius": "12px",
                "shadow": "soft",
                "animations": False,
                "darkMode": False
            },
            "description": "Online course platform with course listings, lesson viewing, and progress tracking.",
            "image_url": "https://placehold.co/600x400/2563EB/FFFFFF?text=Course+Platform",
            "rating": 4.5,
            "reviews": 167,
            "features": [
                "Course Catalog",
                "Lesson Player",
                "Progress Tracking",
                "Categories",
                "Search",
                "Student Dashboard"
            ],
            "popular": False,
            "icon": "School"
        }
    ]

    for design_data in designs:
        existing = session.query(Design).filter_by(id=design_data["id"]).first()
        if not existing:
            design = Design(**design_data)
            session.add(design)
            print(f"Added design: {design_data['name']}")
            
            # Add components for each design
            components = get_design_components(design_data["id"], design_data["name"])
            for comp_data in components:
                comp = Component(
                    id=comp_data["id"],
                    design_id=design.id,
                    type=comp_data["type"],
                    styles=comp_data["styles"],
                    content=comp_data["content"],
                    order=comp_data["order"]
                )
                session.add(comp)
            print(f"Added {len(components)} components for design: {design_data['name']}")

def get_design_components(design_id, design_name):
    """Get components for a specific design"""
    components_map = {
        "design_modern_agency": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "100px 20px 80px",
                    "background": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Build Your Digital Presence",
                    "subtitle": "Create stunning websites with our AI-powered platform",
                    "buttonText": "Start Free Trial",
                    "buttonLink": "/signup",
                    "backgroundImage": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200"
                },
                "order": 0
            },
            {
                "id": f"{design_id}_services",
                "type": "features",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#F8FAFC",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Our Services",
                    "subtitle": "We provide everything you need to succeed online",
                    "items": [
                        {"icon": "Web", "title": "Web Design", "description": "Beautiful, responsive websites designed for conversion"},
                        {"icon": "Mobile", "title": "Mobile First", "description": "Optimized for all devices with seamless experience"},
                        {"icon": "Analytics", "title": "Analytics", "description": "Track performance and optimize your strategy"},
                        {"icon": "Cloud", "title": "Cloud Hosting", "description": "Fast, secure hosting with automatic scaling"}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_portfolio",
                "type": "portfolio",
                "styles": {
                    "padding": "80px 20px",
                    "background": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Our Work",
                    "subtitle": "See what we've created for our clients",
                    "items": [
                        {"title": "E-Commerce Platform", "category": "Web Development", "image": "https://placehold.co/400x300/6366F1/white"},
                        {"title": "Mobile App Design", "category": "UI/UX", "image": "https://placehold.co/400x300/8B5CF6/white"},
                        {"title": "Brand Identity", "category": "Design", "image": "https://placehold.co/400x300/EC4899/white"}
                    ]
                },
                "order": 2
            },
            {
                "id": f"{design_id}_cta",
                "type": "cta",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#1E293B",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Ready to Start Your Project?",
                    "subtitle": "Join hundreds of satisfied clients",
                    "buttonText": "Get Started Now",
                    "buttonLink": "/contact"
                },
                "order": 3
            }
        ],
        "design_saas_dashboard": [
            {
                "id": f"{design_id}_metrics",
                "type": "metrics",
                "styles": {
                    "padding": "20px",
                    "background": "#0F172A",
                    "color": "white"
                },
                "content": {
                    "metrics": [
                        {"label": "Total Revenue", "value": "$48,295", "change": "+12.5%"},
                        {"label": "Active Users", "value": "2,847", "change": "+8.3%"},
                        {"label": "Conversion Rate", "value": "3.2%", "change": "+0.7%"},
                        {"label": "Avg Session", "value": "4m 32s", "change": "-2.1%"}
                    ]
                },
                "order": 0
            },
            {
                "id": f"{design_id}_charts",
                "type": "charts",
                "styles": {
                    "padding": "20px",
                    "background": "#1E293B",
                    "color": "white"
                },
                "content": {
                    "title": "Performance Overview",
                    "chartType": "line",
                    "data": {
                        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        "datasets": [
                            {"label": "Revenue", "data": [12000, 19000, 15000, 22000, 28000, 32000]},
                            {"label": "Costs", "data": [8000, 11000, 10000, 14000, 16000, 18000]}
                        ]
                    }
                },
                "order": 1
            }
        ],
        "design_portfolio_creative": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "120px 20px 80px",
                    "background": "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Creative Design & Development",
                    "subtitle": "Transforming ideas into digital experiences",
                    "buttonText": "View My Work",
                    "buttonLink": "/portfolio"
                },
                "order": 0
            },
            {
                "id": f"{design_id}_gallery",
                "type": "gallery",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#FAFAFA"
                },
                "content": {
                    "title": "Recent Projects",
                    "subtitle": "A selection of my latest work",
                    "items": [
                        {"title": "Brand Identity", "category": "Design", "image": "https://placehold.co/400x400/EC4899/white"},
                        {"title": "Web Application", "category": "Development", "image": "https://placehold.co/400x400/F43F5E/white"},
                        {"title": "Mobile Design", "category": "UI/UX", "image": "https://placehold.co/400x400/8B5CF6/white"},
                        {"title": "Illustration", "category": "Art", "image": "https://placehold.co/400x400/6366F1/white"}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_testimonials",
                "type": "testimonials",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#F1F5F9",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Client Testimonials",
                    "subtitle": "What people are saying",
                    "items": [
                        {"name": "Sarah Johnson", "role": "CEO, Creative Agency", "content": "Absolutely amazing work! Transformed our online presence completely.", "rating": 5},
                        {"name": "Michael Chen", "role": "Founder, Tech Startup", "content": "The design is stunning and the team is incredibly professional.", "rating": 5},
                        {"name": "Emma Watson", "role": "Creative Director", "content": "Best design experience I've ever had. Highly recommend!", "rating": 5}
                    ]
                },
                "order": 2
            }
        ],
        "design_blog_magazine": [
            {
                "id": f"{design_id}_featured",
                "type": "featured_posts",
                "styles": {
                    "padding": "40px 20px",
                    "background": "white"
                },
                "content": {
                    "title": "Featured Articles",
                    "items": [
                        {"title": "The Future of Web Design", "category": "Technology", "image": "https://placehold.co/600x340/10B981/white", "excerpt": "Explore the trends shaping the future of web design in 2024.", "date": "2024-01-15"},
                        {"title": "Mastering CSS Grid", "category": "Development", "image": "https://placehold.co/600x340/059669/white", "excerpt": "Learn how to create complex layouts with CSS Grid.", "date": "2024-01-12"},
                        {"title": "UX Design Principles", "category": "Design", "image": "https://placehold.co/600x340/34D399/white", "excerpt": "Essential UX principles every designer should know.", "date": "2024-01-10"}
                    ]
                },
                "order": 0
            },
            {
                "id": f"{design_id}_grid",
                "type": "blog_grid",
                "styles": {
                    "padding": "40px 20px",
                    "background": "#F8FAFC"
                },
                "content": {
                    "title": "Latest Posts",
                    "items": [
                        {"title": "Getting Started with React", "category": "Development", "excerpt": "A beginner's guide to React.js", "date": "2024-01-08", "readTime": "5 min"},
                        {"title": "Color Theory in Design", "category": "Design", "excerpt": "Understanding color psychology", "date": "2024-01-05", "readTime": "4 min"},
                        {"title": "SEO Best Practices", "category": "Marketing", "excerpt": "Optimize your content for search engines", "date": "2024-01-03", "readTime": "6 min"}
                    ]
                },
                "order": 1
            }
        ],
        "design_ecommerce_store": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "60px 20px",
                    "background": "#F59E0B",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Summer Sale - Up to 50% Off",
                    "subtitle": "Shop the best deals on your favorite products",
                    "buttonText": "Shop Now",
                    "buttonLink": "/products"
                },
                "order": 0
            },
            {
                "id": f"{design_id}_categories",
                "type": "categories",
                "styles": {
                    "padding": "40px 20px",
                    "background": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Shop by Category",
                    "items": [
                        {"name": "Electronics", "icon": "Devices", "count": 156},
                        {"name": "Clothing", "icon": "Checkroom", "count": 89},
                        {"name": "Home & Garden", "icon": "Home", "count": 234},
                        {"name": "Books", "icon": "MenuBook", "count": 67}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_products",
                "type": "product_grid",
                "styles": {
                    "padding": "40px 20px",
                    "background": "#F8FAFC"
                },
                "content": {
                    "title": "Featured Products",
                    "items": [
                        {"name": "Wireless Headphones", "price": "$89.99", "image": "https://placehold.co/300x300/F59E0B/white", "rating": 4.5},
                        {"name": "Smart Watch", "price": "$199.99", "image": "https://placehold.co/300x300/92400E/white", "rating": 4.8},
                        {"name": "Laptop Backpack", "price": "$49.99", "image": "https://placehold.co/300x300/FBBF24/white", "rating": 4.2},
                        {"name": "Bluetooth Speaker", "price": "$129.99", "image": "https://placehold.co/300x300/F59E0B/white", "rating": 4.6}
                    ]
                },
                "order": 2
            }
        ],
        "design_landing_conv": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "120px 20px 80px",
                    "background": "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Boost Your Conversion Rate by 300%",
                    "subtitle": "AI-powered landing pages that convert visitors into customers",
                    "buttonText": "Start Your Free Trial",
                    "buttonLink": "/signup",
                    "trustBadges": ["Trusted by 10,000+ businesses", "No credit card required", "30-day money back guarantee"]
                },
                "order": 0
            },
            {
                "id": f"{design_id}_features",
                "type": "features",
                "styles": {
                    "padding": "80px 20px",
                    "background": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Why Choose Us",
                    "subtitle": "Everything you need to succeed",
                    "items": [
                        {"icon": "Speed", "title": "Lightning Fast", "description": "Page load speed optimized for maximum conversions"},
                        {"icon": "Mobile", "title": "Mobile Optimized", "description": "Perfect experience on every device"},
                        {"icon": "Analytics", "title": "Real-time Analytics", "description": "Track every conversion and optimize"},
                        {"icon": "Security", "title": "Enterprise Security", "description": "Your data is safe and secure"}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_cta",
                "type": "cta",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#1E293B",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Ready to 10x Your Conversions?",
                    "subtitle": "Join thousands of businesses already using our platform",
                    "buttonText": "Get Started Now",
                    "buttonLink": "/signup"
                },
                "order": 2
            }
        ],
        "design_tech_startup": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "120px 20px 80px",
                    "background": "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Build the Future with AI",
                    "subtitle": "The most powerful platform for building AI-powered applications",
                    "buttonText": "Start Building",
                    "buttonLink": "/start"
                },
                "order": 0
            },
            {
                "id": f"{design_id}_features",
                "type": "features",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#0F172A",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Powered by Cutting-Edge Technology",
                    "subtitle": "Everything you need to build the next big thing",
                    "items": [
                        {"icon": "AutoAwesome", "title": "AI-Powered", "description": "Built with the latest AI technology"},
                        {"icon": "Cloud", "title": "Cloud Native", "description": "Scale automatically with cloud infrastructure"},
                        {"icon": "Security", "title": "Built-in Security", "description": "Enterprise-grade security out of the box"},
                        {"icon": "Integrations", "title": "100+ Integrations", "description": "Connect with your favorite tools"}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_pricing",
                "type": "pricing",
                "styles": {
                    "padding": "80px 20px",
                    "background": "#1E293B",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Simple, Transparent Pricing",
                    "subtitle": "Choose the plan that works for you",
                    "plans": [
                        {"name": "Starter", "price": "$19/mo", "features": ["5 Projects", "500 Credits", "Email Support"]},
                        {"name": "Pro", "price": "$49/mo", "features": ["Unlimited Projects", "2000 Credits", "Priority Support", "API Access"]},
                        {"name": "Enterprise", "price": "Custom", "features": ["Everything in Pro", "Dedicated Support", "Custom Integrations"]}
                    ]
                },
                "order": 2
            }
        ],
        "design_course_platform": [
            {
                "id": f"{design_id}_hero",
                "type": "hero",
                "styles": {
                    "padding": "80px 20px 60px",
                    "background": "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
                    "color": "white",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Learn Anything, Anywhere",
                    "subtitle": "Access hundreds of courses taught by industry experts",
                    "buttonText": "Browse Courses",
                    "buttonLink": "/courses"
                },
                "order": 0
            },
            {
                "id": f"{design_id}_categories",
                "type": "categories",
                "styles": {
                    "padding": "40px 20px",
                    "background": "#F8FAFC",
                    "textAlign": "center"
                },
                "content": {
                    "title": "Course Categories",
                    "items": [
                        {"name": "Development", "count": 45, "icon": "Code"},
                        {"name": "Design", "count": 32, "icon": "DesignServices"},
                        {"name": "Business", "count": 28, "icon": "Business"},
                        {"name": "Marketing", "count": 23, "icon": "Campaign"}
                    ]
                },
                "order": 1
            },
            {
                "id": f"{design_id}_courses",
                "type": "course_grid",
                "styles": {
                    "padding": "40px 20px",
                    "background": "white"
                },
                "content": {
                    "title": "Popular Courses",
                    "items": [
                        {"title": "Web Development Bootcamp", "instructor": "John Smith", "students": 1234, "rating": 4.8, "price": "$99.99"},
                        {"title": "UX Design Fundamentals", "instructor": "Jane Doe", "students": 856, "rating": 4.7, "price": "$79.99"},
                        {"title": "Digital Marketing Strategy", "instructor": "Mike Johnson", "students": 2341, "rating": 4.9, "price": "$89.99"}
                    ]
                },
                "order": 2
            }
        ]
    }
    
    return components_map.get(design_id, [])

def seed_tutorials(session):
    """Seed tutorial data with additional content"""
    tutorials = [
        {
            "id": str(uuid.uuid4()),
            "title": "Getting Started with Aleyo",
            "description": "Learn the basics of Aleyo and create your first website in minutes.",
            "category": "beginner",
            "level": "Beginner",
            "duration": "15 min",
            "duration_seconds": 900,
            "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "Introduction to Aleyo", "duration": "2:30", "content": "Overview of the platform and its features"},
                {"title": "Creating Your First Project", "duration": "3:15", "content": "Step-by-step project creation"},
                {"title": "Choosing and Customizing Templates", "duration": "4:00", "content": "Template selection and customization"},
                {"title": "Publishing Your Website", "duration": "2:45", "content": "Deploy and publish your site"},
                {"title": "Next Steps", "duration": "2:30", "content": "Explore advanced features"}
            ],
            "icon": "Rocket",
            "tags": ["getting-started", "beginner", "tutorial", "basics"],
            "is_premium": False,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Advanced AI Design Techniques",
            "description": "Master AI-powered design tools to create stunning websites automatically.",
            "category": "ai",
            "level": "Advanced",
            "duration": "20 min",
            "duration_seconds": 1200,
            "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "AI Design Overview", "duration": "3:00", "content": "Understanding AI design capabilities"},
                {"title": "Generating Layouts with AI", "duration": "4:30", "content": "AI-powered layout generation"},
                {"title": "Color Palette Optimization", "duration": "3:45", "content": "AI color scheme generation"},
                {"title": "AI Content Generation", "duration": "4:15", "content": "AI-powered content creation"},
                {"title": "Design Customization", "duration": "4:30", "content": "Refining AI-generated designs"}
            ],
            "icon": "AutoAwesome",
            "tags": ["ai", "design", "advanced", "generation"],
            "is_premium": True,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "E-Commerce Mastery",
            "description": "Build a complete e-commerce website with payments, inventory, and shipping.",
            "category": "ecommerce",
            "level": "Intermediate",
            "duration": "25 min",
            "duration_seconds": 1500,
            "thumbnail_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "E-Commerce Overview", "duration": "3:00", "content": "Understanding e-commerce features"},
                {"title": "Setting Up Products", "duration": "5:00", "content": "Adding and managing products"},
                {"title": "Payment Integration", "duration": "5:30", "content": "Connect Stripe and PayPal"},
                {"title": "Shipping and Fulfillment", "duration": "4:00", "content": "Configure shipping options"},
                {"title": "Order Management", "duration": "4:00", "content": "Managing orders and customers"},
                {"title": "Launch Your Store", "duration": "3:30", "content": "Go live with your store"}
            ],
            "icon": "ShoppingBag",
            "tags": ["ecommerce", "store", "payment", "shipping"],
            "is_premium": True,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "SEO Mastery for Beginners",
            "description": "Learn how to optimize your website for search engines and drive organic traffic.",
            "category": "seo",
            "level": "Beginner",
            "duration": "18 min",
            "duration_seconds": 1080,
            "thumbnail_url": "https://images.unsplash.com/photo-1432889821006-3149409458ae?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "SEO Fundamentals", "duration": "3:30", "content": "Understanding SEO basics"},
                {"title": "Keyword Research", "duration": "4:00", "content": "Finding the right keywords"},
                {"title": "On-Page Optimization", "duration": "4:30", "content": "Optimizing content and meta tags"},
                {"title": "Technical SEO", "duration": "3:00", "content": "Site structure and performance"},
                {"title": "Content Strategy", "duration": "3:00", "content": "Creating SEO-friendly content"}
            ],
            "icon": "Analytics",
            "tags": ["seo", "marketing", "traffic", "optimization"],
            "is_premium": False,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "API Integration Guide",
            "description": "Connect your website with third-party services and APIs for enhanced functionality.",
            "category": "integrations",
            "level": "Advanced",
            "duration": "22 min",
            "duration_seconds": 1320,
            "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "API Basics", "duration": "3:00", "content": "Understanding APIs and integration"},
                {"title": "Popular Integrations", "duration": "5:00", "content": "CRM, Analytics, and Marketing tools"},
                {"title": "Custom API Setup", "duration": "4:30", "content": "Creating custom API connections"},
                {"title": "Data Sync and Management", "duration": "4:30", "content": "Syncing data between platforms"},
                {"title": "Advanced Integration Patterns", "duration": "5:00", "content": "Webhooks and automation"}
            ],
            "icon": "Link",
            "tags": ["api", "integration", "development", "automation"],
            "is_premium": True,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Performance Optimization Pro",
            "description": "Speed up your website and improve user experience with advanced optimization techniques.",
            "category": "performance",
            "level": "Advanced",
            "duration": "20 min",
            "duration_seconds": 1200,
            "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "Performance Metrics", "duration": "3:00", "content": "Understanding Core Web Vitals"},
                {"title": "Image Optimization", "duration": "4:00", "content": "Optimizing images for the web"},
                {"title": "Code Optimization", "duration": "4:30", "content": "Minifying and bundling code"},
                {"title": "Caching Strategies", "duration": "4:00", "content": "Implementing effective caching"},
                {"title": "Monitoring and Testing", "duration": "4:30", "content": "Performance monitoring tools"}
            ],
            "icon": "Speed",
            "tags": ["performance", "speed", "optimization", "web-vitals"],
            "is_premium": True,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Marketing Automation with Aleyo",
            "description": "Automate your marketing campaigns and grow your business with Aleyo's marketing tools.",
            "category": "marketing",
            "level": "Intermediate",
            "duration": "16 min",
            "duration_seconds": 960,
            "thumbnail_url": "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "Marketing Automation Overview", "duration": "3:00", "content": "Understanding marketing automation"},
                {"title": "Email Marketing Setup", "duration": "3:30", "content": "Configure email campaigns"},
                {"title": "Lead Generation", "duration": "3:45", "content": "Creating lead capture forms"},
                {"title": "Analytics and Reporting", "duration": "3:00", "content": "Track campaign performance"},
                {"title": "Optimization Strategies", "duration": "2:45", "content": "A/B testing and optimization"}
            ],
            "icon": "Campaign",
            "tags": ["marketing", "automation", "email", "leads"],
            "is_premium": False,
            "status": "published"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Design System Implementation",
            "description": "Create and maintain a consistent design system for your projects.",
            "category": "design",
            "level": "Intermediate",
            "duration": "18 min",
            "duration_seconds": 1080,
            "thumbnail_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=340&fit=crop",
            "video_embed_code": '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            "sections": [
                {"title": "Design System Basics", "duration": "3:00", "content": "Understanding design systems"},
                {"title": "Creating a Style Guide", "duration": "4:00", "content": "Colors, typography, and spacing"},
                {"title": "Component Library", "duration": "4:30", "content": "Building reusable components"},
                {"title": "Documentation", "duration": "3:00", "content": "Documenting your design system"},
                {"title": "Maintenance and Updates", "duration": "3:30", "content": "Keeping the system up to date"}
            ],
            "icon": "DesignServices",
            "tags": ["design", "system", "component", "style-guide"],
            "is_premium": False,
            "status": "published"
        }
    ]

    for tutorial_data in tutorials:
        existing = session.query(Tutorial).filter_by(title=tutorial_data["title"]).first()
        if not existing:
            tutorial = Tutorial(**tutorial_data)
            session.add(tutorial)
            print(f"Added tutorial: {tutorial_data['title']}")

def main():
    """Main seeding function"""
    print("=" * 60)
    print("Creating tables (if they don't already exist)...")
    print("=" * 60)
    Base.metadata.create_all(bind=engine)
    print("Tables ready.\n")

    session = SessionLocal()
    
    try:
        print("=" * 60)
        print("Starting Aleyo Database Seeding...")
        print("=" * 60)
        
        # Seed data in order
        print("\n💷 Seeding Subscription Plans...")
        seed_subscription_plans(session)

        print("\n🌱 Seeding Integrations...")
        seed_integrations(session)
        
        print("\n🎨 Seeding Designs and Components...")
        seed_designs(session)
        
        print("\n📚 Seeding Tutorials...")
        seed_tutorials(session)
        
        session.commit()
        
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()