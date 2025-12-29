"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Percent, DollarSign, Tag, Store, Package, Layers } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import type { Discount } from "@/types/discountTypes"
import { formatDiscountValue, getDiscountStatusText } from "@/utils/discounts"
import { Link } from "@tanstack/react-router"

type ColumnActions = {
  onEdit?: (discount: Discount) => void
  onToggleActive?: (discount: Discount) => void
  onDelete?: (discount: Discount) => void
  onDuplicate?: (discount: Discount) => void
}

// Scope icon mapping
const scopeIcons = {
  store_wide: Store,
  collection: Layers,
  product: Package,
  code: Tag,
}

// Scope badge colors
const scopeColors = {
  store_wide: "bg-blue-100 text-blue-800",
  collection: "bg-purple-100 text-purple-800",
  product: "bg-green-100 text-green-800",
  code: "bg-orange-100 text-orange-800",
}

// Status badge styling
const statusStyles = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Scheduled: "bg-yellow-100 text-yellow-800",
  Expired: "bg-red-100 text-red-800",
}

export const createColumns = (actions: ColumnActions): ColumnDef<Discount>[] => [
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
          Discount Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const discount = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{row.getValue("name")}</div>
          {discount.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {discount.description}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "discountType",
    header: "Type & Value",
    cell: ({ row }) => {
      const type = row.getValue("discountType") as "percentage" | "fixed_amount"
      const value = row.original.value
      const Icon = type === "percentage" ? Percent : DollarSign

      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-medium">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDiscountValue(type, value)}
          </div>
          <span className="text-xs text-muted-foreground">
            {type === "percentage" ? "off" : "off"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ row }) => {
      const scope = row.getValue("scope") as keyof typeof scopeIcons
      const Icon = scopeIcons[scope]
      const scopeLabels = {
        store_wide: "Store-wide",
        collection: "Collection",
        product: "Product",
        code: "Code",
      }

      return (
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${scopeColors[scope]}`}>
            <Icon className="h-3 w-3" />
            {scopeLabels[scope]}
          </div>
        </div>
      )
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const discount = row.original
      const statusText = getDiscountStatusText(discount)

      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[statusText as keyof typeof statusStyles]}`}>
          {statusText}
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const priority = row.getValue("priority") as number
      return (
        <div className="text-center">
          <Badge variant="outline" className="font-mono">
            {priority}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Starts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("startsAt"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    accessorKey: "endsAt",
    header: "Ends",
    cell: ({ row }) => {
      const endsAt = row.getValue("endsAt") as string | null
      if (!endsAt) {
        return <div className="text-sm text-muted-foreground">Never</div>
      }
      const date = new Date(endsAt)
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
    cell: ({ row }) => {
      const discount = row.original

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(discount.id)}
            >
              Copy discount ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/discounts/${discount.id}/edit`}>
                Edit discount
              </Link>
            </DropdownMenuItem>
            {discount.scope === "code" && (
              <DropdownMenuItem asChild>
                <Link to={`/discounts/${discount.id}/codes`}>
                  Manage codes
                </Link>
              </DropdownMenuItem>
            )}
            {actions.onDuplicate && (
              <DropdownMenuItem onClick={() => actions.onDuplicate!(discount)}>
                Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {actions.onToggleActive && (
              <DropdownMenuItem onClick={() => actions.onToggleActive!(discount)}>
                {discount.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}
            {actions.onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => actions.onDelete!(discount)}
                >
                  Delete discount
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
