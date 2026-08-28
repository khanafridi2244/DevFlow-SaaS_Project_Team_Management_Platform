import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { WeeklySeries } from "@/lib/analytics";

export function WeeklyTrendChart({ data }: { data: WeeklySeries[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.weekStart), "MMM d"),
  }));

  return (
    <div className="rounded-lg border border-line bg-white/[0.02] p-4">
      <h3 className="mb-4 text-sm font-medium text-paper/70">Tasks completed per week</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#F7F7F566", fontSize: 11, fontFamily: "JetBrains Mono" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#F7F7F566", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0E1116",
              border: "1px solid #2A2E37",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#4F7CFF"
            strokeWidth={2}
            dot={{ fill: "#4F7CFF", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}