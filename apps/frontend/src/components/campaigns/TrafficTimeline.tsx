import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

type TimelineData = {
  date: string
  visits: number
  conversions: number
  revenue: string
}

type TrafficTimelineProps = {
  data: TimelineData[]
}

const chartConfig = {
  visits: {
    label: 'Visits',
    color: 'oklch(var(--primary))',
  },
  conversions: {
    label: 'Conversions',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
} satisfies ChartConfig

export function TrafficTimeline({ data }: TrafficTimelineProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            No traffic data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    visits: item.visits,
    conversions: item.conversions,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Traffic Timeline</CardTitle>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-1 text-xs hover:bg-accent">
              7D
            </button>
            <button className="rounded-lg border bg-primary px-3 py-1 text-xs text-primary-foreground">
              30D
            </button>
            <button className="rounded-lg border px-3 py-1 text-xs hover:bg-accent">
              90D
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="var(--color-visits)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke="var(--color-conversions)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
