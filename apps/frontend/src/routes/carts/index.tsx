import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carts/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/carts/"!</div>
}
