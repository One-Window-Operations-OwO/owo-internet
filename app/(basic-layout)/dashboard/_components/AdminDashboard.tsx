"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface UserKpi {
  id: number;
  name: string;
  total_data: number;
  pending_verification: number;
  verifikasi_selesai: number;
  verifikasi_ditolak: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<{
    total_users: string | number;
    total_data: string | number;
    pending_verification: string | number;
    verifikasi_selesai: string | number;
    verifikasi_ditolak: string | number;
    user_kpis: UserKpi[];
  }>({
    total_users: "-",
    total_data: "-",
    pending_verification: "-",
    verifikasi_selesai: "-",
    verifikasi_ditolak: "-",
    user_kpis: [],
  });

  const { user } = useAuth();
  const isLocalFallback = !user?.scope;

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData({
            total_users: json.total_users ?? "-",
            total_data: json.total_data ?? "-",
            pending_verification: json.pending_verification ?? "-",
            verifikasi_selesai: json.verifikasi_selesai ?? "-",
            verifikasi_ditolak: json.verifikasi_ditolak ?? "-",
            user_kpis: json.user_kpis ?? [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-zinc-400">
          Pusat kontrol sistem (Admin View).
        </p>
      </div>

      {/* Start Work Action Card */}
      {!isLocalFallback && (
        <div className="grid gap-6 md:grid-cols-1 mb-8">
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 22.5 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Mulai Pengerjaan
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400">
              Akses workspace utama untuk memulai atau meninjau verifikasi data.
            </p>
            <div className="mt-6 md:w-1/3">
              <Link
                href="/owo"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-500 w-full"
              >
                Masuk ke Workspace
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Status Keseluruhan Sistem
      </h3>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-neutral-200 dark:border-zinc-800 transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            Total User
          </h3>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {data.total_users}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-neutral-200 dark:border-zinc-800 transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            Total Data
          </h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-500">
            {data.total_data}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-neutral-200 dark:border-zinc-800 transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            Sedang Proses
          </h3>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {data.pending_verification}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-neutral-200 dark:border-zinc-800 transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            BAPP Diterima
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">
            {data.verifikasi_selesai}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-neutral-200 dark:border-zinc-800 transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            BAPP Ditolak
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">
            {data.verifikasi_ditolak}
          </p>
        </div>
      </div>

      <div className="mt-12 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Performa Scanner (User KPIs)
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-zinc-400">
            Pantau kinerja setiap akun scanner secara real-time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              const headers = [
                "Nama User",
                "Total Data",
                "Pemeriksaan Fisik Sesuai",
                "Sudah Dikerjakan",
                "Belum Dikerjakan",
              ];
              const rows = data.user_kpis
                .filter(
                  (kpi) =>
                    kpi.name &&
                    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((kpi) => [
                  kpi.name,
                  kpi.total_data,
                  kpi.verifikasi_selesai,
                  kpi.verifikasi_selesai + kpi.verifikasi_ditolak,
                  kpi.pending_verification,
                ]);
              const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute(
                "download",
                `user_kpis_${new Date().toISOString().slice(0, 10)}.csv`,
              );
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-zinc-300 transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-800/80"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-zinc-800">
            <thead className="bg-neutral-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                  Nama User
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Data
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50/50 dark:bg-emerald-900/10">
                  Pemeriksaan Fisik Sesuai
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Sudah Dikerjakan
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
                  Belum Dikerjakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/50">
              {data.user_kpis
                .filter(
                  (kpi) =>
                    kpi.name &&
                    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((kpi) => {
                  const sudahDikerjakan =
                    kpi.verifikasi_selesai + kpi.verifikasi_ditolak;
                  return (
                    <tr
                      key={kpi.id}
                      className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 text-neutral-600 dark:text-zinc-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-xs font-bold">
                          {kpi.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-lg font-medium">
                        {(kpi.total_data || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right bg-emerald-50/30 dark:bg-emerald-900/5">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums text-lg">
                            {(kpi.verifikasi_selesai || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {kpi.total_data > 0
                              ? (
                                  ((kpi.verifikasi_selesai || 0) /
                                    kpi.total_data) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                            {(sudahDikerjakan || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {kpi.total_data > 0
                              ? (
                                  ((sudahDikerjakan || 0) / kpi.total_data) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-400 tabular-nums">
                        {(kpi.pending_verification || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              {data.user_kpis.filter(
                (kpi) =>
                  kpi.name &&
                  kpi.name.toLowerCase().includes(searchTerm.toLowerCase()),
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-neutral-500 dark:text-zinc-400"
                  >
                    Tidak ada data KPI user yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
