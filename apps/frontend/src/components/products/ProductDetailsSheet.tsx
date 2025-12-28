import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Package } from 'lucide-react'
import type { Product } from '~/types/productTypes'

// Dummy sales data - TODO: Replace with real API data
const salesData = [
  { month: 'Jan', sales: 45 },
  { month: 'Feb', sales: 52 },
  { month: 'Mar', sales: 61 },
  { month: 'Apr', sales: 58 },
  { month: 'May', sales: 73 },
  { month: 'Jun', sales: 89 },
]

const chartConfig = {
  sales: {
    label: 'Units Sold',
    color: 'oklch(var(--primary))',
  },
} satisfies ChartConfig

// Dummy variant data - TODO: Replace with real API data
const dummyVariants = [
  { id: '1', sku: 'PROD-001-S', price: 29.99, quantityInStock: 150, isActive: true },
  { id: '2', sku: 'PROD-001-M', price: 29.99, quantityInStock: 200, isActive: true },
  { id: '3', sku: 'PROD-001-L', price: 29.99, quantityInStock: 180, isActive: true },
  { id: '4', sku: 'PROD-001-XL', price: 34.99, quantityInStock: 120, isActive: true },
]

type ProductDetailsSheetProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsSheet({ product, open, onOpenChange }: ProductDetailsSheetProps) {
  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {product.name}
          </SheetTitle>
          <SheetDescription>
            Product details and analytics
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {product.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <span className="text-sm font-medium">
                {product.category?.name || 'Uncategorized'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Slug</span>
              <span className="text-sm font-mono text-muted-foreground">{product.slug}</span>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">Product Image</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Overview</CardTitle>
              <CardDescription>Monthly units sold (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium">Units Sold:</span>
                            <span className="font-bold">{value}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary)', r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Variants Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Variants</CardTitle>
              <CardDescription>Available SKUs and inventory levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                      <TableCell>${variant.price.toFixed(2)}</TableCell>
                      <TableCell>{variant.quantityInStock}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            variant.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {variant.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
