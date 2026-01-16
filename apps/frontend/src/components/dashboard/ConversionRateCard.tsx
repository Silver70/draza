import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

type ConversionRateCardProps = {
  rate: number // Percentage (0-100)
  trend?: {
    value: number
    label: string
  }
}

export function ConversionRateCard({ rate, trend }: ConversionRateCardProps) {
  // Calculate circle properties
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (rate / 100) * circumference

  return (
    <Card className="bg-linear-to-b from-primary/10 to-white dark:to-background">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Conversion Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Circular gauge */}
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-full w-full -rotate-90 transform">
              {/* Background circle - remaining portion */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{rate}%</span>
              <span className="text-xs text-muted-foreground">{(100 - rate).toFixed(1)}% left</span>
            </div>
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex flex-col gap-1">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
