import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

type MetricCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend
}: MetricCardProps) {
  return (
    <Card className="bg-linear-to-b from-primary/10 to-white dark:to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  trend.value >= 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
          {description && !trend && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
