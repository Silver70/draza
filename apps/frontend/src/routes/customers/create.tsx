import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/customers/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/customers/create"!</div>
}
