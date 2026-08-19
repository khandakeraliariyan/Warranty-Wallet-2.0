export type DashboardData = {
  products: { total: number; active: number; expiringSoon: number; expired: number };
  purchaseValue: string | number;
  documents: {
    total: number;
    aiProcessing: number;
    recent: Array<{
      id: string;
      fileName: string;
      fileType: string;
      ocrProcessed: boolean;
      createdAt: string;
      product: { id: string; name: string };
    }>;
  };
  claims: { open: number };
  warrantyHealth: number;
  warrantyTimeline: Array<{
    id: string;
    name: string;
    expiryDate: string;
    warrantyStatus: string;
  }>;
  notifications: { total: number; unread: number };
  plan: "BASIC" | "PLUS" | "PRO";
};

export type WarrantyHeatmapData = {
  summary: {
    totalProducts: number;
    totalValue: number;
    valueAtRisk: number;
    healthScore: number;
    statusCounts: {
      ACTIVE: number;
      EXPIRING_SOON: number;
      EXPIRED: number;
      NO_WARRANTY: number;
    };
  };
  heatmap: Array<{
    month: string;
    monthName: string;
    date: string;
    count: number;
    value: number;
    statusBreakdown: {
      ACTIVE: number;
      EXPIRING_SOON: number;
      EXPIRED: number;
    };
    products: Array<{
      id: string;
      name: string;
      brand: string;
      category: string;
      purchasePrice: number;
      expiryDate: string;
      warrantyStatus: string;
      daysUntilExpiry: number;
    }>;
  }>;
  trend: Array<{
    month: string;
    monthName: string;
    ACTIVE: number;
    EXPIRING_SOON: number;
    EXPIRED: number;
    totalValue: number;
    totalItems: number;
  }>;
};

export async function getDashboard(token: string) {
  return apiRequest<DashboardData>("/dashboard", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getWarrantyHeatmap(token: string) {
  return apiRequest<WarrantyHeatmapData>("/dashboard/warranty-heatmap", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
}

import { apiRequest } from "@/lib/api-client";
