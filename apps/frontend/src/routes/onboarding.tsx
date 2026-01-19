import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '~/contexts/AuthContext'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { GalleryVerticalEnd } from 'lucide-react'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage
})

function OnboardingPage() {
  const [organizationName, setOrganizationName] = useState('')
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { createOrganization, user } = useAuth()
  const router = useRouter()

  // Auto-generate slug from organization name
  function handleNameChange(name: string) {
    setOrganizationName(name)
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    setOrganizationSlug(slug)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate slug
    if (organizationSlug.length < 3) {
      setError('Organization slug must be at least 3 characters')
      return
    }

    setIsLoading(true)

    try {
      await createOrganization(organizationName, organizationSlug)
      // Redirect to dashboard after org creation
      router.navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Column - Form Section */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Draza
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Let's create your first organization to get started
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Acme Inc."
                    value={organizationName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    The name of your company or organization
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="organizationSlug">Organization Slug</Label>
                  <Input
                    id="organizationSlug"
                    type="text"
                    placeholder="acme-inc"
                    value={organizationSlug}
                    onChange={(e) => setOrganizationSlug(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique identifier for your organization (lowercase, hyphens allowed)
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating organization...' : 'Create Organization'}
                </Button>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="font-medium text-sm mb-2">What happens next?</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>You'll be the owner of this organization</li>
                  <li>You can invite team members later</li>
                  <li>Start adding products, customers, and orders</li>
                  <li>Switch between organizations anytime</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Image Section */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1474&auto=format&fit=crop"
          alt="Team collaboration"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
