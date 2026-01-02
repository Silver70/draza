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

export const Route = createFileRoute('/dev/api-reference/customers')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Customers API</DocHeading>
      <DocParagraph>
        Manage customer accounts with support for both registered users and guest checkout.
      </DocParagraph>

      <DocSubheading id="create-customer">Create Customer Account</DocSubheading>
      <Endpoint
        method="POST"
        path="/customers"
        description="Create a new registered customer account"
      >
        <ParamTable
          params={[
            {
              name: 'firstName',
              type: 'string',
              required: true,
              description: 'Customer first name',
            },
            {
              name: 'lastName',
              type: 'string',
              required: true,
              description: 'Customer last name',
            },
            {
              name: 'email',
              type: 'string',
              required: true,
              description: 'Customer email address (must be unique)',
            },
            {
              name: 'phoneNumber',
              type: 'string',
              required: false,
              description: 'Customer phone number',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "userId": null,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "isGuest": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="create-guest">Create Guest Customer</DocSubheading>
      <Endpoint
        method="POST"
        path="/customers/guest"
        description="Create a guest customer for quick checkout"
      >
        <ParamTable
          params={[
            {
              name: 'email',
              type: 'string',
              required: true,
              description: 'Guest email address',
            },
            {
              name: 'firstName',
              type: 'string',
              required: false,
              description: 'Guest first name',
            },
            {
              name: 'lastName',
              type: 'string',
              required: false,
              description: 'Guest last name',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 2,
    "email": "guest@example.com",
    "firstName": "Guest",
    "lastName": "User",
    "isGuest": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-customer">Get Customer Details</DocSubheading>
      <Endpoint
        method="GET"
        path="/customers/:id"
        description="Retrieve customer information by ID"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "isGuest": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-by-email">Get Customer by Email</DocSubheading>
      <Endpoint
        method="GET"
        path="/customers/email/:email"
        description="Find customer by email address"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "isGuest": false
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-stats">Get Customer Statistics</DocSubheading>
      <Endpoint
        method="GET"
        path="/customers/:id/stats"
        description="Get customer's order history statistics"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "totalOrders": 12,
    "totalSpent": "1,248.76",
    "averageOrderValue": "104.06",
    "lastOrderDate": "2025-01-15T00:00:00.000Z"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="update-customer">Update Customer</DocSubheading>
      <Endpoint
        method="PUT"
        path="/customers/:id"
        description="Update customer information"
      >
        <ParamTable
          params={[
            {
              name: 'firstName',
              type: 'string',
              required: false,
              description: 'Updated first name',
            },
            {
              name: 'lastName',
              type: 'string',
              required: false,
              description: 'Updated last name',
            },
            {
              name: 'phoneNumber',
              type: 'string',
              required: false,
              description: 'Updated phone number',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.doe@example.com",
    "phoneNumber": "+1987654321"
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="example-usage">Example Usage</DocSubheading>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`// Create registered customer
const customer = await fetch('http://localhost:3000/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890'
  })
}).then(res => res.json())

// Create guest for quick checkout
const guest = await fetch('http://localhost:3000/customers/guest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'guest@example.com'
  })
}).then(res => res.json())

// Get customer stats
const stats = await fetch('http://localhost:3000/customers/1/stats')
  .then(res => res.json())
console.log(\`Total spent: $\${stats.data.totalSpent}\`)`}</code>
      </pre>
    </DocsLayout>
  )
}
