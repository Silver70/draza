import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/products/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/inventory/products/create"!</div>
}
