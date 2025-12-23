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
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '~/components/ui/field'
import { createCategory } from '@/utils/products'

// Validation schema for category
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').min(2, 'Category name must be at least 2 characters'),
  slug: z.string().optional(),
})

interface CreateCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCategoryModal({ open, onOpenChange }: CreateCategoryModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)

        // Validate using zod schema
        const validatedData = categorySchema.parse(value)

        // Prepare data - only send slug if it's not empty
        const dataToSend = {
          name: validatedData.name,
          ...(validatedData.slug && validatedData.slug.trim() ? { slug: validatedData.slug } : {}),
        }

        await createCategoryMutation.mutateAsync({ data: dataToSend })

        toast.success('Category created successfully!', {
          description: `${validatedData.name} has been added to your categories.`,
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
          toast.error('Failed to create category', {
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
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your products. The slug will be auto-generated if left empty.
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
          {/* Category Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Category name is required'
                }
                if (value.length < 2) {
                  return 'Category name must be at least 2 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="name">Category Name *</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Electronics, Clothing"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  Enter a clear and descriptive name for the category.
                </FieldDescription>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors.map(error => ({ message: error }))} />
                )}
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
                  placeholder="e.g., electronics, clothing"
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
