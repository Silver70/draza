import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from '@/components/data-table'
import { columns, type Product } from '@/components/products-columns'

export const Route = createFileRoute('/inventory/products/')({
  component: RouteComponent,
})

const fakeProducts: Product[] = [
  {
    id: "PROD001",
    name: "Wireless Mouse",
    category: "electronics",
    price: 29.99,
    stock: 150,
    status: "in_stock",
  },
  {
    id: "PROD002",
    name: "USB-C Cable",
    category: "accessories",
    price: 12.99,
    stock: 8,
    status: "low_stock",
  },
  {
    id: "PROD003",
    name: "Mechanical Keyboard",
    category: "electronics",
    price: 89.99,
    stock: 0,
    status: "out_of_stock",
  },
  {
    id: "PROD004",
    name: "Laptop Stand",
    category: "accessories",
    price: 45.00,
    stock: 75,
    status: "in_stock",
  },
  {
    id: "PROD005",
    name: "Webcam HD",
    category: "electronics",
    price: 59.99,
    stock: 25,
    status: "in_stock",
  },
  {
    id: "PROD006",
    name: "Monitor 27 inch",
    category: "electronics",
    price: 299.99,
    stock: 5,
    status: "low_stock",
  },
  {
    id: "PROD007",
    name: "Desk Mat",
    category: "accessories",
    price: 24.99,
    stock: 200,
    status: "in_stock",
  },
  {
    id: "PROD008",
    name: "Headphones",
    category: "electronics",
    price: 79.99,
    stock: 0,
    status: "out_of_stock",
  },
  {
    id: "PROD009",
    name: "Phone Charger",
    category: "accessories",
    price: 19.99,
    stock: 120,
    status: "in_stock",
  },
  {
    id: "PROD010",
    name: "External SSD 1TB",
    category: "storage",
    price: 129.99,
    stock: 45,
    status: "in_stock",
  },
]

function RouteComponent() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>
      <DataTable
        columns={columns}
        data={fakeProducts}
        searchKey="name"
        searchPlaceholder="Search products..."
      />
    </>
  )
}
