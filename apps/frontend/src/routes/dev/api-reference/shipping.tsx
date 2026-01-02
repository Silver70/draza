import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocParagraph,
  Endpoint,
  ParamTable,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/shipping')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Shipping API</DocHeading>
      <DocParagraph>
        Get available shipping methods and calculate shipping costs based on cart total.
      </DocParagraph>

      <Endpoint
        method="GET"
        path="/orders/shipping-methods"
        description="Get all active shipping methods"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "standard_shipping",
      "displayName": "Standard Shipping",
      "description": "5-7 business days",
      "carrier": "usps",
      "calculationType": "flat_rate",
      "baseRate": "5.99",
      "freeShippingThreshold": "50.00",
      "estimatedDaysMin": 5,
      "estimatedDaysMax": 7,
      "isActive": true
    },
    {
      "id": 2,
      "name": "express_shipping",
      "displayName": "Express Shipping",
      "description": "2-3 business days",
      "carrier": "fedex",
      "baseRate": "15.99",
      "estimatedDaysMin": 2,
      "estimatedDaysMax": 3,
      "isActive": true
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/orders/shipping-options"
        description="Get shipping options for a specific cart"
      >
        <ParamTable
          params={[
            {
              name: 'cartTotal',
              type: 'string',
              required: true,
              description: 'Current cart total',
            },
            {
              name: 'shippingAddressId',
              type: 'number',
              required: true,
              description: 'Shipping address ID',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "method": {
        "id": 1,
        "name": "standard_shipping",
        "displayName": "Standard Shipping",
        "estimatedDaysMin": 5,
        "estimatedDaysMax": 7
      },
      "cost": "0.00",
      "isFree": true
    },
    {
      "method": {
        "id": 2,
        "name": "express_shipping",
        "displayName": "Express Shipping",
        "estimatedDaysMin": 2,
        "estimatedDaysMax": 3
      },
      "cost": "15.99",
      "isFree": false
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Shipping Carriers</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><strong>usps:</strong> United States Postal Service</li>
          <li><strong>fedex:</strong> FedEx</li>
          <li><strong>ups:</strong> UPS</li>
          <li><strong>dhl:</strong> DHL</li>
          <li><strong>other:</strong> Custom carrier</li>
        </ul>
      </div>
    </DocsLayout>
  )
}
