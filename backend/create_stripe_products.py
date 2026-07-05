# scripts/create_stripe_products.py
import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

products = [
    {
        "name": "Starter Plan",
        "description": "500 AI credits per month",
        "monthly_price": 2900,
        "yearly_price": 29000,
        "metadata": {"plan_id": "starter"}
    },
    {
        "name": "Pro Plan",
        "description": "2000 AI credits per month",
        "monthly_price": 7900,
        "yearly_price": 79000,
        "metadata": {"plan_id": "pro"}
    },
    {
        "name": "Enterprise Plan",
        "description": "10000 AI credits per month",
        "monthly_price": 19900,
        "yearly_price": 199000,
        "metadata": {"plan_id": "enterprise"}
    }
]

for product_data in products:
    # Create product
    product = stripe.Product.create(
        name=product_data["name"],
        description=product_data["description"],
        metadata=product_data["metadata"]
    )
    
    # Create monthly price
    monthly_price = stripe.Price.create(
        product=product.id,
        unit_amount=product_data["monthly_price"],
        currency="usd",
        recurring={"interval": "month"},
        metadata={"interval": "monthly"}
    )
    
    # Create yearly price
    yearly_price = stripe.Price.create(
        product=product.id,
        unit_amount=product_data["yearly_price"],
        currency="usd",
        recurring={"interval": "year"},
        metadata={"interval": "yearly"}
    )
    
    print(f"Created {product_data['name']}:")
    print(f"  Product ID: {product.id}")
    print(f"  Monthly Price ID: {monthly_price.id}")
    print(f"  Yearly Price ID: {yearly_price.id}")
    print()