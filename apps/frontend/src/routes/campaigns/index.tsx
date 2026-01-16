import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table'
import { columns } from '@/components/campaigns-columns'
import { useNavigate } from '@tanstack/react-router'
import { campaignsQueryOptions } from '@/utils/analytics'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/')({
  component: RouteComponent,

  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(campaignsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { data: campaigns } = useSuspenseQuery(campaignsQueryOptions())
  const navigate = useNavigate()

  const handleCreateCampaign = () => {
    navigate({ to: '/campaigns/create' })
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Track and manage your marketing campaigns across social media platforms
        </p>
      </div>
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No campaigns found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first marketing campaign to track visits and conversions.
            </p>
            <Link
              to="/campaigns/create"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={campaigns}
          searchKey="name"
          searchPlaceholder="Search campaigns..."
          onAddNew={handleCreateCampaign}
          addNewLabel="Create Campaign"
        />
      )}
    </>
  )
}
