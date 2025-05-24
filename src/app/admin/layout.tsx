import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s · Yönetim | Kiler" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware'in yanında ikinci kontrol: rol veritabanından okunur
  await requireAdmin();
  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
