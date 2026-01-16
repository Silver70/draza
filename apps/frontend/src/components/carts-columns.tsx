"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CartWithItems } from "@/types/cartTypes"
import { formatDistanceToNow } from "date-fns"

export const activeCartsColumns: ColumnDef<CartWithItems>[] = [
  {
    accessorKey: "sessionId",
    header: "Session ID",
    cell: ({ row }) => {
      const sessionId = row.getValue("sessionId") as string
      return (
        <div className="font-mono text-xs">
          {sessionId.substring(0, 8)}...
        </div>
      )
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const cart = row.original
      if (cart.customer) {
        return (
          <div>
            <div className="font-medium">
              {cart.customer.firstName} {cart.customer.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {cart.customer.email}
            </div>
          </div>
        )
      }
      return <Badge variant="outline">Guest</Badge>
    },
  },
  {
    accessorKey: "items",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Items
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const items = row.getValue("items") as any[]
      const itemCount = items.length
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
      return (
        <div>
          <div className="font-medium">{itemCount} {itemCount === 1 ? 'item' : 'items'}</div>
          <div className="text-xs text-muted-foreground">{totalQty} total units</div>
        </div>
      )
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cart Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") as string)
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(total)

      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "discountCode",
    header: "Discount",
    cell: ({ row }) => {
      const cart = row.original
      if (cart.discountCode && 'code' in cart.discountCode) {
        return (
          <Badge variant="secondary" className="font-mono">
            {cart.discountCode.code}
          </Badge>
        )
      }
      return <span className="text-xs text-muted-foreground">None</span>
    },
  },
  {
    accessorKey: "lastActivityAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Activity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastActivityAt") as string)
      return (
        <div className="text-sm">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="View details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        </div>
      )
    },
  },
]

export const abandonedCartsColumns: ColumnDef<CartWithItems>[] = [
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const cart = row.original
      if (cart.customer) {
        return (
          <div>
            <div className="font-medium">
              {cart.customer.firstName} {cart.customer.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {cart.customer.email}
            </div>
          </div>
        )
      }
      return (
        <div>
          <Badge variant="outline">Guest</Badge>
          <div className="text-xs text-muted-foreground mt-1">
            {row.original.sessionId.substring(0, 12)}...
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "items",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Items
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const items = row.getValue("items") as any[]
      return (
        <div>
          <div className="font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</div>
          <div className="text-xs text-muted-foreground">
            {items.slice(0, 2).map(item => item.productVariant.product.name).join(', ')}
            {items.length > 2 && `, +${items.length - 2} more`}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cart Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") as string)
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(total)

      return <div className="font-bold text-lg">{formatted}</div>
    },
    sortingFn: (rowA, rowB) => {
      const a = parseFloat(rowA.getValue("total") as string)
      const b = parseFloat(rowB.getValue("total") as string)
      return a - b
    },
  },
  {
    accessorKey: "lastActivityAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Abandoned
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastActivityAt") as string)
      return (
        <div>
          <div className="font-medium">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="View details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        </div>
      )
    },
  },
]
