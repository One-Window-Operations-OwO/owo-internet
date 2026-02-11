"use client";

import { useRef } from "react";
import { useDraggable } from "./hooks/useDraggable";

interface StickyInfoBoxProps {
    schoolName: string;
    npsn: string;
    starlinkId: string;
    resiNumber: string;
    shipmentStatus: string;
    receivedDate: string;
}

export default function StickyInfoBox({
    schoolName,
    npsn,
    starlinkId,
    resiNumber,
    shipmentStatus,
    receivedDate,
}: StickyInfoBoxProps) {
    const boxRef = useRef<HTMLDivElement>(null!);
    const { position, handleMouseDown } = useDraggable<HTMLDivElement>(
        boxRef,
        "sticky-info-box",
    );

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
                {/* NPSN */}
                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        NPSN
                    </div>
                    <div className="text-lg font-mono text-yellow-500">
                        {npsn || "-"}
                    </div>
                </div>

                {/* Starlink ID */}
                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Starlink ID
                    </div>
                    <div className="text-lg font-mono text-yellow-500">
                        {starlinkId || "-"}
                    </div>
                </div>

                <hr className="border-zinc-700" />

                {/* Resi Number */}
                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Resi Number
                    </div>
                    <div className="text-xs text-white">
                        {resiNumber || "-"}
                    </div>
                </div>

                {/* Shipment Status */}
                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Status
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${shipmentStatus === 'DELIVERED' ? 'bg-green-900/50 text-green-400' :
                            shipmentStatus === 'SHIPPED' ? 'bg-blue-900/50 text-blue-400' :
                                'bg-zinc-800 text-zinc-400'
                        }`}>
                        {shipmentStatus || "-"}
                    </span>
                </div>

                {/* Received Date */}
                <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Received Date
                    </div>
                    <div className="text-xs text-white">
                        {receivedDate || "-"}
                    </div>
                </div>
            </div>
        </div>
    );
}
