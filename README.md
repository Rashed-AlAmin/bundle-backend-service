# Bundle Backend Service

Node.js/Express backend for the Shopify Bundle Builder feature.

Live API: https://bundle-backend-service.onrender.com

---

## What it does

Receives selected bundle products and their bundle prices from
the Shopify storefront, then creates a Shopify Draft Order with
line item price overrides via the Admin API.

This is required because standard Shopify discounts cannot
dynamically override prices for arbitrary product combinations.
Draft Orders allow precise per-line-item price control.

---

## How it works
```
Customer completes bundle steps on storefront
        ↓
Frontend sends variant IDs + bundle prices + original prices
        ↓
Backend calculates discount per line item:
discount = original_price - bundle_price
        ↓
Creates Draft Order via Shopify Admin API with applied_discount
per line item + tax_exempt + free shipping
        ↓
Returns draft order checkout URL
        ↓
Customer redirected to real Shopify checkout showing:
- Crossed out original prices
- Bundle prices applied
- Total savings displayed
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/bundle-checkout` | POST | Create draft order, return checkout URL |

### POST /bundle-checkout

Request body:
```json
{
  "line_items": [
    {
      "variant_id": 123456,
      "quantity": 1,
      "price": "1000",
      "original_price": "1500.00"
    }
  ]
}
```

Response:
```json
{
  "checkout_url": "https://fitness-food-lab.myshopify.com/...",
  "draft_order_id": 123456
}
```

---

## Tech Stack
- Node.js v24
- Express
- Shopify Admin API 2024-01
- Deployed on Render

## Local Development
```bash
npm install
# Create .env file with:
# SHOPIFY_STORE=your-store.myshopify.com
# SHOPIFY_ACCESS_TOKEN=your_token
# PORT=3000
node server.js
```

## Related
Shopify theme repo: https://github.com/Rashed-AlAmin/shopify-gym-food-lab