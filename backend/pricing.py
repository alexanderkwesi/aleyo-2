# pricing.py - Pricing / subscription plan endpoints
#
# Serves the plans your existing `subscription_plans` table already holds
# (seeded via init_db.py's seed_subscription_plans). Mount this router in
# app.py:
#
#   from pricing import router as pricing_router
#   app.include_router(pricing_router)
#
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import SubscriptionPlan, SubscriptionTier

router = APIRouter()

# Cosmetic details the DB doesn't store (icon name, card accent color,
# "Most Popular" badge). Keyed by tier — edit freely, this is UI-only.
PLAN_UI_META = {
    "starter": {"icon": "Rocket", "color": "#4F6EF7", "popular": False},
    "pro": {"icon": "Business", "color": "#2DBCB6", "popular": True},
    "enterprise": {"icon": "Apartment", "color": "#3ED67C", "popular": False},
}


def serialize_plan(plan: SubscriptionPlan) -> dict:
    """Shape a SubscriptionPlan row into what Pricing.js expects from
    GET /api/payment/plans — id, name, icon, price_monthly, price_yearly,
    credits, features, popular, color."""
    meta = PLAN_UI_META.get(plan.tier.value, {})
    return {
        "id": plan.tier.value,  # 'starter' | 'pro' | 'enterprise' — used as plan_id at checkout
        "name": plan.name,
        "icon": meta.get("icon"),
        "price_monthly": plan.price_monthly,
        "price_yearly": plan.price_yearly,
        "credits": plan.monthly_credits,
        "features": plan.features or [],
        "popular": meta.get("popular", False),
        "color": meta.get("color"),
    }


@router.get("/payment/plans")
async def list_plans(db: Session = Depends(get_db)):
    """Public pricing list (GBP). No auth required — matches Pricing.js,
    which calls this with an optional bearer token."""
    plans = (
        db.query(SubscriptionPlan)
        .order_by(SubscriptionPlan.price_monthly.asc())
        .all()
    )
    return {"plans": [serialize_plan(p) for p in plans]}


@router.get("/payment/plans/{plan_code}")
async def get_plan(plan_code: str, db: Session = Depends(get_db)):
    """Single plan lookup, e.g. for a checkout confirmation page."""
    try:
        tier = SubscriptionTier(plan_code)
    except ValueError:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan = db.query(SubscriptionPlan).filter_by(tier=tier).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    return serialize_plan(plan)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("Pricing", host="127.0.0.1", port=8003, log_level="info")