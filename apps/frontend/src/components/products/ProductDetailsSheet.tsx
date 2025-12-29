import { useSuspenseQuery } from '@tanstack/react-query'
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
import { Package, Loader2 } from 'lucide-react'
import type { Product } from '~/types/productTypes'
import { productWithVariantsQueryOptions } from '~/utils/products'
import { Suspense } from 'react'

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

type ProductDetailsSheetProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ProductDetailsContent({ productId }: { productId: string }) {
  const { data: productWithVariants } = useSuspenseQuery(
    productWithVariantsQueryOptions(productId)
  )

  const variants = productWithVariants.variants || []

  return (
    <div className="space-y-6 p-6">
      {/* Image Placeholder */}
      <div className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mt-2">Product Image</p>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              productWithVariants.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            {productWithVariants.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Category:</span>
          <span className="text-sm font-medium">
            {productWithVariants.category?.name || 'Uncategorized'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Slug:</span>
          <span className="text-sm font-mono text-muted-foreground">{productWithVariants.slug}</span>
        </div>
      </div>

      {/* Description */}
      {productWithVariants.description && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Description</h3>
          <p className="text-sm text-muted-foreground">{productWithVariants.description}</p>
        </div>
      )}

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Overview</CardTitle>
          <CardDescription>Monthly units sold (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-50 w-full">
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
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No variants found for this product
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                    <TableCell>${parseFloat(variant.price).toFixed(2)}</TableCell>
                    <TableCell>{variant.quantityInStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
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

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ProductDetailsContent productId={product.id} />
        </Suspense>
      </SheetContent>
    </Sheet>
  )
}
