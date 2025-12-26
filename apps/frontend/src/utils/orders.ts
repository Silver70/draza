import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderResponse,
  OrdersResponse,
  OrderWithItemsResponse,
  OrderWithDetailsResponse,
  OrderStatsResponse,
  CustomerOrderStatsResponse,
  OrderStatus,
} from '../types/orderTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Fetch all orders
export const fetchOrders = createServerFn({ method: 'GET' })
  .inputValidator((d?: { customerId?: string; status?: OrderStatus }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching orders...', data)
    try {
      const params = new URLSearchParams()
      if (data?.customerId) params.append('customerId', data.customerId)
      if (data?.status) params.append('status', data.status)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/orders${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<OrdersResponse>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch orders')
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  })

export const ordersQueryOptions = (filters?: {
  customerId?: string
  status?: OrderStatus
}) =>
  queryOptions({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders({ data: filters }),
  })

// Fetch single order by ID
export const fetchOrder = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order with id ${data}...`)
    try {
      const response = await axios.get<OrderResponse>(
        `${API_BASE_URL}/orders/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Order not found')
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  })

export const orderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder({ data: orderId }),
  })

// Fetch order with items
export const fetchOrderWithItems = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order with items for id ${data}...`)
    try {
      const response = await axios.get<OrderWithItemsResponse>(
        `${API_BASE_URL}/orders/${data}/items`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Order not found')
    } catch (error) {
      console.error('Error fetching order with items:', error)
      throw error
    }
  })

export const orderWithItemsQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order', orderId, 'items'],
    queryFn: () => fetchOrderWithItems({ data: orderId }),
  })

// Fetch order with full details (customer, addresses, items, products)
export const fetchOrderDetails = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order details for id ${data}...`)
    try {
      const response = await axios.get<OrderWithDetailsResponse>(
        `${API_BASE_URL}/orders/${data}/details`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Order not found')
    } catch (error) {
      console.error('Error fetching order details:', error)
      throw error
    }
  })

export const orderDetailsQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order', orderId, 'details'],
    queryFn: () => fetchOrderDetails({ data: orderId }),
  })

// Fetch order by order number
export const fetchOrderByNumber = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order with number ${data}...`)
    try {
      const response = await axios.get<OrderResponse>(
        `${API_BASE_URL}/orders/number/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Order not found')
    } catch (error) {
      console.error('Error fetching order by number:', error)
      throw error
    }
  })

export const orderByNumberQueryOptions = (orderNumber: string) =>
  queryOptions({
    queryKey: ['order', 'number', orderNumber],
    queryFn: () => fetchOrderByNumber({ data: orderNumber }),
  })

// Fetch orders by status
export const fetchOrdersByStatus = createServerFn({ method: 'GET' })
  .inputValidator((d: OrderStatus) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching ${data} orders...`)
    try {
      const response = await axios.get<OrdersResponse>(
        `${API_BASE_URL}/orders/status/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error(`Failed to fetch ${data} orders`)
    } catch (error) {
      console.error(`Error fetching ${data} orders:`, error)
      throw error
    }
  })

export const ordersByStatusQueryOptions = (status: OrderStatus) =>
  queryOptions({
    queryKey: ['orders', 'status', status],
    queryFn: () => fetchOrdersByStatus({ data: status }),
  })

// Fetch pending orders
export const fetchPendingOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching pending orders...')
    try {
      const response = await axios.get<OrdersResponse>(
        `${API_BASE_URL}/orders/pending`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch pending orders')
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      throw error
    }
  },
)

export const pendingOrdersQueryOptions = () =>
  queryOptions({
    queryKey: ['orders', 'pending'],
    queryFn: () => fetchPendingOrders(),
  })

// Fetch processing orders
export const fetchProcessingOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching processing orders...')
    try {
      const response = await axios.get<OrdersResponse>(
        `${API_BASE_URL}/orders/processing`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch processing orders')
    } catch (error) {
      console.error('Error fetching processing orders:', error)
      throw error
    }
  },
)

export const processingOrdersQueryOptions = () =>
  queryOptions({
    queryKey: ['orders', 'processing'],
    queryFn: () => fetchProcessingOrders(),
  })

// Fetch customer orders
export const fetchCustomerOrders = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching orders for customer ${data}...`)
    try {
      const response = await axios.get<OrdersResponse>(
        `${API_BASE_URL}/orders/customer/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch customer orders')
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      throw error
    }
  })

export const customerOrdersQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['orders', 'customer', customerId],
    queryFn: () => fetchCustomerOrders({ data: customerId }),
  })

// Fetch customer order statistics
export const fetchCustomerOrderStats = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order stats for customer ${data}...`)
    try {
      const response = await axios.get<CustomerOrderStatsResponse>(
        `${API_BASE_URL}/orders/customer/${data}/stats`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch customer order statistics')
    } catch (error) {
      console.error('Error fetching customer order stats:', error)
      throw error
    }
  })

export const customerOrderStatsQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['orders', 'customer', customerId, 'stats'],
    queryFn: () => fetchCustomerOrderStats({ data: customerId }),
  })

// Fetch order statistics
export const fetchOrderStats = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching stats for order ${data}...`)
    try {
      const response = await axios.get<OrderStatsResponse>(
        `${API_BASE_URL}/orders/${data}/stats`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch order statistics')
    } catch (error) {
      console.error('Error fetching order stats:', error)
      throw error
    }
  })

export const orderStatsQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order', orderId, 'stats'],
    queryFn: () => fetchOrderStats({ data: orderId }),
  })

// Shipping option type
export type ShippingOption = {
  methodId: string
  name: string
  displayName: string
  description: string | null
  carrier: string
  cost: number
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
  isFree: boolean
}

// Get available shipping options for cart
export const getShippingOptions = createServerFn({ method: 'POST' })
  .inputValidator((d: { items: Array<{ productVariantId: string; quantity: number }> }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching shipping options...', data)
    try {
      const response = await axios.post<{ success: boolean; data: ShippingOption[] }>(
        `${API_BASE_URL}/orders/shipping-options`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch shipping options')
    } catch (error) {
      console.error('Error fetching shipping options:', error)
      throw error
    }
  })

// Create a new order
export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: CreateOrderInput) => d)
  .handler(async ({ data }) => {
    console.info('Creating order...', data)
    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create order')
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  })

// Update order status
export const updateOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((d: { orderId: string; status: OrderStatus }) => d)
  .handler(async ({ data }) => {
    console.info(`Updating order ${data.orderId} status to ${data.status}...`)
    try {
      const response = await axios.put<OrderResponse>(
        `${API_BASE_URL}/orders/${data.orderId}/status`,
        { status: data.status },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update order status')
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  })

// Update order
export const updateOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: { orderId: string; updates: UpdateOrderInput }) => d)
  .handler(async ({ data }) => {
    console.info(`Updating order ${data.orderId}...`, data.updates)
    try {
      const response = await axios.put<OrderResponse>(
        `${API_BASE_URL}/orders/${data.orderId}`,
        data.updates,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update order')
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  })

// Mark order as processing
export const markOrderAsProcessing = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Marking order ${data} as processing...`)
    try {
      const response = await axios.put<OrderResponse>(
        `${API_BASE_URL}/orders/${data}/process`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to mark order as processing')
    } catch (error) {
      console.error('Error marking order as processing:', error)
      throw error
    }
  })

// Mark order as shipped
export const markOrderAsShipped = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Marking order ${data} as shipped...`)
    try {
      const response = await axios.put<OrderResponse>(
        `${API_BASE_URL}/orders/${data}/ship`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to mark order as shipped')
    } catch (error) {
      console.error('Error marking order as shipped:', error)
      throw error
    }
  })

// Mark order as delivered
export const markOrderAsDelivered = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Marking order ${data} as delivered...`)
    try {
      const response = await axios.put<OrderResponse>(
        `${API_BASE_URL}/orders/${data}/deliver`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to mark order as delivered')
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      throw error
    }
  })

// Cancel order
export const cancelOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: { orderId: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    console.info(`Cancelling order ${data.orderId}...`)
    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders/${data.orderId}/cancel`,
        { reason: data.reason },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to cancel order')
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw error
    }
  })

// Refund order
export const refundOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: { orderId: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    console.info(`Refunding order ${data.orderId}...`)
    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders/${data.orderId}/refund`,
        { reason: data.reason },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to refund order')
    } catch (error) {
      console.error('Error refunding order:', error)
      throw error
    }
  })

// Add notes to order
export const addOrderNotes = createServerFn({ method: 'POST' })
  .inputValidator((d: { orderId: string; notes: string }) => d)
  .handler(async ({ data }) => {
    console.info(`Adding notes to order ${data.orderId}...`)
    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders/${data.orderId}/notes`,
        { notes: data.notes },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to add notes to order')
    } catch (error) {
      console.error('Error adding notes to order:', error)
      throw error
    }
  })

// Delete order
export const deleteOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Deleting order ${data}...`)
    try {
      const response = await axios.delete<OrderResponse>(
        `${API_BASE_URL}/orders/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to delete order')
    } catch (error) {
      console.error('Error deleting order:', error)
      throw error
    }
  })

// Shipping method type
export type ShippingMethod = {
  id: string
  name: string
  displayName: string
  description: string | null
  carrier: string
  calculationType: string
  baseRate: string
  freeShippingThreshold: string | null
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
  isActive: boolean
  displayOrder: number
}

// Fetch all active shipping methods
export const fetchShippingMethods = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info('Fetching shipping methods...')
    try {
      const response = await axios.get<{ success: boolean; data: ShippingMethod[] }>(
        `${API_BASE_URL}/orders/shipping-methods`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch shipping methods')
    } catch (error) {
      console.error('Error fetching shipping methods:', error)
      throw error
    }
  })

export const shippingMethodsQueryOptions = () =>
  queryOptions({
    queryKey: ['shipping-methods'],
    queryFn: () => fetchShippingMethods(),
  })
