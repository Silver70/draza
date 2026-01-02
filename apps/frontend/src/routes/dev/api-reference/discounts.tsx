import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocParagraph,
  Endpoint,
  ParamTable,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/discounts')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Discounts API</DocHeading>
      <DocParagraph>
        Validate and apply discount codes with support for percentage and fixed amount discounts.
      </DocParagraph>

      <Endpoint
        method="POST"
        path="/discounts/validate-code"
        description="Validate a discount code before applying"
      >
        <ParamTable
          params={[
            {
              name: 'code',
              type: 'string',
              required: true,
              description: 'Discount code to validate',
            },
            {
              name: 'cartTotal',
              type: 'string',
              required: true,
              description: 'Current cart total',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "isValid": true,
    "discount": {
      "id": 1,
      "name": "Summer Sale 20% Off",
      "discountType": "percentage",
      "value": "0.20",
      "scope": "store_wide"
    },
    "discountCode": {
      "id": 1,
      "code": "SUMMER20",
      "minimumOrderValue": "50.00"
    },
    "appliedAmount": "15.00"
  }
}`}</ResponseExample>
      </Endpoint>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Discount Types</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><strong>percentage:</strong> Percentage off (e.g., 20% = 0.20)</li>
          <li><strong>fixed_amount:</strong> Fixed dollar amount off</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Discount Scopes</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><strong>store_wide:</strong> Applies to entire cart</li>
          <li><strong>collection:</strong> Applies to specific collection</li>
          <li><strong>product:</strong> Applies to specific products</li>
          <li><strong>variant:</strong> Applies to specific variants</li>
          <li><strong>code:</strong> Requires code entry</li>
        </ul>
      </div>
    </DocsLayout>
  )
}
