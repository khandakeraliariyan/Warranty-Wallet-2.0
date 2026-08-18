"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { WarrantyHeatmap } from "@/components/dashboard/warranty-heatmap";

export default function WarrantyAnalyticsPage() {
    return (
        <div className="mx-auto w-full max-w-[1440px] pb-8">
            <header className="mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#4b41e1] hover:text-[#3d2fd9]"
                    >
                        <Icon name="arrow-left" className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
                <h1 className="text-3xl font-semibold tracking-[-.035em] text-[#0b1c30] mt-4">
                    Warranty Analytics
                </h1>
                <p className="mt-1 text-sm text-[#45464d]">
                    Visualize your warranty portfolio and expiry timeline
                </p>
            </header>

            <WarrantyHeatmap />
        </div>
    );
}
