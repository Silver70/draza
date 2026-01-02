import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocParagraph,
  Endpoint,
  ParamTable,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/addresses')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Addresses API</DocHeading>
      <DocParagraph>
        Manage customer shipping and billing addresses with support for default address selection.
      </DocParagraph>

      <Endpoint
        method="GET"
        path="/customers/:customerId/addresses/all"
        description="Get all addresses for a customer"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US",
      "isDefault": true
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/customers/:customerId/addresses"
        description="Create a new address"
      >
        <ParamTable
          params={[
            { name: 'firstName', type: 'string', required: true, description: 'First name' },
            { name: 'lastName', type: 'string', required: true, description: 'Last name' },
            { name: 'street', type: 'string', required: true, description: 'Street address' },
            { name: 'city', type: 'string', required: true, description: 'City' },
            { name: 'state', type: 'string', required: true, description: 'State/Province' },
            { name: 'postalCode', type: 'string', required: true, description: 'Postal code' },
            { name: 'country', type: 'string', required: true, description: 'Country code (US, CA, etc)' },
            { name: 'isDefault', type: 'boolean', required: false, description: 'Set as default address' },
          ]}
        />
      </Endpoint>

      <Endpoint
        method="PUT"
        path="/customers/:customerId/addresses/:addressId/set-default"
        description="Set an address as the default"
      />

      <Endpoint
        method="PUT"
        path="/customers/addresses/:addressId"
        description="Update an existing address"
      />

      <Endpoint
        method="DELETE"
        path="/customers/addresses/:addressId"
        description="Delete an address"
      />
    </DocsLayout>
  )
}
