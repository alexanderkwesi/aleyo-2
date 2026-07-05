# backend/insert_sample_designs.py
from database import SessionLocal
from models import Design, Component
import uuid
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def insert_sample_designs():
    db = SessionLocal()
    
    try:
        designs_data = [
            {
                "name": "Modern Minimalist",
                "category": "business",
                "description": "Clean and professional design perfect for corporate websites",
                "image_url": "https://placehold.co/600x400/A59B8C/FFFFFF?text=Modern+Minimalist",
                "rating": 4.8,
                "reviews": 234,
                "features": ["Responsive", "SEO Optimized", "Fast Loading"],
                "popular": True,
                "icon": "Business",
                "styles": {
                    "primaryColor": "#A59B8C",
                    "secondaryColor": "#6B5E4A",
                    "accentColor": "#C4B5A0",
                    "backgroundColor": "#FAF9F7",
                    "textColor": "#2C2C2C",
                    "headingColor": "#1A1A1A",
                    "heroTitle": "Modern Minimalist Design",
                    "heroSubtitle": "Clean, professional, and effective"
                }
            },
            {
                "name": "Creative Agency",
                "category": "portfolio",
                "description": "Bold and artistic layout for creative professionals",
                "image_url": "https://placehold.co/600x400/2C6E6B/FFFFFF?text=Creative+Agency",
                "rating": 4.9,
                "reviews": 567,
                "features": ["Animations", "Portfolio Grid", "Contact Form"],
                "popular": True,
                "icon": "DesignServices",
                "styles": {
                    "primaryColor": "#2C6E6B",
                    "secondaryColor": "#FF6B6B",
                    "accentColor": "#4ECDC4",
                    "backgroundColor": "#FFFFFF",
                    "textColor": "#2C3E50",
                    "headingColor": "#1A2A3A",
                    "heroTitle": "Creative Agency",
                    "heroSubtitle": "We create bold digital experiences"
                }
            },
            {
                "name": "Shop Modern",
                "category": "ecommerce",
                "description": "Feature-rich e-commerce template with product showcase",
                "image_url": "https://placehold.co/600x400/1F2A2E/FFFFFF?text=Shop+Modern",
                "rating": 4.7,
                "reviews": 892,
                "features": ["Product Gallery", "Cart Integration", "Payment Ready"],
                "popular": True,
                "icon": "Storefront",
                "styles": {
                    "primaryColor": "#1F2A2E",
                    "secondaryColor": "#E67E22",
                    "accentColor": "#F39C12",
                    "backgroundColor": "#FFFFFF",
                    "textColor": "#2C3E50",
                    "headingColor": "#1F2A2E",
                    "heroTitle": "Shop Modern",
                    "heroSubtitle": "Discover the latest trends"
                }
            },
            {
                "name": "EduSmart",
                "category": "education",
                "description": "Engaging design for online courses and educational platforms",
                "image_url": "https://placehold.co/600x400/4A5D73/FFFFFF?text=EduSmart",
                "rating": 4.6,
                "reviews": 156,
                "features": ["Course Layout", "Video Support", "Student Dashboard"],
                "popular": False,
                "icon": "School",
                "styles": {
                    "primaryColor": "#4A5D73",
                    "secondaryColor": "#7F8C8D",
                    "accentColor": "#3498DB",
                    "backgroundColor": "#F8F9FA",
                    "textColor": "#2C3E50",
                    "headingColor": "#2C3E50",
                    "heroTitle": "EduSmart",
                    "heroSubtitle": "Learn anything, anywhere"
                }
            },
            {
                "name": "Foodie Delight",
                "category": "restaurant",
                "description": "Appetizing design for restaurants and cafes",
                "image_url": "https://placehold.co/600x400/7B3E19/FFFFFF?text=Foodie+Delight",
                "rating": 4.8,
                "reviews": 423,
                "features": ["Menu Display", "Reservation System", "Gallery"],
                "popular": True,
                "icon": "Restaurant",
                "styles": {
                    "primaryColor": "#7B3E19",
                    "secondaryColor": "#E67E22",
                    "accentColor": "#F1C40F",
                    "backgroundColor": "#FFF9F5",
                    "textColor": "#4A2C1A",
                    "headingColor": "#7B3E19",
                    "heroTitle": "Foodie Delight",
                    "heroSubtitle": "Taste the extraordinary"
                }
            },
            {
                "name": "Tech Startup",
                "category": "business",
                "description": "Modern template for tech companies and startups",
                "image_url": "https://placehold.co/600x400/283655/FFFFFF?text=Tech+Startup",
                "rating": 4.9,
                "reviews": 678,
                "features": ["Hero Section", "Feature Grid", "Team Showcase"],
                "popular": False,
                "icon": "Code",
                "styles": {
                    "primaryColor": "#283655",
                    "secondaryColor": "#4D648D",
                    "accentColor": "#1E81B0",
                    "backgroundColor": "#0A0F1A",
                    "textColor": "#E0E0E0",
                    "headingColor": "#FFFFFF",
                    "heroTitle": "Tech Startup",
                    "heroSubtitle": "Building the future, today"
                }
            }
        ]
        
        inserted_count = 0
        updated_count = 0
        
        for design_data in designs_data:
            # Check if design already exists
            existing = db.query(Design).filter(Design.name == design_data["name"]).first()
            if existing:
                # Update existing
                for key, value in design_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                existing.updated_at = datetime.now(timezone.utc)
                updated_count += 1
                logger.info(f"Updated design: {design_data['name']}")
            else:
                design = Design(
                    id=str(uuid.uuid4()),
                    **design_data,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(design)
                inserted_count += 1
                logger.info(f"Added design: {design_data['name']}")
        
        db.commit()
        logger.info(f"\nSuccess! Inserted {inserted_count} new designs and updated {updated_count} existing designs.")
        
    except Exception as e:
        logger.error(f"Error inserting designs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    insert_sample_designs()