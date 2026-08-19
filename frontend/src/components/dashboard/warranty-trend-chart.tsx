"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendDataPoint {
    month: string;
    monthName: string;
    ACTIVE: number;
    EXPIRING_SOON: number;
    EXPIRED: number;
    totalValue: number;
    totalItems: number;
}

interface WarrantyTrendChartProps {
    data: TrendDataPoint[];
}

export function WarrantyTrendChart({ data }: WarrantyTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <p className="text-center text-sm text-[#626773]">
                    No trend data available yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Warranty Status Trend Chart */}
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#0b1c30]">
                        Warranty Status Trend
                    </h3>
                    <p className="text-xs text-[#626773] mt-1">
                        Number of warranties by status over time
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4eb" />
                        <XAxis
                            dataKey="monthName"
                            tick={{ fontSize: 12, fill: "#626773" }}
                            axisLine={{ stroke: "#e2e4eb" }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#626773" }}
                            axisLine={{ stroke: "#e2e4eb" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e4eb",
                                borderRadius: "8px",
                                padding: "12px",
                            }}
                            formatter={(value) => value}
                            labelStyle={{ color: "#0b1c30" }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: "20px" }}
                            iconType="square"
                        />
                        <Bar dataKey="ACTIVE" fill="#10b981" name="Active" radius={[4, 4, 0, 0]} />
                        <Bar
                            dataKey="EXPIRING_SOON"
                            fill="#f59e0b"
                            name="Expiring Soon"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar dataKey="EXPIRED" fill="#ef4444" name="Expired" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Total Warranties Trend Chart */}
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#0b1c30]">
                        Total Warranties Timeline
                    </h3>
                    <p className="text-xs text-[#626773] mt-1">
                        Cumulative warranties expiring by month
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4eb" />
                        <XAxis
                            dataKey="monthName"
                            tick={{ fontSize: 12, fill: "#626773" }}
                            axisLine={{ stroke: "#e2e4eb" }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#626773" }}
                            axisLine={{ stroke: "#e2e4eb" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e4eb",
                                borderRadius: "8px",
                                padding: "12px",
                            }}
                            formatter={(value) => value}
                            labelStyle={{ color: "#0b1c30" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Line
                            type="monotone"
                            dataKey="totalItems"
                            stroke="#5043e8"
                            strokeWidth={3}
                            dot={{ fill: "#5043e8", r: 5 }}
                            activeDot={{ r: 7 }}
                            name="Total Items"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Key Insights */}
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <h3 className="text-sm font-semibold text-[#0b1c30] mb-4">
                    Trend Insights
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Peak Expiry Month",
                            value: data.reduce((max, curr) =>
                                curr.totalItems > max.totalItems ? curr : max
                            )?.monthName,
                            color: "text-[#a81414]",
                        },
                        {
                            label: "Avg. Monthly Items",
                            value: Math.round(
                                data.reduce((sum, curr) => sum + curr.totalItems, 0) / data.length
                            ),
                            color: "text-[#4b41e1]",
                        },
                        {
                            label: "Month Range",
                            value: `${data[0]?.monthName} to ${data[data.length - 1]?.monthName}`,
                            color: "text-[#059669]",
                        },
                    ].map((insight) => (
                        <div
                            key={insight.label}
                            className="rounded-lg bg-[#f9fafb] p-4 border border-[#e2e4eb]"
                        >
                            <p className="text-xs font-semibold text-[#626773]">
                                {insight.label}
                            </p>
                            <p className={`mt-2 text-lg font-semibold ${insight.color}`}>
                                {insight.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
