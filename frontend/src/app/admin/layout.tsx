"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#f6f7fb]">
        <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/90 px-5 shadow-[0_1px_0_#e8eaf0] backdrop-blur lg:ml-64">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#172033] hover:bg-[#eef1f6] lg:hidden"
              aria-label="Open admin menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="font-semibold text-[#172033]">Administration</p>
            <span className="ml-3 rounded-full bg-[#eeecff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5848df]">
              Secure workspace
            </span>
          </div>
        </header>
        <main className="p-5 lg:ml-64 lg:p-8">{children}</main>
      </div>
    </AdminGuard>
  );
}
