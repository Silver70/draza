import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'

type PlatformData = {
  platform: string
  revenue: number
  visits: number
  conversions: number
}

type PlatformPerformanceProps = {
  data: PlatformData[]
}

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return '#E4405F'
    case 'facebook':
      return '#1877F2'
    case 'tiktok':
      return '#000000'
    case 'youtube':
      return '#FF0000'
    case 'twitter':
      return '#1DA1F2'
    case 'multi':
      return '#9333EA'
    default:
      return 'oklch(var(--primary))'
  }
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
  },
} satisfies ChartConfig

export function PlatformPerformance({ data }: PlatformPerformanceProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No platform data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.revenue,
    fill: getPlatformColor(item.platform),
  }))

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `$${Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  }
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold">
            ${totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
