import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import { RevenueTrend } from '~/types/analyticsTypes'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'oklch(var(--primary))',
  },
} satisfies ChartConfig

type SalesTrendChartProps = {
  data: RevenueTrend[]
  period: 'day' | 'week' | 'month'
}

export function SalesTrendChart({ data, period }: SalesTrendChartProps) {
  // Format date based on period
  const formatDate = (dateString: string) => {
    if (period === 'week') {
      const week = dateString.split('-')[1]
      return `W${week}`
    } else if (period === 'month') {
      const [year, month] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short' })
    } else {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Transform data for the chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: formatDate(item.date),
      revenue: parseFloat(item.revenue),
      orders: item.orderCount,
    }))
  }, [data, period])

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>No sales data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Create some orders to see your sales trends
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Your sales statistic report</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Week ${value}`}
                  formatter={(value, _name, item) => (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium">Revenue:</span>
                        <span className="font-bold">${value}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Orders:</span>
                        <span className="font-medium">{item.payload.orders}</span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#fillRevenue)"
              dot={chartData.length === 1 ? { fill: 'var(--primary)', r: 6 } : false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
