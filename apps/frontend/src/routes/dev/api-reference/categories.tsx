import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocParagraph,
  Endpoint,
  ResponseExample,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/api-reference/categories')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Categories API</DocHeading>
      <DocParagraph>
        Navigate product categories with hierarchical tree structure and breadcrumb support.
      </DocParagraph>

      <Endpoint
        method="GET"
        path="/products/categories/tree"
        description="Get entire category hierarchy as a tree structure"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Clothing",
      "slug": "clothing",
      "parentId": null,
      "children": [
        {
          "id": 5,
          "name": "T-Shirts",
          "slug": "t-shirts",
          "parentId": 1
        },
        {
          "id": 6,
          "name": "Jeans",
          "slug": "jeans",
          "parentId": 1
        }
      ]
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/products/categories/slug/:slug"
        description="Get category by slug"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "id": 5,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "parentId": 1
  }
}`}</ResponseExample>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/products/categories/:id/breadcrumb"
        description="Get breadcrumb path from root to category"
      >
        <ResponseExample>{`{
  "success": true,
  "data": [
    { "id": 1, "name": "Clothing", "slug": "clothing" },
    { "id": 5, "name": "T-Shirts", "slug": "t-shirts" }
  ]
}`}</ResponseExample>
      </Endpoint>
    </DocsLayout>
  )
}
