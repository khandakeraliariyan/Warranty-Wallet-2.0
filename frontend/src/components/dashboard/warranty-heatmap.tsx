"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/auth-context";
import { getWarrantyHeatmap, type WarrantyHeatmapData } from "@/lib/dashboard-api";
import { WarrantyTrendChart } from "./warranty-trend-chart";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
});

const statusColors = {
    ACTIVE: { bg: "bg-[#d1fae5]", text: "text-[#065f46]", icon: "🟢" },
    EXPIRING_SOON: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", icon: "🟡" },
    EXPIRED: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", icon: "🔴" },
};

interface MonthCell {
    month: string;
    monthName: string;
    count: number;
    value: number;
    statusBreakdown: {
        ACTIVE: number;
        EXPIRING_SOON: number;
        EXPIRED: number;
    };
    products: any[];
}

function StatusDot({ status }: { status: string }) {
    const colors = statusColors[status as keyof typeof statusColors] || {
        bg: "bg-gray-100",
        text: "text-gray-600",
    };
    return (
        <div className={`h-2 w-2 rounded-full ${colors.bg} inline-block mr-1`} />
    );
}

function MonthCard({ month }: { month: MonthCell }) {
    const hasExpiringOrExpired =
        month.statusBreakdown.EXPIRING_SOON > 0 ||
        month.statusBreakdown.EXPIRED > 0;

    return (
        <div
            className={`rounded-lg p-4 border transition-all hover:shadow-md cursor-pointer ${hasExpiringOrExpired
                ? "border-[#fee2e2] bg-[#fef8f8]"
                : "border-[#e2e4eb] bg-white"
                }`}
        >
            <div className="mb-3">
                <h3 className="font-semibold text-[#0b1c30] text-sm">{month.monthName}</h3>
                <p className="text-xs text-[#626773] mt-1">
                    {month.count} warranti{month.count === 1 ? "es" : "es"} • {currencyFormatter.format(month.value)}
                </p>
            </div>

            <div className="space-y-2">
                {month.statusBreakdown.ACTIVE > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <StatusDot status="ACTIVE" />
                        <span className="text-[#065f46]">
                            {month.statusBreakdown.ACTIVE} Active
                        </span>
                    </div>
                )}
                {month.statusBreakdown.EXPIRING_SOON > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <StatusDot status="EXPIRING_SOON" />
                        <span className="text-[#92400e]">
                            {month.statusBreakdown.EXPIRING_SOON} Expiring Soon
                        </span>
                    </div>
                )}
                {month.statusBreakdown.EXPIRED > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <StatusDot status="EXPIRED" />
                        <span className="text-[#991b1b]">
                            {month.statusBreakdown.EXPIRED} Expired
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function WarrantyHeatmap() {
    const { firebaseUser } = useAuth();
    const { data, error, isPending } = useQuery<WarrantyHeatmapData>({
        queryKey: ["warranty-heatmap", firebaseUser?.uid],
        enabled: Boolean(firebaseUser),
        queryFn: async () =>
            getWarrantyHeatmap(await firebaseUser!.getIdToken()),
    });

    if (isPending) return <Loading label="Loading warranty heatmap" />;
    if (error)
        return (
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-sm text-red-700">
                {error instanceof Error ? error.message : "Could not load heatmap."}
            </div>
        );
    if (!data) return null;

    const { summary, heatmap, trend } = data;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Warranties",
                        value: summary.totalProducts,
                        icon: "shield",
                        color: "text-[#4b41e1]",
                    },
                    {
                        label: "Portfolio Value",
                        value: currencyFormatter.format(summary.totalValue),
                        icon: "clipboard",
                        color: "text-[#27364b]",
                    },
                    {
                        label: "Value at Risk",
                        value: currencyFormatter.format(summary.valueAtRisk),
                        icon: "warning",
                        color: "text-[#a81414]",
                    },
                    {
                        label: "Health Score",
                        value: `${summary.healthScore}%`,
                        icon: "sparkles",
                        color: "text-[#059669]",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-[#e2e4eb] bg-white p-4"
                    >
                        <div className={`flex items-center gap-2 text-xs font-semibold ${stat.color}`}>
                            <Icon name={stat.icon as any} className="h-5 w-5" />
                            <span>{stat.label}</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-[#07162b]">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <h2 className="text-sm font-semibold text-[#0b1c30] mb-4">
                    Warranty Status Overview
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Active",
                            count: summary.statusCounts.ACTIVE,
                            status: "ACTIVE",
                        },
                        {
                            label: "Expiring Soon",
                            count: summary.statusCounts.EXPIRING_SOON,
                            status: "EXPIRING_SOON",
                        },
                        {
                            label: "Expired",
                            count: summary.statusCounts.EXPIRED,
                            status: "EXPIRED",
                        },
                    ].map((stat) => {
                        const colors =
                            statusColors[stat.status as keyof typeof statusColors];
                        return (
                            <div
                                key={stat.label}
                                className={`rounded-lg p-4 ${colors.bg}`}
                            >
                                <p className={`text-xs font-semibold ${colors.text}`}>
                                    {stat.label}
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[#07162b]">
                                    {stat.count}
                                </p>
                                <p className={`text-xs mt-1 ${colors.text}`}>
                                    {stat.count === 1 ? "item" : "items"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Heatmap Timeline */}
            <div className="rounded-xl border border-[#e2e4eb] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[#0b1c30]">
                            Warranty Expiry Timeline
                        </h2>
                        <p className="text-xs text-[#626773] mt-1">
                            Warranties grouped by month
                        </p>
                    </div>
                    <Link href="/dashboard/assets" className="text-xs font-medium text-[#4b41e1]">
                        View all →
                    </Link>
                </div>

                {heatmap.length > 0 ? (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {heatmap.map((month) => (
                            <MonthCard key={month.month} month={month as MonthCell} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-[#626773] py-8">
                        No warranties to display. Add some products to see the heatmap.
                    </p>
                )}
            </div>

            {/* Trend Chart */}
            {trend && trend.length > 0 && <WarrantyTrendChart data={trend} />}

            {/* Legend */}
            <div className="rounded-xl border border-[#e2e4eb] bg-[#f9fafb] p-4">
                <p className="text-xs font-semibold text-[#626773] mb-3">Legend</p>
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#d1fae5]" />
                        <span className="text-[#065f46]">Active - Full warranty coverage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#fef3c7]" />
                        <span className="text-[#92400e]">Expiring Soon - 30-365 days left</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#fee2e2]" />
                        <span className="text-[#991b1b]">Expired - No coverage</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
