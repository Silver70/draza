import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/tax/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/settings/tax/"!</div>
}
