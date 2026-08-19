"use client";

import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/auth-context";
import { getWarrantyHeatmap, type WarrantyHeatmapData } from "@/lib/dashboard-api";
import { Cell, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";

interface WarrantyHeatmapProps {
  healthScoreOverride?: number;
}

const statusColors = {
  ACTIVE: "#10b981",
  EXPIRING_SOON: "#f59e0b",
  EXPIRED: "#ef4444",
};

export function WarrantyHeatmap({ healthScoreOverride }: WarrantyHeatmapProps) {
  const { firebaseUser } = useAuth();
  const { data, error, isPending } = useQuery<WarrantyHeatmapData>({
    queryKey: ["warranty-heatmap", firebaseUser?.uid],
    enabled: Boolean(firebaseUser),
    queryFn: async () => getWarrantyHeatmap(await firebaseUser!.getIdToken()),
  });

  if (isPending) return <Loading label="Loading warranty analytics" />;
  if (error) return <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-sm text-red-700">{error instanceof Error ? error.message : "Could not load analytics."}</div>;
  if (!data) return null;

  const pieData = [
    { name: "Active", value: data.summary.statusCounts.ACTIVE, fill: statusColors.ACTIVE },
    { name: "Expiring Soon", value: data.summary.statusCounts.EXPIRING_SOON, fill: statusColors.EXPIRING_SOON },
    { name: "Expired", value: data.summary.statusCounts.EXPIRED, fill: statusColors.EXPIRED },
  ].filter((item) => item.value > 0);

  const trendData = data.trend.map((entry) => ({
    ...entry,
    healthScore: healthScoreOverride ?? data.summary.healthScore,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[#e2e4eb] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#0b1c30]">Warranty status share</h2>
        <p className="mt-1 text-xs text-[#626773]">Current distribution of active, expiring, and expired warranties.</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={3}>
              {pieData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl border border-[#e2e4eb] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#0b1c30]">Warranty trend</h2>
        <p className="mt-1 text-xs text-[#626773]">Monthly movement in warranty counts.</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e4eb" />
            <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: "#626773" }} axisLine={{ stroke: "#e2e4eb" }} />
            <YAxis tick={{ fontSize: 12, fill: "#626773" }} axisLine={{ stroke: "#e2e4eb" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="EXPIRING_SOON" fill="#f59e0b" name="Expiring soon" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="totalItems" stroke="#5043e8" strokeWidth={3} dot={{ r: 4 }} name="Total items" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
