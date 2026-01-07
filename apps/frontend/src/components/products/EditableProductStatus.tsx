"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { activateProduct, deactivateProduct } from "~/utils/products"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

type ProductStatusProps = {
  productId: string
  isActive: boolean
}

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  },
}

export function EditableProductStatus({ productId, isActive }: ProductStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (shouldActivate: boolean) =>
      shouldActivate
        ? activateProduct({ data: productId })
        : deactivateProduct({ data: productId }),
    onMutate: async (shouldActivate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] })

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"])

      // Optimistically update to the new value
      queryClient.setQueryData(["products"], (old: any) => {
        if (!old) return old
        return old.map((product: any) =>
          product.id === productId ? { ...product, isActive: shouldActivate } : product
        )
      })

      return { previousProducts }
    },
    onError: (err, _newStatus, context) => {
      // Rollback on error
      queryClient.setQueryData(["products"], context?.previousProducts)
      toast.error("Failed to update product status", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    },
    onSuccess: (_data, shouldActivate) => {
      toast.success("Product status updated", {
        description: `Product is now ${shouldActivate ? 'active' : 'inactive'}`,
      })
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
    },
    onSettled: () => {
      setIsOpen(false)
    },
  })

  const handleStatusChange = (shouldActivate: boolean) => {
    if (shouldActivate === isActive) {
      setIsOpen(false)
      return
    }
    mutation.mutate(shouldActivate)
  }

  const currentStatusKey = isActive ? "active" : "inactive"
  const currentConfig = statusConfig[currentStatusKey]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${
            currentConfig.className
          } ${mutation.isPending ? 'cursor-wait' : 'cursor-pointer'}`}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {currentConfig.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem
          onClick={() => handleStatusChange(true)}
          disabled={mutation.isPending}
          className="flex items-center justify-between"
        >
          <span className={isActive ? 'font-medium' : ''}>
            {statusConfig.active.label}
          </span>
          {isActive && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange(false)}
          disabled={mutation.isPending}
          className="flex items-center justify-between"
        >
          <span className={!isActive ? 'font-medium' : ''}>
            {statusConfig.inactive.label}
          </span>
          {!isActive && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
