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

export const Route = createFileRoute('/dev/api-reference/products')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Products API</DocHeading>
      <DocParagraph>
        Browse and manage product catalog with support for variants, attributes, and inventory
        tracking.
      </DocParagraph>

      <DocSubheading id="list-products">List Active Products</DocSubheading>
      <Endpoint
        method="GET"
        path="/products/active"
        description="Get all active products with optional filtering"
      >
        <ParamTable
          params={[
            {
              name: 'categoryId',
              type: 'number',
              required: false,
              description: 'Filter products by category ID',
            },
            {
              name: 'search',
              type: 'string',
              required: false,
              description: 'Search products by name or description',
            },
          ]}
        />
        <ResponseExample>{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "description": "Comfortable everyday tee",
      "categoryId": 5,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-product-slug">Get Product by Slug</DocSubheading>
      <Endpoint
        method="GET"
        path="/products/slug/:slug"
        description="Retrieve product details including category and images"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "description": "Comfortable everyday tee",
      "categoryId": 5,
      "isActive": true
    },
    "category": {
      "id": 5,
      "name": "T-Shirts",
      "slug": "t-shirts"
    },
    "images": [
      {
        "id": 1,
        "url": "https://storage.example.com/products/1/image.jpg",
        "altText": "Classic Cotton T-Shirt",
        "type": "thumbnail",
        "position": 0
      }
    ]
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="get-product-variants">Get Product with Variants</DocSubheading>
      <Endpoint
        method="GET"
        path="/products/slug/:slug/variants"
        description="Get product with all variants, attributes, and variant images"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt"
    },
    "category": {
      "id": 5,
      "name": "T-Shirts"
    },
    "variants": [
      {
        "variant": {
          "id": 1,
          "productId": 1,
          "sku": "SHIRT-BLK-SM",
          "price": "29.99",
          "quantityInStock": 50
        },
        "attributes": [
          {
            "attribute": { "id": 1, "name": "Color" },
            "value": { "id": 1, "value": "Black" }
          },
          {
            "attribute": { "id": 2, "name": "Size" },
            "value": { "id": 5, "value": "Small" }
          }
        ],
        "images": [
          {
            "id": 1,
            "url": "https://storage.example.com/variants/1/black.jpg",
            "type": "thumbnail"
          }
        ]
      }
    ],
    "images": [
      {
        "id": 1,
        "url": "https://storage.example.com/products/1/main.jpg"
      }
    ]
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="check-availability">Check Product Availability</DocSubheading>
      <Endpoint
        method="GET"
        path="/products/:id/availability"
        description="Check stock availability for product and all its variants"
      >
        <ResponseExample>{`{
  "success": true,
  "data": {
    "isAvailable": true,
    "totalStock": 150,
    "variants": [
      {
        "id": 1,
        "sku": "SHIRT-BLK-SM",
        "quantityInStock": 50,
        "isAvailable": true
      },
      {
        "id": 2,
        "sku": "SHIRT-BLK-MD",
        "quantityInStock": 100,
        "isAvailable": true
      }
    ]
  }
}`}</ResponseExample>
      </Endpoint>

      <DocSubheading id="typescript">TypeScript Types</DocSubheading>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mb-4">
        <code>{`interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  categoryId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProductVariant {
  id: number
  productId: number
  sku: string
  price: string
  quantityInStock: number
  createdAt: string
  updatedAt: string
}

interface Attribute {
  id: number
  name: string
}

interface AttributeValue {
  id: number
  attributeId: number
  value: string
}

interface ProductImage {
  id: number
  productId: number
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
}`}</code>
      </pre>

      <DocSubheading id="example-usage">Example Usage</DocSubheading>
      <DocParagraph>
        Here's how to build a product page with variants:
      </DocParagraph>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`import { useEffect, useState } from 'react'

function ProductPage({ slug }) {
  const [productData, setProductData] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)

  useEffect(() => {
    fetch(\`http://localhost:3000/products/slug/\${slug}/variants\`)
      .then(res => res.json())
      .then(data => {
        setProductData(data.data)
        if (data.data.variants.length > 0) {
          setSelectedVariant(data.data.variants[0])
        }
      })
  }, [slug])

  if (!productData) return <div>Loading...</div>

  return (
    <div>
      <h1>{productData.product.name}</h1>
      <p>{productData.product.description}</p>

      {/* Product Images */}
      {productData.images.map(img => (
        <img key={img.id} src={img.url} alt={img.altText} />
      ))}

      {/* Variant Selection */}
      <div>
        {productData.variants.map(variant => (
          <button
            key={variant.variant.id}
            onClick={() => setSelectedVariant(variant)}
          >
            {variant.attributes.map(a => a.value.value).join(' / ')}
            - \${variant.variant.price}
          </button>
        ))}
      </div>

      {/* Selected Variant */}
      {selectedVariant && (
        <div>
          <p>Price: \${selectedVariant.variant.price}</p>
          <p>Stock: {selectedVariant.variant.quantityInStock}</p>
          <button>Add to Cart</button>
        </div>
      )}
    </div>
  )
}`}</code>
      </pre>
    </DocsLayout>
  )
}
