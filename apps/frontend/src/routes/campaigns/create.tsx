import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '~/components/ui/field'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createCampaign } from '~/utils/analytics'
import { campaignsQueryOptions } from '~/utils/analytics'
import { getPlatformDisplayName } from '~/utils/campaigns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

export const Route = createFileRoute('/campaigns/create')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(campaignsQueryOptions()),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})

// Validation schema matching backend
const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().optional(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'multi', 'other']),
  campaignType: z.enum(['post', 'reel', 'story', 'video', 'ad', 'campaign']),
  parentCampaignId: z.string().uuid().optional(),
  postUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  cost: z.number().nonnegative('Cost must be 0 or greater').optional(),
  budget: z.number().nonnegative('Budget must be 0 or greater').optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
})

const platforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'multi', 'other'] as const

const campaignTypes = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'video', label: 'Video' },
  { value: 'ad', label: 'Ad' },
  { value: 'campaign', label: 'Campaign' },
] as const

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: campaigns } = useSuspenseQuery(campaignsQueryOptions())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter for parent campaigns (top-level campaigns only)
  const parentCampaigns = campaigns.filter(c => !c.parentCampaignId)

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      platform: 'instagram' as const,
      campaignType: 'post' as const,
      parentCampaignId: null as string | null,
      postUrl: '',
      cost: 0,
      budget: 0,
      startsAt: '',
      endsAt: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Prepare data for API
        const campaignData: {
          name: string
          description?: string
          platform: string
          campaignType: string
          parentCampaignId?: string
          postUrl?: string
          cost?: number
          budget?: number
          startsAt?: string
          endsAt?: string
        } = {
          name: value.name,
          platform: value.platform,
          campaignType: value.campaignType,
          ...(value.description && { description: value.description }),
          ...(value.parentCampaignId && { parentCampaignId: value.parentCampaignId }),
          ...(value.postUrl && { postUrl: value.postUrl }),
          cost: value.cost || 0,
          budget: value.budget || 0,
          ...(value.startsAt && { startsAt: new Date(value.startsAt).toISOString() }),
          ...(value.endsAt && { endsAt: new Date(value.endsAt).toISOString() }),
        }

        // Validate
        const validatedData = campaignSchema.parse(campaignData)

        console.log('Creating campaign:', validatedData)

        // Create campaign
        const campaign = await createCampaign(validatedData)

        toast.success('Campaign created successfully!', {
          description: `${campaign.name} has been created with tracking code: ${campaign.trackingCode}`,
        })

        // Invalidate campaigns query to refetch
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })

        // Navigate to campaigns list
        setTimeout(() => {
          navigate({ to: '/campaigns' })
        }, 100)
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create campaign', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6"
    >
      {/* Campaign Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Campaign</CardTitle>
          <CardDescription>
            Set up a new marketing campaign to track visits, conversions, and ROI across social media platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Campaign name is required'
                }
                if (value.length > 255) {
                  return 'Campaign name must be less than 255 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="name">Campaign Name *</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale Instagram Campaign"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  A descriptive name for this marketing campaign.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Description Field */}
          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="e.g., Summer sale campaign targeting millennials interested in fashion"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
                <FieldDescription>
                  Describe the campaign purpose and target audience.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          <Separator />

          {/* Platform Selection */}
          <form.Field
            name="platform"
            validators={{
              onChange: ({ value }) => {
                if (!value) {
                  return 'Platform is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Platform *</FieldLabel>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as any)}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {platforms.map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <RadioGroupItem value={platform} id={`platform-${platform}`} />
                      <FieldLabel htmlFor={`platform-${platform}`} className="font-normal cursor-pointer">
                        {getPlatformDisplayName(platform as any)}
                      </FieldLabel>
                    </div>
                  ))}
                </RadioGroup>
                <FieldDescription>
                  Select the social media platform for this campaign.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Campaign Type Selection */}
          <form.Field
            name="campaignType"
            validators={{
              onChange: ({ value }) => {
                if (!value) {
                  return 'Campaign type is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Campaign Type *</FieldLabel>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as any)}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {campaignTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={type.value} id={`type-${type.value}`} />
                      <FieldLabel htmlFor={`type-${type.value}`} className="font-normal cursor-pointer">
                        {type.label}
                      </FieldLabel>
                    </div>
                  ))}
                </RadioGroup>
                <FieldDescription>
                  Select the type of content for this campaign.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Parent Campaign Selection */}
          <form.Field name="parentCampaignId">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="parentCampaignId">Parent Campaign (Optional)</FieldLabel>
                <Select
                  value={field.state.value || undefined}
                  onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                >
                  <SelectTrigger id="parentCampaignId">
                    <SelectValue placeholder="Select a parent campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top-level campaign)</SelectItem>
                    {parentCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({getPlatformDisplayName(campaign.platform)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Organize this as a sub-campaign under a parent campaign for better tracking.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          {/* Post URL */}
          <form.Field
            name="postUrl"
            validators={{
              onChange: ({ value }) => {
                if (value && value.trim().length > 0) {
                  try {
                    new URL(value)
                  } catch {
                    return 'Must be a valid URL'
                  }
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="postUrl">Post URL (Optional)</FieldLabel>
                <Input
                  id="postUrl"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Link to the social media post for this campaign.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Budget & Costs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Budget & Costs</CardTitle>
          <CardDescription>
            Set the budget and costs for tracking ROI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Field */}
            <form.Field
              name="cost"
              validators={{
                onChange: ({ value }) => {
                  if (value < 0) {
                    return 'Cost cannot be negative'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="cost">Cost</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                  <FieldDescription>
                    Total cost spent on this campaign.
                  </FieldDescription>
                  {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Budget Field */}
            <form.Field
              name="budget"
              validators={{
                onChange: ({ value }) => {
                  if (value < 0) {
                    return 'Budget cannot be negative'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="budget">Budget</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                  <FieldDescription>
                    Allocated budget for this campaign.
                  </FieldDescription>
                  {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                  )}
                </Field>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Campaign Schedule</CardTitle>
          <CardDescription>
            Set the start and end dates for your campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <form.Field name="startsAt">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="startsAt">Start Date</FieldLabel>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    When the campaign starts (optional).
                  </FieldDescription>
                </Field>
              )}
            </form.Field>

            {/* End Date */}
            <form.Field name="endsAt">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="endsAt">End Date</FieldLabel>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    When the campaign ends (optional).
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => form.handleSubmit()}
              className="w-full sm:w-auto"
              disabled={!form.state.canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/campaigns' })}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
