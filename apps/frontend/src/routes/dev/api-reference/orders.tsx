import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocSubheading,
  DocParagraph,
  DocCode,
  Endpoint,
  ParamTable,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/orders')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Orders API</DocHeading>
      <DocParagraph>
        Complete checkout flow with automatic tax and shipping calculation, order tracking, and
        order history.
      </DocParagraph>

      <DocSubheading id="place-order">Place Order</DocSubheading>
      <Endpoint
        method="POST"
        path="/orders"
        description="Create a new order with automatic tax and shipping calculation"
      >
        <ParamTable
          params={[
            {
              name: 'customerId',
              type: 'number',
              required: true,
              description: 'Customer ID placing the order',
            },
            {
              name: 'shippingAddressId',
              type: 'number',
              required: true,
              description: 'Shipping address ID',
            },
            {
              name: 'billingAddressId',
              type: 'number',
              required: true,
              description: 'Billing address ID',
            },
            {
              name: 'shippingMethodId',
              type: 'number',
              required: true,
              description: 'Selected shipping method ID',
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              description: 'Array of order items with productVariantId, quantity, unitPrice',
            },
            {
              name: 'sessionId',
              type: 'string',
              required: false,
              description: 'Session UUID for campaign attribution',
            },
            {
              name: 'discountCodeId',
              type: 'number',
              required: false,
              description: 'Discount code ID if applicable',
            },
            {
              name: 'notes',
              type: 'string',
              required: false,
              description: 'Order notes or special instructions',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "customerId": 1,
      "shippingAddressId": 1,
      "billingAddressId": 1,
      "status": "pending",
      "subtotal": "59.98",
      "discountAmount": "0.00",
      "tax": "5.40",
      "shippingCost": "5.99",
      "total": "71.37",
      "taxJurisdictionName": "California",
      "taxRate": "0.09",
      "shippingMethodName": "Standard Shipping",
      "shippingCarrier": "usps",
      "estimatedDeliveryDate": "2025-01-08T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "productVariantId": 1,
        "quantity": 2,
        "unitPrice": "29.99",
        "totalPrice": "59.98"
      }
    ]
  },
  "message": "Order created successfully"
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-order">Get Order Details</DocSubheading>
      <Endpoint
        method="GET"
        path="/orders/:id/details"
        description="Get order with full details including items, customer, and addresses"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "status": "delivered",
      "subtotal": "59.98",
      "tax": "5.40",
      "shippingCost": "5.99",
      "total": "71.37"
    },
    "items": [
      {
        "item": {
          "id": 1,
          "quantity": 2,
          "unitPrice": "29.99",
          "totalPrice": "59.98"
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
    ],
    "customer": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "shippingMethod": {
      "displayName": "Standard Shipping",
      "carrier": "usps"
    }
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-by-number">Get Order by Order Number</DocSubheading>
      <Endpoint
        method="GET"
        path="/orders/number/:orderNumber"
        description="Find order using the order number"
      >
        <DocParagraph>
          Useful for order lookup and tracking pages. Order numbers follow the format{' '}
          <DocCode>ORD-YYYYMMDD-####</DocCode>
        </DocParagraph>
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-20250101-0001",
    "status": "shipped",
    "total": "71.37",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="customer-orders">Get Customer Orders</DocSubheading>
      <Endpoint
        method="GET"
        path="/orders/customer/:customerId"
        description="Get all orders for a specific customer"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "status": "delivered",
      "total": "71.37",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "orderNumber": "ORD-20250115-0042",
      "status": "pending",
      "total": "125.50",
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="order-statuses">Order Status Flow</DocSubheading>
      <DocParagraph>Orders progress through the following statuses:</DocParagraph>
      <div className="bg-muted p-4 rounded-lg mb-4">
        <ol className="space-y-2 text-sm">
          <li>
            <DocCode>pending</DocCode> - Order placed, awaiting processing
          </li>
          <li>
            <DocCode>processing</DocCode> - Order is being prepared
          </li>
          <li>
            <DocCode>shipped</DocCode> - Order has been shipped
          </li>
          <li>
            <DocCode>delivered</DocCode> - Order delivered to customer
          </li>
          <li>
            <DocCode>cancelled</DocCode> - Order cancelled by customer or admin
          </li>
          <li>
            <DocCode>refunded</DocCode> - Order refunded
          </li>
        </ol>
      </div>

      <DocSubheading id="example-usage">Example: Complete Checkout Flow</DocSubheading>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`// 1. Get shipping methods
const shippingMethods = await fetch(
  'http://localhost:3000/orders/shipping-methods'
).then(res => res.json())

// 2. Calculate cart totals (preview before placing order)
const totals = await fetch('http://localhost:3000/cart/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: getSessionId(),
    shippingAddressId: 1,
    shippingMethodId: 1
  })
}).then(res => res.json())

// 3. Place the order
const order = await fetch('http://localhost:3000/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 1,
    shippingAddressId: 1,
    billingAddressId: 1,
    shippingMethodId: 1,
    items: [
      {
        productVariantId: 1,
        quantity: 2,
        unitPrice: '29.99'
      }
    ],
    sessionId: getSessionId(),
    notes: 'Please leave at front door'
  })
}).then(res => res.json())

// 4. Redirect to confirmation page
if (order.success) {
  window.location.href = \`/order-confirmation/\${order.data.order.orderNumber}\`
}`}</code>
      </pre>

      <DocSubheading id="typescript">TypeScript Types</DocSubheading>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`interface Order {
  id: number
  orderNumber: string
  customerId: number
  shippingAddressId: number
  billingAddressId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  taxJurisdictionName: string | null
  taxRate: string | null
  shippingMethodName: string | null
  shippingCarrier: string | null
  estimatedDeliveryDate: string | null
  campaignId: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: number
  orderId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  totalPrice: string
  createdAt: string
}`}</code>
      </pre>
    </DocsLayout>
  )
}
