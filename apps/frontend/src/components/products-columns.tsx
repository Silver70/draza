"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Pencil, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "../types/productTypes"
import { EditableProductStatus } from "~/components/products/EditableProductStatus"

type ColumnActions = {
  onViewDetails: (product: Product) => void
}

export const createColumns = (actions: ColumnActions): ColumnDef<Product>[] => [
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
    id: "image",
    header: "Image",
    cell: ({ row }) => {
      const product = row.original
      const thumbnailImage = product.images?.find(img => img.type === 'thumbnail' || img.type === 'hero')
      const fallbackImage = product.images?.[0]
      const imageUrl = thumbnailImage?.url || fallbackImage?.url

      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={thumbnailImage?.altText || fallbackImage?.altText || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as { id: string; name: string; slug: string } | null | undefined
      return (
        <div className="text-sm">
          {category?.name || <span className="text-muted-foreground">Uncategorized</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <div className="text-muted-foreground font-mono text-sm">
        {row.getValue("slug")}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const product = row.original
      return (
        <EditableProductStatus
          productId={product.id}
          isActive={product.isActive}
        />
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
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => actions.onViewDetails(product)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Edit product"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit product</span>
          </Button>
        </div>
      )
    },
  },
]
