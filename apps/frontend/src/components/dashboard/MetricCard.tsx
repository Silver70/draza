import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { LucideIcon } from 'lucide-react'

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

export function MetricCard({ title, value, icon: Icon, description, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              <span
                className={
                  trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="ml-1 text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
