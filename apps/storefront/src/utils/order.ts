import axios from 'redaxios'
import { getOrCreateSessionId } from './session'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Customer & Address Types
 */
export interface CustomerData {
  email: string
  firstName: string
  lastName: string
  phone: string
}

export interface AddressData {
  streetAddress: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CreateOrderRequest {
  // Customer info
  email: string
  firstName: string
  lastName: string
  phone: string

  // Shipping address
  shippingAddress: AddressData

  // Billing address
  billingAddress: AddressData

  // Order items from cart
  items: Array<{
    productVariantId: string
    quantity: number
  }>

  // Shipping method selected
  shippingMethodId: string

  // Optional discount code
  discountCode?: string

  // Optional notes
  notes?: string
}

export interface OrderResponse {
  success: boolean
  data?: {
    id: string
    orderNumber: string
    status: string
    total: string
    subtotal: string
    taxTotal: string
    shippingTotal: string
    discountTotal: string
  }
  error?: string
}

/**
 * Create a complete order with guest checkout
 * This handles:
 * 1. Get or create customer by email
 * 2. Create shipping address
 * 3. Create billing address
 * 4. Create order with all the IDs
 */
export async function createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
  try {
    const sessionId = getOrCreateSessionId()

    // Step 1: Get or create customer
    console.log('Step 1: Creating/fetching customer...')
    const customerResponse = await axios.post(`${API_BASE_URL}/customers/get-or-create`, {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phone,
      is_guest: true,
    })

    if (!customerResponse.data.success) {
      throw new Error(customerResponse.data.error || 'Failed to create customer')
    }

    const customer = customerResponse.data.data.customer
    const customerId = customer.id

    console.log('Customer created/found:', customerId)

    // Step 2: Create shipping address
    console.log('Step 2: Creating shipping address...')
    const shippingAddressResponse = await axios.post(
      `${API_BASE_URL}/customers/${customerId}/addresses`,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
        streetAddress: data.shippingAddress.streetAddress,
        apartment: data.shippingAddress.apartment,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postalCode: data.shippingAddress.postalCode,
        country: data.shippingAddress.country,
        isDefault: false,
      }
    )

    if (!shippingAddressResponse.data.success) {
      throw new Error(shippingAddressResponse.data.error || 'Failed to create shipping address')
    }

    const shippingAddressId = shippingAddressResponse.data.data.id
    console.log('Shipping address created:', shippingAddressId)

    // Step 3: Create billing address
    console.log('Step 3: Creating billing address...')
    const billingAddressResponse = await axios.post(
      `${API_BASE_URL}/customers/${customerId}/addresses`,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
        streetAddress: data.billingAddress.streetAddress,
        apartment: data.billingAddress.apartment,
        city: data.billingAddress.city,
        state: data.billingAddress.state,
        postalCode: data.billingAddress.postalCode,
        country: data.billingAddress.country,
        isDefault: false,
      }
    )

    if (!billingAddressResponse.data.success) {
      throw new Error(billingAddressResponse.data.error || 'Failed to create billing address')
    }

    const billingAddressId = billingAddressResponse.data.data.id
    console.log('Billing address created:', billingAddressId)

    // Step 4: Create the order
    console.log('Step 4: Creating order...')
    const orderResponse = await axios.post(`${API_BASE_URL}/orders`, {
      customerId,
      shippingAddressId,
      billingAddressId,
      items: data.items,
      shippingMethodId: data.shippingMethodId,
      discountCode: data.discountCode,
      sessionId, // For campaign attribution
      notes: data.notes,
    })

    if (!orderResponse.data.success) {
      throw new Error(orderResponse.data.error || 'Failed to create order')
    }

    console.log('Order created successfully:', orderResponse.data.data)

    return {
      success: true,
      data: orderResponse.data.data,
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    }
  }
}

/**
 * Get available shipping methods
 */
export async function getShippingMethods() {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/shipping-methods`)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch shipping methods')
    }

    return response.data.data
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    throw error
  }
}
