import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/collections/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/inventory/collections/"!</div>
}
