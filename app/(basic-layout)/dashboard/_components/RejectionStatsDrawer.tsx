"use client";
import { useEffect, useState } from "react";

interface SubCluster {
    sub_cluster: string;
    count: number;
}

interface MainCluster {
    main_cluster: string;
    total: number;
    sub_clusters: SubCluster[];
}

interface RejectionStatsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RejectionStatsDrawer({
    isOpen,
    onClose,
}: RejectionStatsDrawerProps) {
    const [stats, setStats] = useState<MainCluster[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
        new Set()
    );

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        fetch("/api/dashboard/rejection-stats")
            .then((r) => r.json())
            .then((json) => {
                if (json.success) setStats(json.data);
            })
            .catch((e) => console.error("Failed to fetch rejection stats", e))
            .finally(() => setLoading(false));
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    const toggleCluster = (name: string) => {
        setExpandedClusters((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const totalRejections = stats.reduce((s, c) => s + c.total, 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl border-l border-neutral-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Statistik Penolakan
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
                            Data berdasarkan log berstatus{" "}
                            <span className="font-semibold text-red-500">REJECTED</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 hover:text-neutral-600 dark:hover:text-zinc-200 transition-colors"
                        aria-label="Tutup"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Summary Bar */}
                {!loading && stats.length > 0 && (
                    <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                {totalRejections.toLocaleString()} total penolakan
                            </p>
                            <p className="text-xs text-red-500 dark:text-red-500">
                                dari {stats.length} kategori
                            </p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col gap-3 mt-4">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 rounded-xl bg-neutral-100 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-zinc-500">
                            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">Tidak ada data penolakan</p>
                        </div>
                    ) : (
                        stats.map((cluster) => {
                            const isExpanded = expandedClusters.has(cluster.main_cluster);
                            const percentage =
                                totalRejections > 0
                                    ? ((cluster.total / totalRejections) * 100).toFixed(1)
                                    : "0";

                            return (
                                <div
                                    key={cluster.main_cluster}
                                    className="rounded-xl border border-neutral-200 dark:border-zinc-800 overflow-hidden"
                                >
                                    {/* Main cluster row */}
                                    <button
                                        onClick={() => toggleCluster(cluster.main_cluster)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-red-500" />
                                            <span className="text-sm font-semibold text-neutral-800 dark:text-zinc-200 truncate">
                                                {cluster.main_cluster}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                                                    {cluster.total.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-neutral-400 dark:text-zinc-500 ml-1">
                                                    ({percentage}%)
                                                </span>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                                />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Progress bar */}
                                    <div className="h-1 bg-neutral-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full bg-red-400 dark:bg-red-500 transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>

                                    {/* Sub-clusters */}
                                    {isExpanded && (
                                        <div className="bg-neutral-50 dark:bg-zinc-950 border-t border-neutral-100 dark:border-zinc-800 divide-y divide-neutral-100 dark:divide-zinc-800">
                                            {cluster.sub_clusters.map((sub) => {
                                                const subPct =
                                                    cluster.total > 0
                                                        ? ((sub.count / cluster.total) * 100).toFixed(1)
                                                        : "0";
                                                return (
                                                    <div
                                                        key={sub.sub_cluster}
                                                        className="flex items-center justify-between px-4 py-2.5 gap-3"
                                                    >
                                                        <span className="text-xs text-neutral-600 dark:text-zinc-400 flex-1 min-w-0 leading-relaxed">
                                                            {sub.sub_cluster}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {/* Mini bar */}
                                                            <div className="w-16 h-1.5 bg-neutral-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-red-400 dark:bg-red-500 rounded-full"
                                                                    style={{ width: `${subPct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300 tabular-nums w-6 text-right">
                                                                {sub.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950">
                    <p className="text-xs text-neutral-400 dark:text-zinc-500 text-center">
                        Klik pada kategori untuk melihat detail sub-cluster
                    </p>
                </div>
            </div>
        </>
    );
}
