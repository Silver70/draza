import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { X, Check, Package, Layers, Tag, ArrowLeft, Search, Boxes } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useNavigate } from '@tanstack/react-router'
import {
  discountWithDetailsQueryOptions,
  addProductsToDiscount,
  removeProductFromDiscount,
  addCollectionsToDiscount,
  removeCollectionFromDiscount,
  addVariantsToDiscount,
  removeVariantFromDiscount,
  formatDiscountValue,
  getDiscountStatusText,
} from '~/utils/discounts'
import { productsQueryOptions, collectionsQueryOptions, allProductsWithVariantsQueryOptions } from '~/utils/products'
import type { Discount } from '~/types/discountTypes'
import type { ProductWithVariants, ProductVariant } from '~/types/productTypes'

export const Route = createFileRoute('/discounts/$discountId/edit')({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    // Load discount details first to check scope
    const discountDetails = await queryClient.ensureQueryData(discountWithDetailsQueryOptions(params.discountId))

    // Load common data
    const promises = [
      queryClient.ensureQueryData(productsQueryOptions()),
      queryClient.ensureQueryData(collectionsQueryOptions()),
    ]

    // If variant scope, also load all products with variants
    if (discountDetails.scope === 'variant') {
      promises.push(queryClient.ensureQueryData(allProductsWithVariantsQueryOptions()))
    }

    await Promise.all(promises)
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { discountId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: discountDetails } = useSuspenseQuery(discountWithDetailsQueryOptions(discountId))
  const { data: allProducts } = useSuspenseQuery(productsQueryOptions())
  const { data: allCollections } = useSuspenseQuery(collectionsQueryOptions())

  // Only fetch products with variants for variant-scoped discounts
  const allProductsWithVariants = discountDetails.scope === 'variant'
    ? useSuspenseQuery(allProductsWithVariantsQueryOptions()).data
    : []

  // Track selected items for bulk add
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])

  // Search state
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('')
  const [variantSearchQuery, setVariantSearchQuery] = useState('')

  // Get already assigned product/collection/variant IDs
  const assignedProductIds = discountDetails.discountProducts?.map(dp => dp.productId) || []
  const assignedCollectionIds = discountDetails.discountCollections?.map(dc => dc.collectionId) || []
  const assignedVariantIds = discountDetails.discountVariants?.map(dv => dv.variantId) || []

  // Filter out already assigned items
  const availableProducts = useMemo(() => {
    return allProducts.filter(p => !assignedProductIds.includes(p.id))
  }, [allProducts, assignedProductIds])

  const availableCollections = useMemo(() => {
    return allCollections.filter(c => !assignedCollectionIds.includes(c.id))
  }, [allCollections, assignedCollectionIds])

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      return availableProducts.slice(0, 50) // Show only first 50 if no search
    }
    const query = productSearchQuery.toLowerCase()
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query)
    ).slice(0, 50) // Limit to 50 results
  }, [availableProducts, productSearchQuery])

  // Filtered collections based on search
  const filteredCollections = useMemo(() => {
    if (!collectionSearchQuery.trim()) {
      return availableCollections.slice(0, 50) // Show only first 50 if no search
    }
    const query = collectionSearchQuery.toLowerCase()
    return availableCollections.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query)
    ).slice(0, 50) // Limit to 50 results
  }, [availableCollections, collectionSearchQuery])

  // Add products mutation
  const addProductsMutation = useMutation({
    mutationFn: (productIds: string[]) =>
      addProductsToDiscount({
        data: {
          discountId,
          data: { productIds },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Products added', {
        description: 'Products have been added to this discount.',
      })
      setSelectedProducts([])
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add products',
      })
    },
  })

  // Remove product mutation
  const removeProductMutation = useMutation({
    mutationFn: (productId: string) =>
      removeProductFromDiscount({
        data: { discountId, productId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Product removed', {
        description: 'Product has been removed from this discount.',
      })
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to remove product',
      })
    },
  })

  // Add collections mutation
  const addCollectionsMutation = useMutation({
    mutationFn: (collectionIds: string[]) =>
      addCollectionsToDiscount({
        data: {
          discountId,
          data: { collectionIds },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Collections added', {
        description: 'Collections have been added to this discount.',
      })
      setSelectedCollections([])
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add collections',
      })
    },
  })

  // Remove collection mutation
  const removeCollectionMutation = useMutation({
    mutationFn: (collectionId: string) =>
      removeCollectionFromDiscount({
        data: { discountId, collectionId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Collection removed', {
        description: 'Collection has been removed from this discount.',
      })
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to remove collection',
      })
    },
  })

  // Add variants mutation
  const addVariantsMutation = useMutation({
    mutationFn: (variantIds: string[]) =>
      addVariantsToDiscount({
        data: {
          discountId,
          data: { variantIds },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Variants added', {
        description: 'Variants have been added to this discount.',
      })
      setSelectedVariants([])
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add variants',
      })
    },
  })

  // Remove variant mutation
  const removeVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      removeVariantFromDiscount({
        data: { discountId, variantId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount', discountId, 'details'] })
      toast.success('Variant removed', {
        description: 'Variant has been removed from this discount.',
      })
    },
    onError: (error) => {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to remove variant',
      })
    },
  })

  const handleAddProducts = () => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected', {
        description: 'Please select at least one product to add.',
      })
      return
    }
    addProductsMutation.mutate(selectedProducts)
  }

  const handleAddCollections = () => {
    if (selectedCollections.length === 0) {
      toast.error('No collections selected', {
        description: 'Please select at least one collection to add.',
      })
      return
    }
    addCollectionsMutation.mutate(selectedCollections)
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const handleAddVariants = () => {
    if (selectedVariants.length === 0) {
      toast.error('No variants selected', {
        description: 'Please select at least one variant to add.',
      })
      return
    }
    addVariantsMutation.mutate(selectedVariants)
  }

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants(prev =>
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    )
  }

  // Get all variants from all products with variants and filter out assigned ones
  const availableVariants = useMemo(() => {
    if (discountDetails.scope !== 'variant' || !allProductsWithVariants || allProductsWithVariants.length === 0) {
      return []
    }

    const allVariants: Array<{ variant: ProductVariant, product: ProductWithVariants }> = []
    allProductsWithVariants.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          if (!assignedVariantIds.includes(variant.id)) {
            allVariants.push({ variant, product })
          }
        })
      }
    })
    return allVariants
  }, [allProductsWithVariants, assignedVariantIds, discountDetails.scope])

  // Filtered variants based on search (search by SKU or product name)
  const filteredVariants = useMemo(() => {
    if (!variantSearchQuery.trim()) {
      return availableVariants.slice(0, 50) // Show only first 50 if no search
    }
    const query = variantSearchQuery.toLowerCase()
    return availableVariants.filter(({ variant, product }) =>
      variant.sku.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query)
    ).slice(0, 50) // Limit to 50 results
  }, [availableVariants, variantSearchQuery])

  // Get assigned variants with product details for display
  const assignedVariantsWithDetails = useMemo(() => {
    if (discountDetails.scope !== 'variant' || !allProductsWithVariants || allProductsWithVariants.length === 0) {
      return []
    }

    const assignedVariants: Array<{
      variantId: string
      variant: ProductVariant
      product: ProductWithVariants
    }> = []

    allProductsWithVariants.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          if (assignedVariantIds.includes(variant.id)) {
            assignedVariants.push({ variantId: variant.id, variant, product })
          }
        })
      }
    })

    return assignedVariants
  }, [allProductsWithVariants, assignedVariantIds, discountDetails.scope])

  const statusText = getDiscountStatusText(discountDetails as Discount)

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/discounts' })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discounts
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{discountDetails.name}</h1>
          <div className="flex items-center gap-3">
            <Badge variant={statusText === 'Active' ? 'default' : 'secondary'}>
              {statusText}
            </Badge>
            <span className="text-muted-foreground">
              {formatDiscountValue(discountDetails.discountType, discountDetails.value)} off
            </span>
          </div>
          {discountDetails.description && (
            <p className="text-muted-foreground">{discountDetails.description}</p>
          )}
        </div>
      </div>

      {/* Content based on scope */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product Scope */}
          {discountDetails.scope === 'product' && (
            <>
              {/* Assigned Products */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <CardTitle>Assigned Products</CardTitle>
                  </div>
                  <CardDescription>
                    Products that have this discount applied ({assignedProductIds.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignedProductIds.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/50">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No products assigned yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add products from the available list below
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {discountDetails.discountProducts.map((dp) => (
                        <div
                          key={dp.productId}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div>
                            <div className="font-medium">{dp.product.name}</div>
                            <div className="text-xs text-muted-foreground">/{dp.product.slug}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductMutation.mutate(dp.productId)}
                            disabled={removeProductMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Products</CardTitle>
                  <CardDescription>
                    Search and select products to add to this discount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      All products have been assigned to this discount
                    </div>
                  ) : (
                    <>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products by name or slug..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Results Info */}
                      <div className="text-xs text-muted-foreground">
                        Showing {filteredProducts.length} of {availableProducts.length} available products
                        {!productSearchQuery.trim() && availableProducts.length > 50 && (
                          <span className="ml-1">(use search to find more)</span>
                        )}
                      </div>

                      {/* Product List */}
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No products match your search
                        </div>
                      ) : (
                        <>
                          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                            {filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                                onClick={() => toggleProductSelection(product.id)}
                              >
                                <Checkbox
                                  checked={selectedProducts.includes(product.id)}
                                  onCheckedChange={() => toggleProductSelection(product.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">/{product.slug}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            onClick={handleAddProducts}
                            disabled={selectedProducts.length === 0 || addProductsMutation.isPending}
                            className="w-full"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Add {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''} Products
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Collection Scope */}
          {discountDetails.scope === 'collection' && (
            <>
              {/* Assigned Collections */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    <CardTitle>Assigned Collections</CardTitle>
                  </div>
                  <CardDescription>
                    Collections that have this discount applied ({assignedCollectionIds.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignedCollectionIds.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/50">
                      <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No collections assigned yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add collections from the available list below
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {discountDetails.discountCollections.map((dc) => (
                        <div
                          key={dc.collectionId}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div>
                            <div className="font-medium">{dc.collection.name}</div>
                            <div className="text-xs text-muted-foreground">/{dc.collection.slug}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCollectionMutation.mutate(dc.collectionId)}
                            disabled={removeCollectionMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Collections */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Collections</CardTitle>
                  <CardDescription>
                    Search and select collections to add to this discount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableCollections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      All collections have been assigned to this discount
                    </div>
                  ) : (
                    <>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search collections by name or slug..."
                          value={collectionSearchQuery}
                          onChange={(e) => setCollectionSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Results Info */}
                      <div className="text-xs text-muted-foreground">
                        Showing {filteredCollections.length} of {availableCollections.length} available collections
                        {!collectionSearchQuery.trim() && availableCollections.length > 50 && (
                          <span className="ml-1">(use search to find more)</span>
                        )}
                      </div>

                      {/* Collection List */}
                      {filteredCollections.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No collections match your search
                        </div>
                      ) : (
                        <>
                          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                            {filteredCollections.map((collection) => (
                              <div
                                key={collection.id}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                                onClick={() => toggleCollectionSelection(collection.id)}
                              >
                                <Checkbox
                                  checked={selectedCollections.includes(collection.id)}
                                  onCheckedChange={() => toggleCollectionSelection(collection.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{collection.name}</div>
                                  <div className="text-xs text-muted-foreground">/{collection.slug}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            onClick={handleAddCollections}
                            disabled={selectedCollections.length === 0 || addCollectionsMutation.isPending}
                            className="w-full"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Add {selectedCollections.length > 0 ? `(${selectedCollections.length})` : ''} Collections
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Code Scope */}
          {discountDetails.scope === 'code' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  <CardTitle>Discount Codes</CardTitle>
                </div>
                <CardDescription>
                  Manage codes that customers can use to redeem this discount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate({ to: `/discounts/${discountId}/codes` })}
                  className="w-full"
                >
                  Manage Discount Codes
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Create and manage redeemable codes for this discount
                </p>
              </CardContent>
            </Card>
          )}

          {/* Variant Scope */}
          {discountDetails.scope === 'variant' && (
            <>
              {/* Assigned Variants */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-teal-600" />
                    <CardTitle>Assigned Variants</CardTitle>
                  </div>
                  <CardDescription>
                    Product variants that have this discount applied ({assignedVariantIds.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignedVariantIds.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/50">
                      <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No variants assigned yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add variants from the available list below
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignedVariantsWithDetails.map(({ variantId, variant, product }) => (
                        <div
                          key={variantId}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span className="font-mono">{variant.sku}</span>
                              <span>•</span>
                              <span>${variant.price}</span>
                              <span>•</span>
                              <span>{variant.quantityInStock} in stock</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariantMutation.mutate(variantId)}
                            disabled={removeVariantMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Variants */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Variants</CardTitle>
                  <CardDescription>
                    Search and select product variants to add to this discount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableVariants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      All available variants have been assigned to this discount
                    </div>
                  ) : (
                    <>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search variants by SKU or product name..."
                          value={variantSearchQuery}
                          onChange={(e) => setVariantSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Results Info */}
                      <div className="text-xs text-muted-foreground">
                        Showing {filteredVariants.length} of {availableVariants.length} available variants
                        {!variantSearchQuery.trim() && availableVariants.length > 50 && (
                          <span className="ml-1">(use search to find more)</span>
                        )}
                      </div>

                      {/* Variant List */}
                      {filteredVariants.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No variants match your search
                        </div>
                      ) : (
                        <>
                          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                            {filteredVariants.map(({ variant, product }) => (
                              <div
                                key={variant.id}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                                onClick={() => toggleVariantSelection(variant.id)}
                              >
                                <Checkbox
                                  checked={selectedVariants.includes(variant.id)}
                                  onCheckedChange={() => toggleVariantSelection(variant.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="font-mono">{variant.sku}</span>
                                    <span>•</span>
                                    <span>${variant.price}</span>
                                    <span>•</span>
                                    <span>{variant.quantityInStock} in stock</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            onClick={handleAddVariants}
                            disabled={selectedVariants.length === 0 || addVariantsMutation.isPending}
                            className="w-full"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Add {selectedVariants.length > 0 ? `(${selectedVariants.length})` : ''} Variants
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Store-wide Scope */}
          {discountDetails.scope === 'store_wide' && (
            <Card>
              <CardHeader>
                <CardTitle>Store-wide Discount</CardTitle>
                <CardDescription>
                  This discount applies to all products in your store automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 border rounded-lg bg-muted/50">
                  <div className="text-muted-foreground">
                    No additional configuration needed
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This discount is automatically applied to all products
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar - Discount Info */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Discount Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">
                  {discountDetails.discountType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-medium">
                  {formatDiscountValue(discountDetails.discountType, discountDetails.value)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scope:</span>
                <span className="font-medium capitalize">
                  {discountDetails.scope.replace('_', '-')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Priority:</span>
                <span className="font-medium">{discountDetails.priority}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Starts:</span>
                <span className="font-medium">
                  {new Date(discountDetails.startsAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ends:</span>
                <span className="font-medium">
                  {discountDetails.endsAt
                    ? new Date(discountDetails.endsAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
