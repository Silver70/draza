import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Dot,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { RevenueTrend } from '~/types/analyticsTypes'

type SalesTrendChartProps = {
  data: RevenueTrend[]
  period: 'day' | 'week' | 'month'
}

export function SalesTrendChart({ data, period }: SalesTrendChartProps) {
  // Format date based on period
  const formatDate = (dateString: string) => {
    if (period === 'week') {
      // Format IYYY-IW to "Week 01"
      const week = dateString.split('-')[1]
      return `W${week}`
    } else if (period === 'month') {
      // Format YYYY-MM to "Jan", "Feb", etc.
      const [year, month] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short' })
    } else {
      // Format YYYY-MM-DD to "Jan 15"
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Transform data for the chart
  const chartData = useMemo(() => {
    const transformed = data.map((item) => ({
      date: formatDate(item.date),
      revenue: parseFloat(item.revenue),
      orders: item.orderCount,
    }))
    console.log('Chart Data:', transformed)
    return transformed
  }, [data, period])

  // Calculate total revenue for description
  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + parseFloat(item.revenue), 0).toFixed(2)
  }, [data])

  // Check if we have any data
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>
            No sales data available yet
          </CardDescription>
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
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
        <CardDescription>
          Revenue over time - Total: ${totalRevenue}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">
                            Revenue:
                          </span>
                          <span className="text-sm font-bold">
                            ${payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">
                            Orders:
                          </span>
                          <span className="text-sm font-bold">
                            {payload[0].payload.orders}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={chartData.length === 1 ? { fill: "hsl(var(--primary))", r: 6 } : false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
