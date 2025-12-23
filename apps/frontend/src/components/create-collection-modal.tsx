"use client"

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '~/components/ui/field'
import { createCollection } from '@/utils/products'

// Validation schema for collection
const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').min(2, 'Collection name must be at least 2 characters'),
  description: z.string().optional(),
  slug: z.string().optional(),
  isActive: z.boolean(),
})

interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCollectionModal({ open, onOpenChange }: CreateCollectionModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createCollectionMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      isActive: true,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)

        // Validate using zod schema
        const validatedData = collectionSchema.parse(value)

        // Prepare data - only send non-empty optional fields
        const dataToSend = {
          name: validatedData.name,
          isActive: validatedData.isActive,
          ...(validatedData.description && validatedData.description.trim() ? { description: validatedData.description } : {}),
          ...(validatedData.slug && validatedData.slug.trim() ? { slug: validatedData.slug } : {}),
        }

        await createCollectionMutation.mutateAsync({ data: dataToSend })

        toast.success('Collection created successfully!', {
          description: `${validatedData.name} has been added to your collections.`,
        })

        // Reset form and close modal
        form.reset()
        onOpenChange(false)
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Validation failed', {
            description: error.issues[0]?.message,
          })
        } else {
          console.error('Form submission error', error)
          toast.error('Failed to create collection', {
            description: error instanceof Error ? error.message : 'Please try again later.',
          })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Add a new collection to organize your products. You can add products to this collection after creation.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          {/* Collection Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Collection name is required'
                }
                if (value.length < 2) {
                  return 'Collection name must be at least 2 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="name">Collection Name *</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale, New Arrivals"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter a clear and descriptive name for the collection.
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
                <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Describe this collection..."
                  rows={3}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Add a description to help customers understand this collection.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          {/* Slug Field (Optional) */}
          <form.Field
            name="slug"
            validators={{
              onChange: ({ value }) => {
                if (value && value.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
                  return 'Slug must contain only lowercase letters, numbers, and hyphens'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="slug">Slug (Optional)</FieldLabel>
                <Input
                  id="slug"
                  placeholder="e.g., summer-sale, new-arrivals"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  URL-friendly identifier. Leave empty to auto-generate from name.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
              </Field>
            )}
          </form.Field>

          {/* Active Status Checkbox */}
          <form.Field name="isActive">
            {(field) => (
              <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="isActive"
                  checked={field.state.value as boolean}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <div className="flex-1 space-y-1 leading-none">
                  <FieldLabel htmlFor="isActive">Active Collection</FieldLabel>
                  <FieldDescription>
                    Mark this collection as active to make it visible to customers.
                  </FieldDescription>
                </div>
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.state.canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
