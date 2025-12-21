export function ErrorComponent({ error }: { error: Error }) {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-destructive/10 border-destructive/20">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Error loading products</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Failed to fetch products. Please try again later.'}
          </p>
        </div>
      </div>
    </>
  )
}