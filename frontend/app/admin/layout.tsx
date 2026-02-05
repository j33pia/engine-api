"use client";

import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNav />
      <main className="pl-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
