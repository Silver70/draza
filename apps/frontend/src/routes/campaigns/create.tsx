import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/campaigns/create"!</div>
}
