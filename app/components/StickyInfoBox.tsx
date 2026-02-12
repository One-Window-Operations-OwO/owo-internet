"use client";

import { useRef, useState } from "react";
import { useDraggable } from "./hooks/useDraggable";

interface StickyInfoBoxProps {
    schoolName: string;
    npsn: string;
    starlinkId: string;
    resiNumber: string;
    shipmentStatus: string;
    receivedDate: string;
    // New Props for Compatibility
    history?: any[];
    verificationDate?: string;
    setVerificationDate?: (date: string) => void;
}

export default function StickyInfoBox({
    schoolName,
    npsn,
    starlinkId,
    resiNumber,
    shipmentStatus,
    receivedDate,
    history = [],
    verificationDate,
    setVerificationDate,
}: StickyInfoBoxProps) {
    const boxRef = useRef<HTMLDivElement>(null!);
    const { position, handleMouseDown } = useDraggable<HTMLDivElement>(
        boxRef,
        "sticky-info-box",
    );
    const [showHistory, setShowHistory] = useState(true);

    return (
        <div
            ref={boxRef}
            style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                touchAction: "none",
                zIndex: 1000,
                width: "320px",
                borderRadius: "8px",
                fontFamily: "sans-serif",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                backgroundColor: "#18181b",
                border: "2px solid #3f3f46",
            }}
            className="text-zinc-100 flex flex-col max-h-[80vh]"
        >
            {/* Header - Draggable */}
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 18px",
                    cursor: "move",
                    borderBottom: "1px solid #3f3f46",
                    backgroundColor: "#27272a",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                    flexShrink: 0,
                }}
            >
                <span className="font-bold text-yellow-500 text-sm truncate">
                    {schoolName || "-"}
                </span>
            </div>

            {/* Content */}
            <div
                className="p-3 text-sm space-y-3 bg-zinc-900 text-white overflow-y-auto custom-scrollbar rounded-b-lg"
                onClick={(e) => e.stopPropagation()}
            >
                {/* School Info */}
                <div>
                    <div>
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            NPSN
                        </div>
                        <div className="text-lg font-mono text-yellow-500">
                            {npsn || "-"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Starlink ID
                        </div>
                        <div className="text-sm font-mono text-yellow-500 break-all">
                            {starlinkId || "-"}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Status
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${shipmentStatus === 'DELIVERED' ? 'bg-green-900/50 text-green-400' :
                            shipmentStatus === 'SHIPPED' ? 'bg-blue-900/50 text-blue-400' :
                                'bg-zinc-800 text-zinc-400'
                            }`}>
                            {shipmentStatus || "-"}
                        </span>
                    </div>
                </div>

                <hr className="border-zinc-700" />

                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Resi Number
                    </div>
                    <div className="text-xs text-white">
                        {resiNumber || "-"}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Received Date
                    </div>
                    <div className="text-xs text-white">
                        {receivedDate || "-"}
                    </div>
                </div>

                {/* Date Input (Verification Date) */}
                {verificationDate !== undefined && setVerificationDate && (
                    <>
                        <hr className="border-zinc-700" />
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                                Tanggal Verifikasi
                            </label>
                            <input
                                type="date"
                                value={verificationDate}
                                onChange={(e) => setVerificationDate(e.target.value)}
                                onWheel={(e) => {
                                    if (!verificationDate) return;
                                    const currentDate = new Date(verificationDate);
                                    const daysToAdd = e.deltaY > 0 ? -1 : 1;
                                    currentDate.setDate(currentDate.getDate() + daysToAdd);
                                    const year = currentDate.getFullYear();
                                    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
                                    const day = String(currentDate.getDate()).padStart(2, "0");
                                    setVerificationDate(`${year}-${month}-${day}`);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-white focus:outline-none focus:border-yellow-500 text-sm"
                            />
                        </div>
                    </>
                )}

                <hr className="border-zinc-700" />

                {/* History Info */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Riwayat Approval
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 focus:outline-none"
                        >
                            {showHistory ? "Sembunyikan" : "Tampilkan"}
                        </button>
                    </div>

                    {showHistory && (
                        history && history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map((log: any, idx: number) => {
                                    const isVerified = log.status?.toUpperCase() === 'VERIFIED';
                                    const rejections = log.rejections && typeof log.rejections === 'object'
                                        ? Object.entries(log.rejections).map(([k, v]) => `${k}: ${v}`).join(', ')
                                        : null;

                                    return (
                                        <div
                                            key={idx}
                                            className={`border rounded p-2 ${isVerified
                                                ? "bg-green-900/20 border-green-900/50"
                                                : "bg-red-900/20 border-red-900/50"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-400 font-medium">
                                                        {log.username || '-'}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-600 font-mono">
                                                        {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        }) : '-'}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isVerified
                                                        ? "bg-green-900/50 text-green-400"
                                                        : "bg-red-900/50 text-red-400"
                                                        }`}
                                                >
                                                    {log.status}
                                                </span>
                                            </div>
                                            {rejections && (
                                                <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                                    {rejections}
                                                </div>
                                            )}
                                            {log.serial_number && (
                                                <div className="text-[9px] text-zinc-600 mt-0.5 font-mono">
                                                    SN: {log.serial_number}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-xs text-zinc-600 italic">
                                Belum ada riwayat.
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
