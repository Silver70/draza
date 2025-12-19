import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/products/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/inventory/products/"!</div>
}
