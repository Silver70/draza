import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { createColumns } from '@/components/customers-columns'
import { useNavigate } from '@tanstack/react-router'
import { customersQueryOptions } from '@/utils/customers'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Link } from '@tanstack/react-router'
import { CustomerDetailsSheet } from '~/components/customers/CustomerDetailsSheet'
import type { Customer } from '@/types/customerTypes'

export const Route = createFileRoute('/customers/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(customersQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { data: customers } = useSuspenseQuery(customersQueryOptions())
  const navigate = useNavigate()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleAddCustomer = () => {
    navigate({ to: '/customers/create' })
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSheetOpen(true)
  }

  const columns = createColumns({
    onViewDetails: handleViewDetails,
  })

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage your customer database
        </p>
      </div>

      <CustomerDetailsSheet
        customer={selectedCustomer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No customers found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first customer.
            </p>
            <Link
              to="/customers/create"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Add Customer
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          searchKey="first_name"
          searchPlaceholder="Search customers..."
          onAddNew={handleAddCustomer}
          addNewLabel="Add Customer"
        />
      )}
    </>
  )
}
