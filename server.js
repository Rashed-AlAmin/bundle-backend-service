require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

// Helper function to get a fresh access token
async function getAccessToken() {
    const url = `https://${SHOPIFY_STORE}/admin/oauth/access_token`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    });
    const data = await response.json();
    return data.access_token;
}

app.post('/bundle-checkout', async (req, res) => {
  try {
    const { line_items } = req.body;

    if (!line_items || line_items.length === 0) {
      return res.status(400).json({ error: 'No line items provided' });
    }

    // Automatically fetch a fresh token for this request
    const currentToken = await getAccessToken();

    console.log('Received line items:', JSON.stringify(line_items, null, 2));

    const draftOrderPayload = {
      draft_order: {
        line_items: line_items.map(item => ({
          variant_id: parseInt(item.variant_id),
          quantity: 1,
          applied_discount: {
            value_type: 'fixed_amount',
            value: item.original_price 
              ? (parseFloat(item.original_price) - parseFloat(item.price)).toFixed(2)
              : '0.00',
            amount: item.original_price
              ? (parseFloat(item.original_price) - parseFloat(item.price)).toFixed(2)
              : '0.00',
            title: 'Bundle Price'
          }
        })),
        tax_exempt: true,
        shipping_line: {
          title: 'Free Shipping',
          price: '0.00',
          code: 'FREE'
        },
        tags: 'bundle-builder',
        note: 'Bundle Builder order'
      }
    };

    console.log('Draft order payload:', JSON.stringify(draftOrderPayload, null, 2));

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/draft_orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': currentToken // Using the refreshed token here
        },
        body: JSON.stringify(draftOrderPayload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Shopify API error:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'Failed to create draft order', details: data });
    }

    const draftOrder = data.draft_order;
    res.json({
      checkout_url: draftOrder.invoice_url,
      draft_order_id: draftOrder.id
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bundle backend running on http://localhost:${PORT}`);
});