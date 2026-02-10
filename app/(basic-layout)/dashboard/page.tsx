import { cookies } from "next/headers";
import AdminDashboard from "./_components/AdminDashboard";
import UserDashboard from "./_components/UserDashboard";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value;
  const isAdmin = userRole === "admin";

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}
