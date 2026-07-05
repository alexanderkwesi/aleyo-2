# seed_integrations.py
from sqlalchemy.orm import Session
from models import Design, Component
import uuid
from datetime import datetime, timezone

def seed_default_designs(db: Session):
    """Seed default designs with components"""
    
    designs = [
        {
            "id": "design-1",
            "name": "Business Pro",
            "category": "business",
            "description": "Professional business template with modern design",
            "image_url": "/images/designs/business-pro.jpg",
            "rating": 4.8,
            "reviews": 124,
            "features": ["Hero Section", "Features Grid", "Team Section", "Contact Form"],
            "popular": True,
            "icon": "Business",
            "styles": {
                "primaryColor": "#4F6EF7",
                "secondaryColor": "#2DBCB6",
                "accentColor": "#3ED67C",
                "backgroundColor": "#FAF9F7",
                "textColor": "#2C2C2C",
                "headingColor": "#1A1A1A",
            },
            "layout": {
                "sections": ["hero", "features", "about", "team", "contact"]
            }
        },
        # Add more designs here...
    ]
    
    for design_data in designs:
        design = Design(
            id=design_data["id"],
            name=design_data["name"],
            category=design_data["category"],
            description=design_data.get("description"),
            image_url=design_data.get("image_url"),
            rating=design_data.get("rating", 4.5),
            reviews=design_data.get("reviews", 0),
            features=design_data.get("features", []),
            popular=design_data.get("popular", False),
            icon=design_data.get("icon", "DesignServices"),
            styles=design_data.get("styles", {}),
            layout=design_data.get("layout", {}),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(design)
    
    db.commit()