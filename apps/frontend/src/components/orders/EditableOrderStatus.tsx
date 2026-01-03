"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateOrderStatus } from "~/utils/orders"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"

type EditableOrderStatusProps = {
  orderId: string
  currentStatus: OrderStatus
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  shipped: {
    label: "Shipped",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  },
  refunded: {
    label: "Refunded",
    className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  },
}

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
}

export function EditableOrderStatus({ orderId, currentStatus }: EditableOrderStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newStatus: OrderStatus) =>
      updateOrderStatus({ data: { orderId, status: newStatus } }),
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["orders"] })

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(["orders"])

      // Optimistically update to the new value
      queryClient.setQueryData(["orders"], (old: any) => {
        if (!old) return old
        return old.map((order: any) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      })

      return { previousOrders }
    },
    onError: (err, _newStatus, context) => {
      // Rollback on error
      queryClient.setQueryData(["orders"], context?.previousOrders)
      toast.error("Failed to update order status", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    },
    onSuccess: (_data, newStatus) => {
      toast.success("Order status updated", {
        description: `Status changed to ${statusConfig[newStatus].label}`,
      })
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    },
    onSettled: () => {
      setIsOpen(false)
    },
  })

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false)
      return
    }
    mutation.mutate(newStatus)
  }

  const availableStatuses = statusTransitions[currentStatus]
  const allStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${
            statusConfig[currentStatus].className
          } ${mutation.isPending ? 'cursor-wait' : 'cursor-pointer'}`}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {statusConfig[currentStatus].label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {allStatuses.map((status) => {
          const isAvailable = availableStatuses.includes(status) || status === currentStatus
          const isCurrent = status === currentStatus

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={!isAvailable || mutation.isPending}
              className={`flex items-center justify-between ${
                !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className={isCurrent ? 'font-medium' : ''}>
                {statusConfig[status].label}
              </span>
              {isCurrent && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
