import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'

// Dummy data for customer acquisition by month
// TODO: Replace with real data from backend API when available
const customerData = [
  { month: 'Jul', customers: 42 },
  { month: 'Aug', customers: 58 },
  { month: 'Sep', customers: 73 },
  { month: 'Oct', customers: 65 },
  { month: 'Nov', customers: 89 },
  { month: 'Dec', customers: 102 },
]

const chartConfig = {
  customers: {
    label: 'New Customers',
    color: 'oklch(var(--primary))',
  },
} satisfies ChartConfig

export function CustomerGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Growth</CardTitle>
        <CardDescription>New customers acquired each month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={customerData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">New Customers:</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="customers"
              fill="url(#fillCustomers)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
