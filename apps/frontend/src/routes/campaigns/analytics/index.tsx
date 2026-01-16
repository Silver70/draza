import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/analytics/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/campaigns/analytics/"!</div>
}
