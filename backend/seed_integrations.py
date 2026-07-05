# seed_integrations.py
from sqlalchemy.orm import Session
from models import Integration, Project
import uuid
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Router for API endpoints
from fastapi import APIRouter, Depends, HTTPException
from database import get_db

router = APIRouter()

def get_current_user_placeholder():
    """
    Placeholder auth dependency. app.py must override this at startup with:
        app.dependency_overrides[get_current_user_placeholder] = get_current_user
    (see app.py for exact wiring instructions)
    """
    raise HTTPException(status_code=500, detail="Authentication dependency not configured")

@router.get("/integrations/available")
async def get_available_integrations():
    """Get list of available integrations"""
    return [
        {
            "id": "formspree",
            "name": "Formspree",
            "type": "forms",
            "description": "Simple form handling with email delivery",
            "icon": "Forms",
            "category": "Forms",
            "requires_api_key": True,
            "docs_url": "https://formspree.io/docs",
            "setup_steps": [
                "Sign up at formspree.io",
                "Get your form endpoint ID",
                "Enter your API key below"
            ],
            "settings": [
                {"key": "endpoint_id", "label": "Form Endpoint ID", "type": "text", "required": True}
            ]
        },
        {
            "id": "stripe",
            "name": "Stripe",
            "type": "payment",
            "description": "Accept payments with Stripe",
            "icon": "Payment",
            "category": "Payments",
            "requires_api_key": True,
            "docs_url": "https://stripe.com/docs",
            "setup_steps": [
                "Sign up at stripe.com",
                "Get your API keys",
                "Enter your API key below"
            ],
            "settings": [
                {"key": "api_key", "label": "Stripe API Key", "type": "password", "required": True}
            ]
        },
        {
            "id": "mailchimp",
            "name": "Mailchimp",
            "type": "email",
            "description": "Email marketing and newsletter management",
            "icon": "Email",
            "category": "Email",
            "requires_api_key": True,
            "docs_url": "https://mailchimp.com/developer",
            "setup_steps": [
                "Sign up at mailchimp.com",
                "Get your API key",
                "Enter your API key below"
            ],
            "settings": [
                {"key": "api_key", "label": "Mailchimp API Key", "type": "password", "required": True},
                {"key": "dc", "label": "Data Center (e.g., usX)", "type": "text", "required": True}
            ]
        },
        {
            "id": "calendly",
            "name": "Calendly",
            "type": "calendar",
            "description": "Schedule meetings and appointments",
            "icon": "Calendar",
            "category": "Scheduling",
            "requires_api_key": False,
            "docs_url": "https://calendly.com/docs",
            "setup_steps": [
                "Sign up at calendly.com",
                "Get your username",
                "Enter your username below"
            ],
            "settings": [
                {"key": "username", "label": "Calendly Username", "type": "text", "required": True}
            ]
        },
        {
            "id": "google_ads",
            "name": "Google Ads",
            "type": "ads",
            "description": "Track conversions with Google Ads",
            "icon": "Advertising",
            "category": "Advertising",
            "requires_api_key": True,
            "docs_url": "https://developers.google.com/google-ads",
            "setup_steps": [
                "Get your Google Ads ID",
                "Enter your ID below"
            ],
            "settings": [
                {"key": "conversion_id", "label": "Google Ads Conversion ID", "type": "text", "required": True}
            ]
        },
        {
            "id": "meta_ads",
            "name": "Meta Ads",
            "type": "ads",
            "description": "Track conversions with Facebook/Meta Ads",
            "icon": "Advertising",
            "category": "Advertising",
            "requires_api_key": True,
            "docs_url": "https://developers.facebook.com/docs/meta-pixel",
            "setup_steps": [
                "Get your Meta Pixel ID",
                "Enter your ID below"
            ],
            "settings": [
                {"key": "pixel_id", "label": "Meta Pixel ID", "type": "text", "required": True}
            ]
        }
    ]

@router.get("/integrations/connected")
async def get_connected_integrations(
    current_user = Depends(get_current_user_placeholder),
    db: Session = Depends(get_db)
):
    """Get all integrations connected to user's projects"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    project_ids = [p.id for p in user_projects]
    
    if not project_ids:
        return []
    
    integrations = db.query(Integration).filter(
        Integration.project_id.in_(project_ids)
    ).all()
    
    return [
        {
            "id": str(i.id),
            "project_id": str(i.project_id),
            "type": i.type,
            "provider": i.provider,
            "is_active": i.is_active,
            "settings": i.settings,
            "created_at": i.created_at,
            "updated_at": i.updated_at
        }
        for i in integrations
    ]

@router.post("/integrations/connect")
async def connect_integration(
    provider_id: str,
    project_id: str,
    settings: dict,
    current_user = Depends(get_current_user_placeholder),
    db: Session = Depends(get_db)
):
    """Connect an integration to a project"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if integration already exists
    existing = db.query(Integration).filter(
        Integration.project_id == project_id,
        Integration.provider == provider_id
    ).first()
    
    if existing:
        # Update existing
        existing.settings = settings
        existing.is_active = True
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {
            "success": True,
            "message": "Integration updated successfully",
            "integration_id": str(existing.id)
        }
    
    # Get available integrations to find the type
    available = await get_available_integrations()
    integration_info = next((i for i in available if i["id"] == provider_id), None)
    
    if not integration_info:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Create new integration
    integration = Integration(
        id=str(uuid.uuid4()),
        project_id=project_id,
        type=integration_info["type"],
        provider=provider_id,
        settings=settings,
        is_active=True
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    return {
        "success": True,
        "message": "Integration connected successfully",
        "integration_id": str(integration.id)
    }

@router.delete("/integrations/{integration_id}")
async def disconnect_integration(
    integration_id: str,
    current_user = Depends(get_current_user_placeholder),
    db: Session = Depends(get_db)
):
    """Disconnect an integration"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    integration = db.query(Integration).join(
        Project, Integration.project_id == Project.id
    ).filter(
        Integration.id == integration_id,
        Project.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()
    
    return {
        "success": True,
        "message": "Integration disconnected successfully"
    }

def seed_integrations(db: Session) -> bool:
    """Seed system integrations"""
    try:
        # Check if system integrations already exist
        existing = db.query(Integration).filter(
            Integration.project_id == "system"
        ).first()
        
        if existing:
            logger.info("System integrations already seeded")
            return True
        
        # Create system integrations
        system_integrations = [
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "forms",
                "provider": "formspree",
                "settings": {
                    "name": "Formspree",
                    "description": "Simple form handling",
                    "docs_url": "https://formspree.io/docs"
                },
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "payment",
                "provider": "stripe",
                "settings": {
                    "name": "Stripe",
                    "description": "Accept payments",
                    "docs_url": "https://stripe.com/docs"
                },
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "email",
                "provider": "mailchimp",
                "settings": {
                    "name": "Mailchimp",
                    "description": "Email marketing",
                    "docs_url": "https://mailchimp.com/developer"
                },
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "calendar",
                "provider": "calendly",
                "settings": {
                    "name": "Calendly",
                    "description": "Schedule meetings",
                    "docs_url": "https://calendly.com/docs"
                },
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "ads",
                "provider": "google_ads",
                "settings": {
                    "name": "Google Ads",
                    "description": "Track conversions",
                    "docs_url": "https://developers.google.com/google-ads"
                },
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "project_id": "system",
                "type": "ads",
                "provider": "meta_ads",
                "settings": {
                    "name": "Meta Ads",
                    "description": "Track conversions",
                    "docs_url": "https://developers.facebook.com/docs/meta-pixel"
                },
                "is_active": True
            }
        ]
        
        for integration_data in system_integrations:
            integration = Integration(**integration_data)
            db.add(integration)
            logger.info(f"Added system integration: {integration_data['provider']}")
        
        db.commit()
        logger.info("System integrations seeded successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error seeding integrations: {e}")
        db.rollback()
        return False