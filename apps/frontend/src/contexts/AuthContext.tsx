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
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (name: string, slug?: string) => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const session = await authClient.getSession()
      if (session?.data?.user) {
        setUser(session.data.user as User)

        // Get organizations - use listUserOrganizations
        const orgsResponse = await authClient.organization.list()
        if (orgsResponse.data) {
          const orgsWithRoles = await Promise.all(
            orgsResponse.data.map(async (org: any) => {
              const memberResponse = await authClient.organization.getFullOrganization({
                query: { organizationId: org.id }
              })
              const member = memberResponse.data?.members.find(
                (m: any) => m.userId === session.data?.user.id
              )
              return {
                ...org,
                role: (member?.role || 'member') as 'owner' | 'admin' | 'member'
              }
            })
          )
          setOrganizations(orgsWithRoles)
        }

        // Get active organization from session
        const activeOrgId = (session.data.session as any)?.activeOrganizationId
        if (activeOrgId) {
          const activeOrgResponse = await authClient.organization.getFullOrganization({
            query: { organizationId: activeOrgId }
          })
          if (activeOrgResponse?.data) {
            const member = activeOrgResponse.data.members.find(
              (m: any) => m.userId === session.data?.user.id
            )
            setOrganization({
              id: activeOrgResponse.data.id,
              name: activeOrgResponse.data.name,
              slug: activeOrgResponse.data.slug,
              logo: activeOrgResponse.data.logo || undefined,
              createdAt: activeOrgResponse.data.createdAt,
              role: (member?.role || 'member') as 'owner' | 'admin' | 'member'
            })
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
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

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      organizations,
      isLoading,
      login,
      signup,
      logout,
      switchOrganization,
      createOrganization,
      refreshAuth
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
