import { cn } from '~/lib/utils'

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-8 px-6 max-w-4xl">
      {children}
    </div>
  )
}

// Reusable documentation components
export function DocHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold mb-4">{children}</h1>
}

export function DocSection({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-12">
      {children}
    </section>
  )
}

export function DocSubheading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-2xl font-semibold mb-4 mt-8 scroll-mt-16">
      {children}
    </h2>
  )
}

export function DocH3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="text-xl font-semibold mb-3 mt-6 scroll-mt-16">
      {children}
    </h3>
  )
}

export function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-4 leading-7">{children}</p>
}

export function DocCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  )
}

export function DocCodeBlock({ children }: { children: string; language?: string }) {
  return (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
      <code className="text-sm font-mono">{children}</code>
    </pre>
  )
}

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  children?: React.ReactNode
}

export function Endpoint({ method, path, description, children }: EndpointProps) {
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-mono font-semibold text-white',
            methodColors[method]
          )}
        >
          {method}
        </span>
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {children}
    </div>
  )
}

export function ParamTable({
  params,
}: {
  params: Array<{ name: string; type: string; required?: boolean; description: string }>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-semibold">Parameter</th>
            <th className="text-left py-2 px-3 font-semibold">Type</th>
            <th className="text-left py-2 px-3 font-semibold">Required</th>
            <th className="text-left py-2 px-3 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param.name} className="border-b">
              <td className="py-2 px-3">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{param.name}</code>
              </td>
              <td className="py-2 px-3 text-muted-foreground">{param.type}</td>
              <td className="py-2 px-3">
                {param.required ? (
                  <span className="text-xs text-red-500 font-medium">Required</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </td>
              <td className="py-2 px-3 text-muted-foreground">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResponseExample({ children }: { children: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold mb-2 text-muted-foreground">Response Example:</p>
      <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
        <code className="text-xs font-mono">{children}</code>
      </pre>
    </div>
  )
}
