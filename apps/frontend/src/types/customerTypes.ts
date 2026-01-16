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