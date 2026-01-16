import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import axios from 'redaxios'
import {
  TaxJurisdiction,
  CreateTaxJurisdictionInput,
  UpdateTaxJurisdictionInput,
  JurisdictionType,
} from '../types/taxTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Fetch all active tax jurisdictions
export const fetchActiveTaxJurisdictions = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching active tax jurisdictions...')
  try {
    const response = await axios.get<{ success: boolean; data: TaxJurisdiction[] }>(
      `${API_BASE_URL}/tax/jurisdictions`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch tax jurisdictions')
  } catch (error) {
    console.error('Error fetching tax jurisdictions:', error)
    throw error
  }
})

export const activeTaxJurisdictionsQueryOptions = () =>
  queryOptions({
    queryKey: ['tax-jurisdictions', 'active'],
    queryFn: () => fetchActiveTaxJurisdictions(),
  })

// Fetch all tax jurisdictions (including inactive)
export const fetchAllTaxJurisdictions = createServerFn({ method: 'GET' }).handler(async () => {
  console.info('Fetching all tax jurisdictions...')
  try {
    const response = await axios.get<{ success: boolean; data: TaxJurisdiction[] }>(
      `${API_BASE_URL}/tax/jurisdictions/all`,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error('Failed to fetch tax jurisdictions')
  } catch (error) {
    console.error('Error fetching tax jurisdictions:', error)
    throw error
  }
})

export const allTaxJurisdictionsQueryOptions = () =>
  queryOptions({
    queryKey: ['tax-jurisdictions', 'all'],
    queryFn: () => fetchAllTaxJurisdictions(),
  })

// Fetch tax jurisdictions by type
export const fetchTaxJurisdictionsByType = createServerFn({ method: 'GET' })
  .inputValidator((d: JurisdictionType) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching tax jurisdictions of type ${data}...`)
    try {
      const response = await axios.get<{ success: boolean; data: TaxJurisdiction[] }>(
        `${API_BASE_URL}/tax/jurisdictions/type/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to fetch tax jurisdictions')
    } catch (error) {
      console.error('Error fetching tax jurisdictions by type:', error)
      throw error
    }
  })

export const taxJurisdictionsByTypeQueryOptions = (type: JurisdictionType) =>
  queryOptions({
    queryKey: ['tax-jurisdictions', 'type', type],
    queryFn: () => fetchTaxJurisdictionsByType({ data: type }),
  })

// Fetch tax jurisdiction by ID
export const fetchTaxJurisdictionById = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching tax jurisdiction ${data}...`)
    try {
      const response = await axios.get<{ success: boolean; data: TaxJurisdiction }>(
        `${API_BASE_URL}/tax/jurisdictions/${data}`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Tax jurisdiction not found')
    } catch (error) {
      console.error('Error fetching tax jurisdiction:', error)
      throw error
    }
  })

export const taxJurisdictionByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['tax-jurisdiction', id],
    queryFn: () => fetchTaxJurisdictionById({ data: id }),
  })

// Create tax jurisdiction
export const createTaxJurisdiction = createServerFn({ method: 'POST' })
  .inputValidator((d: CreateTaxJurisdictionInput) => d)
  .handler(async ({ data }) => {
    console.info('Creating tax jurisdiction...', data)
    try {
      const response = await axios.post<{ success: boolean; data: TaxJurisdiction }>(
        `${API_BASE_URL}/tax/jurisdictions`,
        data,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to create tax jurisdiction')
    } catch (error) {
      console.error('Error creating tax jurisdiction:', error)
      throw error
    }
  })

// Update tax jurisdiction
export const updateTaxJurisdiction = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string } & UpdateTaxJurisdictionInput) => d)
  .handler(async ({ data }) => {
    console.info(`Updating tax jurisdiction ${data.id}...`, data)
    try {
      const { id, ...updateData } = data
      const response = await axios.put<{ success: boolean; data: TaxJurisdiction }>(
        `${API_BASE_URL}/tax/jurisdictions/${id}`,
        updateData,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to update tax jurisdiction')
    } catch (error) {
      console.error('Error updating tax jurisdiction:', error)
      throw error
    }
  })

// Deactivate tax jurisdiction
export const deactivateTaxJurisdiction = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Deactivating tax jurisdiction ${data}...`)
    try {
      const response = await axios.put<{ success: boolean; data: TaxJurisdiction }>(
        `${API_BASE_URL}/tax/jurisdictions/${data}/deactivate`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to deactivate tax jurisdiction')
    } catch (error) {
      console.error('Error deactivating tax jurisdiction:', error)
      throw error
    }
  })

// Activate tax jurisdiction
export const activateTaxJurisdiction = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Activating tax jurisdiction ${data}...`)
    try {
      const response = await axios.put<{ success: boolean; data: TaxJurisdiction }>(
        `${API_BASE_URL}/tax/jurisdictions/${data}/activate`,
      )

      if (response.data.success) {
        return response.data.data
      }

      throw new Error('Failed to activate tax jurisdiction')
    } catch (error) {
      console.error('Error activating tax jurisdiction:', error)
      throw error
    }
  })

// Delete tax jurisdiction
export const deleteTaxJurisdiction = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Deleting tax jurisdiction ${data}...`)
    try {
      const response = await axios.delete<{ success: boolean; message: string }>(
        `${API_BASE_URL}/tax/jurisdictions/${data}`,
      )

      if (response.data.success) {
        return response.data
      }

      throw new Error('Failed to delete tax jurisdiction')
    } catch (error) {
      console.error('Error deleting tax jurisdiction:', error)
      throw error
    }
  })
