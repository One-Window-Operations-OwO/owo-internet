import Link from "next/link";
import { useEffect, useState } from "react";

export default function UserDashboard() {
  const [data, setData] = useState({
    total_data: "-",
    pending_verification: "-",
    verifikasi_selesai: "-",
    verifikasi_ditolak: "-"
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData({
            total_data: json.total_data ?? "-",
            pending_verification: json.pending_verification ?? "-",
            verifikasi_selesai: json.verifikasi_selesai ?? "-",
            verifikasi_ditolak: json.verifikasi_ditolak ?? "-"
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
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-zinc-400">
          Selamat datang kembali! Apa yang ingin Anda kerjakan hari ini?
        </p>
      </div>

      {/* Start Work Action Card */}
      <div className="grid gap-6 md:grid-cols-1 mb-8">
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 22.5 12 13.5H3.75z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Mulai Pengerjaan
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400">
            Akses workspace utama untuk memulai verifikasi dan input data.
          </p>
          <div className="mt-6 md:w-1/3">
            <Link href="/owo" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-500 w-full">
              Start Kerjakan
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Status Pekerjaan Anda
      </h3>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">Total Data</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-500">{data.total_data}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">Sedang Proses</h3>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{data.pending_verification}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">BAPP Diterima</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">{data.verifikasi_selesai}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-colors">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-zinc-400">BAPP Ditolak</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">{data.verifikasi_ditolak}</p>
        </div>
      </div>
    </div>
  );
}
