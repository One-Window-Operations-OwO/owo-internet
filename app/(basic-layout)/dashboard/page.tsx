"use client";

import AdminDashboard from "./_components/AdminDashboard";
import UserDashboard from "./_components/UserDashboard";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-neutral-500">Loading...</div>;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}
