"use client";

import { useState } from "react";
import { Cluster } from "../owo/page";
import ProcessStatusLight, { ProcessStatus } from "./ProcessStatusLight";

interface RadioOptionProps {
    label: string;
    checked: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    isDanger?: boolean;
}

const RadioOption = ({ label, checked, onClick, onDoubleClick, isDanger }: RadioOptionProps) => (
    <button
        type="button"
        onClick={onClick}
        onDoubleClick={(e) => {
            e.preventDefault();
            onDoubleClick();
        }}
        className={`px-3 py-1 text-xs rounded-full border transition-colors mb-1 mr-1
            ${checked
                ? isDanger
                    ? "bg-red-600 border-red-600 text-white font-semibold"
                    : "bg-blue-500 border-blue-500 text-white font-semibold"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"
            }`}
    >
        {label}
    </button>
);

interface SidebarProps {
    currentIndex: number;
    totalItems: number;
    clusters: Cluster[];
    selectedRejections: Record<string, string>;
    setSelectedRejections: (val: Record<string, string>) => void;
    customReason: string;
    setCustomReason: (val: string) => void;
    onSubmit: () => void;
    onSkip: () => void;
    isSubmitting?: boolean;
    // New props
    processingStatus?: ProcessStatus;
    errorMessage?: string;
    onRetry?: () => void;
    position: "left" | "right";
    setPosition: (pos: "left" | "right") => void;

    // New fields
    tanggalBapp: string;
    setTanggalBapp: (val: string) => void;
    manualSerialNumber: string;
    setManualSerialNumber: (val: string) => void;
}

export default function Sidebar({
    currentIndex,
    totalItems,
    clusters,
    selectedRejections,
    setSelectedRejections,
    customReason,
    setCustomReason,
    onSubmit,
    onSkip,
    isSubmitting = false,
    processingStatus = "idle",
    errorMessage = "",
    onRetry,
    position,
    setPosition,
    tanggalBapp,
    setTanggalBapp,
    manualSerialNumber,
    setManualSerialNumber,
}: SidebarProps) {
    const hasRejections = Object.keys(selectedRejections).length > 0 || !!customReason;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Check if "Serial Number BAPP" is rejected
    const isSerialNumberMismatch = Object.entries(selectedRejections).some(([main, sub]) =>
        main === 'Serial Number BAPP' && Boolean(sub)
    );

    // Group clusters by main_cluster
    const grouped = clusters.reduce((acc, cluster) => {
        if (!acc[cluster.main_cluster]) acc[cluster.main_cluster] = [];
        acc[cluster.main_cluster].push(cluster);
        return acc;
    }, {} as Record<string, Cluster[]>);

    const handleSelect = (mainCluster: string, subCluster: string) => {
        const newRejections = { ...selectedRejections, [mainCluster]: subCluster };
        setSelectedRejections(newRejections);
        setCustomReason(Object.values(newRejections).join('; '));
    };

    const handleDeselect = (mainCluster: string) => {
        const newRejections = { ...selectedRejections };
        delete newRejections[mainCluster];
        setSelectedRejections(newRejections);
        setCustomReason(Object.values(newRejections).join('; '));
    };

    const mainButtonLabel = hasRejections ? "REJECT" : "VERIFY";
    const mainButtonColor = hasRejections
        ? "bg-red-600 hover:bg-red-500"
        : "bg-green-600 hover:bg-green-500";

    return (
        <aside className="w-96 bg-gray-800 text-white flex-shrink-0 flex flex-col p-4 h-full overflow-hidden border-r border-gray-700 relative">
            {/* Process Status Light */}
            <div className="mb-4">
                <ProcessStatusLight
                    status={processingStatus}
                    errorMessage={errorMessage}
                    onRetry={onRetry}
                />
            </div>

            {/* Tanggal Pengecekan Input */}
            <div className="mb-4 flex-shrink-0">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Tanggal Pengecekan
                </label>
                <input
                    type="date"
                    className="block w-full rounded-md bg-gray-900 border border-gray-600 py-1.5 px-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 text-xs leading-5"
                    value={tanggalBapp}
                    onChange={(e) => setTanggalBapp(e.target.value)}
                />
            </div>

            {/* Conditional Serial Number Input */}
            {isSerialNumberMismatch && (
                <div className="mb-4 flex-shrink-0">
                    <label className="text-xs font-semibold text-yellow-500 uppercase tracking-wider block mb-1">
                        Input Serial Number (Manual)
                    </label>
                    <input
                        type="text"
                        className="block w-full rounded-md bg-gray-900 border border-yellow-500 py-1.5 px-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400 text-xs leading-5"
                        placeholder="Enter correct SN..."
                        value={manualSerialNumber}
                        onChange={(e) => setManualSerialNumber(e.target.value)}
                    />
                </div>
            )}


            {/* Clusters / Rejection Options (Scrollable) */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {Object.keys(grouped).length === 0 ? (
                    <div className="text-gray-500 text-sm text-center mt-10">
                        Loading options...
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {Object.entries(grouped).map(([mainCluster, items]) => (
                            <div key={mainCluster} className="text-left text-xs">
                                <label className="font-semibold text-gray-300 block mb-1">
                                    {mainCluster}
                                </label>
                                <div className="flex flex-wrap gap-1">
                                    {/* Default "Sesuai" button */}
                                    <button
                                        type="button"
                                        onClick={() => handleDeselect(mainCluster)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors mb-1 mr-1
                                            ${!selectedRejections[mainCluster]
                                                ? "bg-green-600 border-green-600 text-white font-semibold"
                                                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"
                                            }`}
                                    >
                                        Sesuai
                                    </button>
                                    {items.map(item => (
                                        <RadioOption
                                            key={item.id}
                                            label={item.nama_opsi}
                                            checked={selectedRejections[mainCluster] === item.sub_cluster}
                                            onClick={() => handleSelect(mainCluster, item.sub_cluster)}
                                            onDoubleClick={() => handleDeselect(mainCluster)}
                                            isDanger
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-700 pt-3 mt-2 flex-shrink-0">
                {/* Rejection Reason Textarea */}
                <div className="mb-4 flex-shrink-0">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                        Rejection Reason
                    </label>
                    <textarea
                        rows={3}
                        className="block w-full rounded-md bg-gray-900 border border-gray-600 py-1.5 px-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 text-xs leading-5"
                        placeholder="Select below or type..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                {/* Compact Info Row */}
                <div className="flex items-center justify-between mb-3 bg-gray-900/50 p-2 rounded border border-gray-700">
                    <div className="flex items-center gap-2 select-none">
                        <span className="text-xs text-gray-400">Progress:</span>
                        <span className="text-sm font-bold text-white">
                            {currentIndex + 1}/{totalItems}
                        </span>
                    </div>

                    {/* Options Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 hover:bg-gray-700 rounded-full transition-colors focus:outline-none text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                            </svg>
                        </button>

                        {/* Options Dropdown */}
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute right-0 bottom-full mb-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
                                    {/* Layout Toggle */}
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-gray-400 block mb-2">
                                            Layout Position
                                        </label>
                                        <div className="flex bg-gray-900 p-1 rounded border border-gray-600">
                                            <button
                                                onClick={() => setPosition("left")}
                                                className={`flex-1 py-1 text-xs rounded transition-all ${position === "left"
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-400 hover:text-gray-200"
                                                    }`}
                                            >
                                                Left
                                            </button>
                                            <button
                                                onClick={() => setPosition("right")}
                                                className={`flex-1 py-1 text-xs rounded transition-all ${position === "right"
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-400 hover:text-gray-200"
                                                    }`}
                                            >
                                                Right
                                            </button>
                                        </div>
                                    </div>

                                    {/* Logout Button */}
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to logout? This will clear all local session data.")) {
                                                localStorage.clear();
                                                window.location.reload();
                                            }
                                        }}
                                        className="w-full p-2 bg-red-700/20 hover:bg-red-900/40 text-red-300 hover:text-red-200 text-xs rounded border border-red-800/50 hover:border-red-700 transition-colors"
                                    >
                                        LOGOUT & CLEAR DATA
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onSkip}
                        disabled={isSubmitting}
                        className={`flex-1 p-3 bg-gray-500 rounded-md text-white font-bold hover:bg-gray-400 disabled:opacity-50 transition-colors ${isSubmitting ? "animate-pulse" : ""
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
                        ) : (
                            "SKIP"
                        )}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 p-3 rounded-md text-white font-bold disabled:opacity-50 transition-colors ${mainButtonColor} ${isSubmitting ? "animate-pulse" : ""
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
                        ) : (
                            mainButtonLabel
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
