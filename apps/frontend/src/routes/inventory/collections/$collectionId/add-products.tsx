import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { productsQueryOptions } from '@/utils/products'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/collections/$collectionId/add-products')({
  component: RouteComponent,

  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(productsQueryOptions())
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { collectionId } = Route.useParams()
  const { data: products } = useSuspenseQuery(productsQueryOptions())

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.slug.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    )
  })

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleAddProducts = async () => {
    // TODO: Implement API call to add products to collection
    console.log('Adding products to collection:', {
      collectionId,
      productIds: Array.from(selectedProducts),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/inventory/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Add Products to Collection</h1>
        <p className="text-muted-foreground">
          Select products to add to this collection
        </p>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Select Products</CardTitle>
          <CardDescription>
            Search and select products to add to this collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search products by name, slug, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {selectedProducts.size > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">{selectedProducts.size}</span> product{selectedProducts.size === 1 ? '' : 's'} selected
              </div>
              <Button onClick={handleAddProducts}>
                <Plus className="h-4 w-4 mr-2" />
                Add Selected Products
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-muted-foreground">
                {searchQuery ? 'No products found matching your search.' : 'No products available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleProduct(product.id)}
                >
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => handleToggleProduct(product.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      {product.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {product.slug}
                      </span>
                      {product.category && (
                        <span className="text-xs text-muted-foreground">
                          Category: {product.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom action bar for mobile */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
          <Button onClick={handleAddProducts} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedProducts.size} Product{selectedProducts.size === 1 ? '' : 's'}
          </Button>
        </div>
      )}
    </div>
  )
}
