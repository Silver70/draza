import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocParagraph,
  Endpoint,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/collections')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Collections API</DocHeading>
      <DocParagraph>
        Curated product collections for seasonal sales, featured items, and marketing campaigns.
      </DocParagraph>

      <Endpoint
        method="GET"
        path="/products/collections/active"
        description="Get all active collections"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Summer Sale",
      "slug": "summer-sale",
      "description": "Hot deals for summer",
      "isActive": true,
      "displayOrder": 1
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/products/collections/slug/:slug"
        description="Get collection with all products"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "collection": {
      "id": 1,
      "name": "Summer Sale",
      "slug": "summer-sale",
      "description": "Hot deals for summer"
    },
    "products": [
      {
        "product": {
          "id": 1,
          "name": "Classic Cotton T-Shirt",
          "slug": "classic-cotton-t-shirt",
          "isActive": true
        },
        "position": 1,
        "category": {
          "id": 5,
          "name": "T-Shirts"
        }
      }
    ]
  }
}`}</ResponseExample>
      </Endpoint>
    </DocsLayout>
  )
}
