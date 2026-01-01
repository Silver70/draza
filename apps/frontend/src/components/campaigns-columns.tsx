"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, ExternalLink, Pencil, Trash, TrendingUp } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Campaign } from "@/types/analyticsTypes"
import {
  getPlatformDisplayName,
  formatCurrency,
  getCampaignStatus,
  getCampaignStatusColor,
  getPlatformColor,
} from "@/utils/campaigns"

function CampaignActionsCell({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate()

  const handleCopyTrackingCode = async () => {
    await navigator.clipboard.writeText(campaign.trackingCode)
  }

  const handleCopyTrackingURL = async () => {
    const baseURL = window.location.origin
    const trackingURL = `${baseURL}?utm_campaign=${campaign.trackingCode}`
    await navigator.clipboard.writeText(trackingURL)
  }

  const handleViewAnalytics = () => {
    navigate({ to: '/campaigns/$campaignId', params: { campaignId: campaign.id } })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCopyTrackingCode}>
          <Copy className="mr-2 h-4 w-4" />
          Copy tracking code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyTrackingURL}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Copy tracking URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewAnalytics}>
          <TrendingUp className="mr-2 h-4 w-4" />
          View analytics
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Pencil className="mr-2 h-4 w-4" />
          Edit campaign
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" disabled>
          <Trash className="mr-2 h-4 w-4" />
          Delete campaign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<Campaign>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Campaign Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const campaign = row.original
      return (
        <div className="flex flex-col">
          <div className="font-medium">{campaign.name}</div>
          {campaign.parentCampaignId && (
            <div className="text-xs text-muted-foreground">
              Sub-campaign
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => {
      const platform = row.getValue("platform") as Campaign['platform']
      const platformColor = getPlatformColor(platform)
      const platformName = getPlatformDisplayName(platform)

      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${platformColor}`}>
          {platformName}
        </div>
      )
    },
  },
  {
    accessorKey: "trackingCode",
    header: "Tracking Code",
    cell: ({ row }) => {
      const trackingCode = row.getValue("trackingCode") as string

      const handleCopy = async () => {
        await navigator.clipboard.writeText(trackingCode)
      }

      return (
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs">{trackingCode.substring(0, 20)}...</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: "cost",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cost = row.getValue("cost") as string
      return <div className="text-sm">{formatCurrency(cost)}</div>
    },
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => {
      const budget = row.getValue("budget") as string
      return <div className="text-sm text-muted-foreground">{formatCurrency(budget)}</div>
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const campaign = row.original
      const status = getCampaignStatus(campaign.isActive, campaign.startsAt, campaign.endsAt)
      const statusColor = getCampaignStatusColor(status)

      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <CampaignActionsCell campaign={row.original} />,
  },
]
