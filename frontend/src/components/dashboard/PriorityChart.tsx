import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TasksByPriority } from "@/lib/analytics";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6B7280",
  MEDIUM: "#4F7CFF",
  HIGH: "#E6A23C",
  URGENT: "#EF4444",
};

export function PriorityChart({ data }: { data: TasksByPriority }) {
  const chartData = Object.entries(data).map(([priority, count]) => ({ priority, count }));

  return (
    <div className="rounded-lg border border-line bg-white/[0.02] p-4">
      <h3 className="mb-4 text-sm font-medium text-paper/70">Tasks by priority</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="priority"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#F7F7F566", fontSize: 11, fontFamily: "JetBrains Mono" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#F7F7F566", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "#FFFFFF08" }}
            contentStyle={{
              backgroundColor: "#0E1116",
              border: "1px solid #2A2E37",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}