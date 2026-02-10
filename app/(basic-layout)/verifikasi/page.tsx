"use client";

import { useEffect, useState } from "react";

interface CutoffItem {
    id: number;
    school_name: string;
    npsn: string;
    resi_number: string;
    starlink_id: string;
    received_date: string;
    verification_status: "REJECTED" | "VERIFIED" | null;
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function VerificationPage() {
    const [data, setData] = useState<CutoffItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem("user_id");
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/cutoff?user_id=${userId}&page=${pagination.page}&limit=${pagination.limit}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const json = await res.json();
                setData(json.data);
                setPagination(prev => ({ ...prev, ...json.pagination }));
            } catch (error) {
                console.error("Error loading verification data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, pagination.page]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const getStatusBadge = (status: string | null) => {
        if (status === 'VERIFIED') {
            return (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Verified
                </span>
            );
        } else if (status === 'REJECTED') {
            return (
                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                    rejected
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/10">
                    Pending
                </span>
            );
        }
    };

    if (!userId) {
        return (
            <div className="p-8 text-center">
                <p className="text-neutral-500">Please log in to view verification data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Verifikasi</h2>
                <p className="mt-1 text-sm text-neutral-500">Kelola dan tinjau data verifikasi.</p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-600">
                        <thead className="bg-neutral-50 text-neutral-900 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">NPSN</th>
                                <th className="px-6 py-4">Nama Sekolah</th>
                                <th className="px-6 py-4">Tanggal Terima</th>
                                <th className="px-6 py-4">Starlink ID</th>
                                <th className="px-6 py-4">Resi</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                        Tidak ada data verifikasi ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                        </td>
                                        <td className="px-6 py-4">{item.npsn}</td>
                                        <td className="px-6 py-4 font-medium text-neutral-900">{item.school_name}</td>
                                        <td className="px-6 py-4">
                                            {new Date(item.received_date).toLocaleDateString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4">{item.starlink_id}</td>
                                        <td className="px-6 py-4">{item.resi_number}</td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.verification_status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && data.length > 0 && (
                    <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                        <p className="text-sm text-neutral-500">
                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                            <span className="font-medium">{pagination.total}</span> results
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="rounded-lg border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="rounded-lg border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
