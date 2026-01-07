import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Folder, Loader2, Package } from 'lucide-react'
import type { Collection } from '~/types/productTypes'
import { collectionWithProductsQueryOptions } from '~/utils/products'
import { Suspense } from 'react'

type CollectionDetailsSheetProps = {
  collection: Collection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CollectionDetailsContent({ collectionId }: { collectionId: string }) {
  const { data: collectionWithProducts } = useSuspenseQuery(
    collectionWithProductsQueryOptions(collectionId)
  )

  const products = collectionWithProducts.products || []

  return (
    <div className="space-y-6 p-6">
      {/* Collection Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              collectionWithProducts.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            {collectionWithProducts.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Slug:</span>
          <span className="text-sm font-mono text-muted-foreground">{collectionWithProducts.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Product Count:</span>
          <span className="text-sm font-medium">{collectionWithProducts.productCount}</span>
        </div>
      </div>

      {/* Description */}
      {collectionWithProducts.description && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Description</h3>
          <p className="text-sm text-muted-foreground">{collectionWithProducts.description}</p>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products in Collection</CardTitle>
          <CardDescription>All products included in this collection</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p>No products found in this collection</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {product.slug}
                    </TableCell>
                    <TableCell>
                      {product.category?.name || 'Uncategorized'}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </TableCell>
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

export function CollectionDetailsSheet({ collection, open, onOpenChange }: CollectionDetailsSheetProps) {
  if (!collection) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            {collection.name}
          </SheetTitle>
          <SheetDescription>
            Collection details and product listing
          </SheetDescription>
        </SheetHeader>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <CollectionDetailsContent collectionId={collection.id} />
        </Suspense>
      </SheetContent>
    </Sheet>
  )
}
