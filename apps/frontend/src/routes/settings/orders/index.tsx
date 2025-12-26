import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Combobox } from '~/components/ui/combobox'
import { FieldLabel } from '~/components/ui/field'
import { PendingComponent } from '~/components/Pending'
import { ErrorComponent } from '~/components/Error'
import { shippingMethodsQueryOptions } from '~/utils/orders'
import { getOrderSettings, saveOrderSettings } from '~/utils/orderSettings'

export const Route = createFileRoute('/settings/orders/')({
    loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(shippingMethodsQueryOptions())
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
})

function RouteComponent() {
  const { data: shippingMethods } = useSuspenseQuery(shippingMethodsQueryOptions())

  // Load settings from localStorage
  const [defaultShippingMethodId, setDefaultShippingMethodId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const settings = getOrderSettings()
    if (settings.defaultShippingMethodId) {
      setDefaultShippingMethodId(settings.defaultShippingMethodId)
    }
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    try {
      saveOrderSettings({
        defaultShippingMethodId: defaultShippingMethodId || null,
      })
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedMethod = shippingMethods.find(m => m.id === defaultShippingMethodId)

  return (
    <div className="space-y-6">
      {/* Default Shipping Method */}
      <Card>
        <CardHeader>
          <CardTitle>Default Shipping Method</CardTitle>
          <CardDescription>
            Select the default shipping method to use when creating orders. You can override this on a per-order basis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="default-shipping">Default Shipping Method</FieldLabel>
            <Combobox
              options={shippingMethods.map(method => ({
                value: method.id,
                label: `${method.displayName} - ${method.carrier} ($${parseFloat(method.baseRate).toFixed(2)})`,
              }))}
              value={defaultShippingMethodId}
              onSelect={(value) => setDefaultShippingMethodId(value)}
              placeholder="Select a shipping method..."
              searchPlaceholder="Search shipping methods..."
              emptyText="No shipping methods found."
              triggerClassName="w-full"
            />
          </div>

          {selectedMethod && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="space-y-1">
                <div className="font-medium">{selectedMethod.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedMethod.description || 'No description'}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Carrier:</span> {selectedMethod.carrier}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Base Rate:</span> ${parseFloat(selectedMethod.baseRate).toFixed(2)}
                </div>
                {selectedMethod.freeShippingThreshold && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Free Shipping Threshold:</span>{' '}
                    ${parseFloat(selectedMethod.freeShippingThreshold).toFixed(2)}
                  </div>
                )}
                {selectedMethod.estimatedDaysMin && selectedMethod.estimatedDaysMax && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Estimated Delivery:</span>{' '}
                    {selectedMethod.estimatedDaysMin}-{selectedMethod.estimatedDaysMax} business days
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            {defaultShippingMethodId && (
              <Button
                variant="outline"
                onClick={() => {
                  setDefaultShippingMethodId('')
                  saveOrderSettings({ defaultShippingMethodId: null })
                  toast.success('Default shipping method cleared')
                }}
              >
                Clear Default
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>
            More order-related settings can be added here in the future.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Future settings: default tax jurisdiction, order number prefix, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

