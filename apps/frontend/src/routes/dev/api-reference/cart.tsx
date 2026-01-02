import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocSubheading,
  DocParagraph,
  Endpoint,
  ParamTable,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/cart')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Shopping Cart API</DocHeading>
      <DocParagraph>
        Manage shopping cart items with session-based persistence, discount codes, and real-time
        total calculation.
      </DocParagraph>

      <DocSubheading id="get-cart">Get or Create Cart</DocSubheading>
      <Endpoint
        method="GET"
        path="/cart"
        description="Retrieve existing cart or create new one for the session"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'UUID session identifier',
            },
            {
              name: 'customerId',
              type: 'number',
              required: false,
              description: 'Customer ID for logged-in users',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "customerId": null,
      "status": "active",
      "subtotal": "59.98",
      "discountTotal": "0.00",
      "taxTotal": "0.00",
      "shippingTotal": "0.00",
      "total": "59.98"
    },
    "items": [
      {
        "item": {
          "id": 1,
          "cartId": 1,
          "productVariantId": 1,
          "quantity": 2,
          "unitPrice": "29.99"
        },
        "variant": {
          "id": 1,
          "sku": "SHIRT-BLK-SM",
          "price": "29.99"
        },
        "product": {
          "id": 1,
          "name": "Classic Cotton T-Shirt"
        }
      }
    ]
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="add-item">Add Item to Cart</DocSubheading>
      <Endpoint
        method="POST"
        path="/cart/items"
        description="Add a product variant to the cart"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'Session UUID',
            },
            {
              name: 'productVariantId',
              type: 'number',
              required: true,
              description: 'ID of the product variant to add',
            },
            {
              name: 'quantity',
              type: 'number',
              required: true,
              description: 'Quantity to add (must be > 0)',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "cartId": 1,
      "productVariantId": 1,
      "quantity": 2,
      "unitPrice": "29.99"
    },
    "cart": {
      "id": 1,
      "subtotal": "59.98",
      "total": "59.98"
    }
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="update-item">Update Item Quantity</DocSubheading>
      <Endpoint
        method="PUT"
        path="/cart/items/:itemId"
        description="Update the quantity of a cart item"
      >
        <ParamTable
          params={[
            {
              name: 'quantity',
              type: 'number',
              required: true,
              description: 'New quantity (must be > 0)',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "quantity": 3,
      "unitPrice": "29.99"
    },
    "cart": {
      "subtotal": "89.97",
      "total": "89.97"
    }
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="remove-item">Remove Item from Cart</DocSubheading>
      <Endpoint
        method="DELETE"
        path="/cart/items/:itemId"
        description="Remove an item from the cart"
      >
        <ResponseExample>{`{
  "success": true,
  "message": "Item removed from cart"
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="clear-cart">Clear Cart</DocSubheading>
      <Endpoint
        method="DELETE"
        path="/cart/clear"
        description="Remove all items from cart"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'Session UUID',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "message": "Cart cleared successfully"
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="apply-discount">Apply Discount Code</DocSubheading>
      <Endpoint
        method="POST"
        path="/cart/discount"
        description="Apply a discount code to the cart"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'Session UUID',
            },
            {
              name: 'code',
              type: 'string',
              required: true,
              description: 'Discount code to apply',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "subtotal": "89.97",
    "discountTotal": "17.99",
    "total": "71.98"
  },
  "message": "Discount applied successfully"
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="remove-discount">Remove Discount Code</DocSubheading>
      <Endpoint
        method="DELETE"
        path="/cart/discount"
        description="Remove applied discount code from cart"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'Session UUID',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "subtotal": "89.97",
    "discountTotal": "0.00",
    "total": "89.97"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="calculate-totals">Calculate Cart Totals</DocSubheading>
      <Endpoint
        method="POST"
        path="/cart/calculate"
        description="Calculate cart totals including tax and shipping"
      >
        <ParamTable
          params={[
            {
              name: 'sessionId',
              type: 'string',
              required: true,
              description: 'Session UUID',
            },
            {
              name: 'shippingAddressId',
              type: 'number',
              required: true,
              description: 'Shipping address ID for tax calculation',
            },
            {
              name: 'shippingMethodId',
              type: 'number',
              required: true,
              description: 'Selected shipping method ID',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "subtotal": "89.97",
    "discountTotal": "17.99",
    "taxTotal": "6.48",
    "shippingTotal": "5.99",
    "total": "84.45",
    "breakdown": {
      "items": [
        {
          "productVariantId": 1,
          "quantity": 3,
          "unitPrice": "29.99",
          "totalPrice": "89.97"
        }
      ],
      "tax": {
        "jurisdiction": "California",
        "rate": "0.09",
        "amount": "6.48"
      },
      "shipping": {
        "method": "Standard Shipping",
        "cost": "5.99"
      }
    }
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="example-usage">Example Usage</DocSubheading>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`// Get session ID
const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
localStorage.setItem('sessionId', sessionId)

// Load cart
const cart = await fetch(\`http://localhost:3000/cart?sessionId=\${sessionId}\`)
  .then(res => res.json())

// Add item to cart
await fetch('http://localhost:3000/cart/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    productVariantId: 1,
    quantity: 2
  })
})

// Apply discount code
await fetch('http://localhost:3000/cart/discount', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    code: 'SUMMER20'
  })
})

// Calculate totals before checkout
const totals = await fetch('http://localhost:3000/cart/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    shippingAddressId: 1,
    shippingMethodId: 1
  })
}).then(res => res.json())`}</code>
      </pre>
    </DocsLayout>
  )
}
