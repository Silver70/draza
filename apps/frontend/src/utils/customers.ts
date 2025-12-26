import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Customer types
export type Customer = {
  id: string
  user_id?: string | null
  first_name: string
  last_name: string
  email: string
  phone_number: string
  is_guest: boolean
  createdAt: string
}

export type Address = {
  id: string
  customerId: string
  firstName: string
  lastName: string
  phoneNumber: string
  streetAddress: string
  apartment?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CustomerWithAddresses = Customer & {
  addresses: Address[]
}

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
      const url = `${API_BASE_URL}/customers${queryString ? `?${queryString}` : ''}`

      const response = await axios.get<{ success: boolean; data: Customer[] }>(url)

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
      const response = await axios.get<{ success: boolean; data: Customer[] }>(
        `${API_BASE_URL}/customers/search?q=${encodeURIComponent(data)}`,
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
      const response = await axios.get<{ success: boolean; data: CustomerWithAddresses }>(
        `${API_BASE_URL}/customers/${data}/addresses`,
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
      const response = await axios.get<{ success: boolean; data: Address[] }>(
        `${API_BASE_URL}/customers/${data}/addresses/all`,
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
