import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Pusat kontrol sistem (Admin View).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">Total User</h3>
          <p className="mt-2 text-3xl font-bold text-neutral-900">-</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Verifikasi Pending
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-600">-</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Total Revenue
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600">--</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Quick Actions
        </h3>
        <div className="flex gap-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Manage Users
          </Link>
          <button className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
