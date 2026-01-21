import React, { createContext, useContext, useState, useEffect } from 'react'
import { authClient } from '~/lib/auth.client'

interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  role: 'owner' | 'admin' | 'member'
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  organizations: Organization[]
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (name: string, slug?: string) => Promise<void>
  refreshAuth: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      setError(null)
      const session = await authClient.getSession().catch((err) => {
        // If fetch fails (network error, etc), treat as no session
        console.warn('Failed to fetch session:', err)
        return { data: null, error: err }
      })

      if (session?.data?.user) {
        setUser(session.data.user as User)

        // Get organizations list
        const orgsResponse = await authClient.organization.list()
        if (orgsResponse.data) {
          // Get active organization ID from session
          const activeOrgId = (session.data.session as any)?.activeOrganizationId

          // OPTIMIZED: Only fetch full org details for active org
          if (activeOrgId) {
            const activeOrgResponse = await authClient.organization.getFullOrganization({
              query: { organizationId: activeOrgId }
            })

            if (activeOrgResponse?.data) {
              const member = activeOrgResponse.data.members.find(
                (m: any) => m.userId === session.data?.user.id
              )

              // Set active organization
              setOrganization({
                id: activeOrgResponse.data.id,
                name: activeOrgResponse.data.name,
                slug: activeOrgResponse.data.slug,
                logo: activeOrgResponse.data.logo || undefined,
                createdAt: activeOrgResponse.data.createdAt,
                role: (member?.role || 'member') as 'owner' | 'admin' | 'member'
              })

              // Build organizations list with active org having full details
              const orgsWithRoles = orgsResponse.data.map((org: any) => {
                if (org.id === activeOrgId) {
                  return {
                    id: activeOrgResponse.data!.id,
                    name: activeOrgResponse.data!.name,
                    slug: activeOrgResponse.data!.slug,
                    logo: activeOrgResponse.data!.logo || undefined,
                    createdAt: activeOrgResponse.data!.createdAt,
                    role: (member?.role || 'member') as 'owner' | 'admin' | 'member'
                  }
                }
                return {
                  ...org,
                  role: 'member' as const // Default role for non-active orgs
                }
              })
              setOrganizations(orgsWithRoles)
            }
          } else if (orgsResponse.data.length > 0) {
            // No active org but user has orgs - automatically set the first one as active
            const firstOrg = orgsResponse.data[0]
            await authClient.organization.setActive({
              organizationId: firstOrg.id
            })
            // Recursively call checkAuth to reload with the newly set active org
            await checkAuth()
            return
          } else {
            // No organizations at all - user needs to create one
            setOrganizations([])
          }
        }
      } else {
        // No session - clear state
        setUser(null)
        setOrganization(null)
        setOrganizations([])
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      const errorMessage = error instanceof Error
        ? error.message
        : 'Authentication failed. Please try logging in again.'
      setError(errorMessage)

      // Clear auth state on error
      setUser(null)
      setOrganization(null)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/'
    })

    if (response.error) {
      throw new Error(response.error.message || 'Login failed')
    }

    await checkAuth()
  }

  async function signup(email: string, password: string, name: string) {
    const response = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: '/'
    })

    if (response.error) {
      throw new Error(response.error.message || 'Signup failed')
    }

    await checkAuth()
  }

  async function logout() {
    await authClient.signOut()
    setUser(null)
    setOrganization(null)
    setOrganizations([])
  }

  async function switchOrganization(orgId: string) {
    const response = await authClient.organization.setActive({
      organizationId: orgId
    })

    if (response.error) {
      throw new Error(response.error.message || 'Failed to switch organization')
    }

    await checkAuth()
  }

  async function createOrganization(name: string, slug?: string) {
    const response = await authClient.organization.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-')
    })

    if (response.error) {
      throw new Error(response.error.message || 'Failed to create organization')
    }

    await checkAuth()

    // Auto-switch to the newly created organization
    if (response.data) {
      await switchOrganization(response.data.id)
    }
  }

  async function refreshAuth() {
    await checkAuth()
  }

  function clearError() {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      organizations,
      isLoading,
      error,
      login,
      signup,
      logout,
      switchOrganization,
      createOrganization,
      refreshAuth,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
