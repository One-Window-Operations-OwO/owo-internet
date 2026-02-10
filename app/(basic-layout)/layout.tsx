import Link from "next/link";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value;
  const isAdmin = userRole === "admin";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`w-72 border-r hidden md:flex flex-col fixed inset-y-0 z-50 ${isAdmin ? "bg-zinc-900 border-zinc-800" : "bg-white border-neutral-200"}`}
      >
        <div
          className={`p-6 border-b ${isAdmin ? "border-zinc-800" : "border-neutral-100"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? "bg-red-600" : "bg-blue-600"}`}
            >
              <span className="text-white font-bold">
                {isAdmin ? "A" : "O"}
              </span>
            </div>
            <h1
              className={`text-xl font-bold tracking-tight ${isAdmin ? "text-white" : "text-neutral-900"}`}
            >
              {isAdmin ? "Admin Panel" : "OwO Internet"}
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div
            className={`px-2 py-2 text-xs font-semibold uppercase tracking-wider ${isAdmin ? "text-zinc-500" : "text-neutral-400"}`}
          >
            {isAdmin ? "Management" : "Menu Utama"}
          </div>

          <Link
            href="/dashboard"
            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              isAdmin
                ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                : "text-neutral-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            <span
              className={`w-5 h-5 mr-3 group-hover:${isAdmin ? "text-red-500" : "text-blue-500"} ${isAdmin ? "text-zinc-500" : "text-neutral-400"}`}
            >
              {/* Dashboard Icon */}
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </span>
            Dashboard
          </Link>

          {!isAdmin && (
            <Link
              href="/verifikasi"
              className="group flex items-center px-3 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <span className="w-5 h-5 mr-3 text-neutral-400 group-hover:text-blue-500">
                {/* Verification Icon */}
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              Verifikasi
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin/users"
              className="group flex items-center px-3 py-2.5 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-all duration-200"
            >
              <span className="w-5 h-5 mr-3 text-zinc-500 group-hover:text-red-500">
                {/* User Icon */}
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </span>
              Users List
            </Link>
          )}
        </nav>

        {/* <div className="p-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">Admin User</p>
                            <p className="text-xs text-neutral-500 truncate">admin@owo.com</p>
                        </div>
                    </div>
                </div> */}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white border-b border-neutral-200 flex items-center px-4 sticky top-0 z-40">
          <h1 className="font-bold text-lg">OwO Internet</h1>
        </div>

        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
