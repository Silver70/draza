import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import apiClient from '~/lib/apiClient'
import { Customer, Address, CustomerWithAddresses } from '../types/customerTypes'

// Fetch all customers
export const fetchCustomers = createServerFn({ method: 'GET' })
  .inputValidator((d?: { search?: string; isGuest?: boolean }) => d)
  .handler(async ({ data }) => {
    console.info('Fetching customers...', data)
    try {
      const params = new URLSearchParams()
      if (data?.search) params.append('search', data.search)
      if (data?.isGuest !== undefined) params.append('isGuest', String(data.isGuest))

      const queryString = params.toString()
      const url = `/customers${queryString ? `?${queryString}` : ''}`

      const response = await apiClient.get<{ success: boolean; data: Customer[] }>(url)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch customers')
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  })

export const customersQueryOptions = (filters?: { search?: string; isGuest?: boolean }) =>
  queryOptions({
    queryKey: ['customers', filters],
    queryFn: () => fetchCustomers({ data: filters }),
  })

// Search customers
export const searchCustomers = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Searching customers for "${data}"...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: Customer[] }>(
        `/customers/search?q=${encodeURIComponent(data)}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to search customers')
    } catch (error) {
      console.error('Error searching customers:', error)
      throw error
    }
  })

// Fetch customer with addresses
export const fetchCustomerWithAddresses = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching customer ${data} with addresses...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: CustomerWithAddresses }>(
        `/customers/${data}/addresses`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Customer not found')
    } catch (error) {
      console.error('Error fetching customer with addresses:', error)
      throw error
    }
  })

export const customerWithAddressesQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'addresses'],
    queryFn: () => fetchCustomerWithAddresses({ data: customerId }),
  })

// Fetch customer addresses
export const fetchCustomerAddresses = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching addresses for customer ${data}...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: Address[] }>(
        `/customers/${data}/addresses/all`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch addresses')
    } catch (error) {
      console.error('Error fetching customer addresses:', error)
      throw error
    }
  })

export const customerAddressesQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'addresses', 'all'],
    queryFn: () => fetchCustomerAddresses({ data: customerId }),
  })

// Create customer
export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    user_id?: string | null
    first_name: string
    last_name: string
    email: string
    phone_number: string
    is_guest?: boolean
  }) => d)
  .handler(async ({ data }) => {
    console.info('Creating customer...', data)
    try {
      const response = await apiClient.post<{ success: boolean; data: Customer }>(
        `/customers`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create customer')
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  })

// Create guest customer
export const createGuestCustomer = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
  }) => d)
  .handler(async ({ data }) => {
    console.info('Creating guest customer...', data)
    try {
      const response = await apiClient.post<{ success: boolean; data: Customer }>(
        `/customers/guest`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create guest customer')
    } catch (error) {
      console.error('Error creating guest customer:', error)
      throw error
    }
  })

// Get or create customer
export const getOrCreateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
    is_guest: boolean
  }) => d)
  .handler(async ({ data }) => {
    console.info('Getting or creating customer...', data)
    try {
      const response = await apiClient.post<{
        success: boolean
        data: { customer: Customer; created: boolean }
      }>(`/customers/get-or-create`, data)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to get or create customer')
    } catch (error) {
      console.error('Error getting or creating customer:', error)
      throw error
    }
  })

// Update customer
export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
  }) => d)
  .handler(async ({ data }) => {
    console.info(`Updating customer ${data.id}...`, data)
    try {
      const { id, ...updateData } = data
      const response = await apiClient.put<{ success: boolean; data: Customer }>(
        `/customers/${id}`,
        updateData,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update customer')
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  })

// Convert guest to registered customer
export const convertGuestToRegistered = createServerFn({ method: 'POST' })
  .inputValidator((d: { customerId: string; userId: string }) => d)
  .handler(async ({ data }) => {
    console.info(`Converting guest customer ${data.customerId} to registered...`)
    try {
      const response = await apiClient.put<{ success: boolean; data: Customer }>(
        `/customers/${data.customerId}/convert-to-registered`,
        { userId: data.userId },
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to convert customer')
    } catch (error) {
      console.error('Error converting customer:', error)
      throw error
    }
  })

// Delete customer
export const deleteCustomer = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Deleting customer ${data}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/customers/${data}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to delete customer')
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw error
    }
  })

// Create address for customer
export const createAddress = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    customerId: string
    firstName: string
    lastName: string
    phoneNumber: string
    streetAddress: string
    apartment?: string | null
    city: string
    state: string
    postalCode: string
    country?: string
    isDefault?: boolean
  }) => d)
  .handler(async ({ data }) => {
    console.info(`Creating address for customer ${data.customerId}...`, data)
    try {
      const { customerId, ...addressData } = data
      const response = await apiClient.post<{ success: boolean; data: Address }>(
        `/customers/${customerId}/addresses`,
        addressData,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create address')
    } catch (error) {
      console.error('Error creating address:', error)
      throw error
    }
  })

// Update address
export const updateAddress = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    addressId: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
    streetAddress?: string
    apartment?: string | null
    city?: string
    state?: string
    postalCode?: string
    country?: string
    isDefault?: boolean
  }) => d)
  .handler(async ({ data }) => {
    console.info(`Updating address ${data.addressId}...`, data)
    try {
      const { addressId, ...updateData } = data
      const response = await apiClient.put<{ success: boolean; data: Address }>(
        `/customers/addresses/${addressId}`,
        updateData,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update address')
    } catch (error) {
      console.error('Error updating address:', error)
      throw error
    }
  })

// Set address as default
export const setDefaultAddress = createServerFn({ method: 'POST' })
  .inputValidator((d: { customerId: string; addressId: string }) => d)
  .handler(async ({ data }) => {
    console.info(`Setting address ${data.addressId} as default for customer ${data.customerId}...`)
    try {
      const response = await apiClient.put<{ success: boolean; data: Address }>(
        `/customers/${data.customerId}/addresses/${data.addressId}/set-default`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to set default address')
    } catch (error) {
      console.error('Error setting default address:', error)
      throw error
    }
  })

// Delete address
export const deleteAddress = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Deleting address ${data}...`)
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/customers/addresses/${data}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to delete address')
    } catch (error) {
      console.error('Error deleting address:', error)
      throw error
    }
  })

// Fetch registered customers
export const fetchRegisteredCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching registered customers...')
  try {
    const response = await apiClient.get<{ success: boolean; data: Customer[] }>(
      `/customers/registered`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch registered customers')
  } catch (error) {
    console.error('Error fetching registered customers:', error)
    throw error
  }
})

export const registeredCustomersQueryOptions = () =>
  queryOptions({
    queryKey: ['customers', 'registered'],
    queryFn: () => fetchRegisteredCustomers(),
  })

// Fetch guest customers
export const fetchGuestCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching guest customers...')
  try {
    const response = await apiClient.get<{ success: boolean; data: Customer[] }>(
      `/customers/guests`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch guest customers')
  } catch (error) {
    console.error('Error fetching guest customers:', error)
    throw error
  }
})

export const guestCustomersQueryOptions = () =>
  queryOptions({
    queryKey: ['customers', 'guests'],
    queryFn: () => fetchGuestCustomers(),
  })

// Fetch customer by email
export const fetchCustomerByEmail = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching customer by email ${data}...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: Customer }>(
        `/customers/email/${encodeURIComponent(data)}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Customer not found')
    } catch (error) {
      console.error('Error fetching customer by email:', error)
      throw error
    }
  })

// Fetch customer by phone
export const fetchCustomerByPhone = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching customer by phone ${data}...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: Customer }>(
        `/customers/phone/${encodeURIComponent(data)}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Customer not found')
    } catch (error) {
      console.error('Error fetching customer by phone:', error)
      throw error
    }
  })

// Fetch default address
export const fetchDefaultAddress = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching default address for customer ${data}...`)
    try {
      const response = await apiClient.get<{ success: boolean; data: Address }>(
        `/customers/${data}/addresses/default`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('No default address found')
    } catch (error) {
      console.error('Error fetching default address:', error)
      throw error
    }
  })

export const defaultAddressQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'addresses', 'default'],
    queryFn: () => fetchDefaultAddress({ data: customerId }),
  })

// Fetch customer stats
export const fetchCustomerStats = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching stats for customer ${data}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          customer: Customer
          addressCount: number
          hasDefaultAddress: boolean
        }
      }>(`/customers/${data}/stats`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch customer stats')
    } catch (error) {
      console.error('Error fetching customer stats:', error)
      throw error
    }
  })

export const customerStatsQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'stats'],
    queryFn: () => fetchCustomerStats({ data: customerId }),
  })

// Fetch address stats
export const fetchAddressStats = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching address stats for customer ${data}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          totalAddresses: number
          hasDefaultAddress: boolean
          defaultAddressId?: string
          addressesByCountry: Record<string, number>
        }
      }>(`/customers/${data}/addresses/stats`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch address stats')
    } catch (error) {
      console.error('Error fetching address stats:', error)
      throw error
    }
  })

export const addressStatsQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'addresses', 'stats'],
    queryFn: () => fetchAddressStats({ data: customerId }),
  })

// Fetch customer orders
export const fetchCustomerOrders = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching orders for customer ${data}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: any[] // Using any for now - you can import Order type if available
      }>(`/orders/customer/${data}`)

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
    queryKey: ['customer', customerId, 'orders'],
    queryFn: () => fetchCustomerOrders({ data: customerId }),
  })

// Fetch customer order stats
export const fetchCustomerOrderStats = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching order stats for customer ${data}...`)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          totalOrders: number
          totalSpent: number
          averageOrderValue: number
          ordersByStatus: Record<string, number>
        }
      }>(`/orders/customer/${data}/stats`)

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch customer order stats')
    } catch (error) {
      console.error('Error fetching customer order stats:', error)
      throw error
    }
  })

export const customerOrderStatsQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ['customer', customerId, 'orders', 'stats'],
    queryFn: () => fetchCustomerOrderStats({ data: customerId }),
  })
