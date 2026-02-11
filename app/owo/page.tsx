"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';

// Dynamically import PdfViewer with SSR disabled to avoid DOMMatrix error
const PdfViewer = dynamic(() => import('../components/PdfViewer'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">Loading viewer...</div>
});

interface BappItem {
    id: number;
    shipment_id: number;
    shipment_status: string;
    school_name: string;
    npsn: string;
    resi_number: string;
    starlink_id: string;
    received_date: string;
    created_at: string;
    user_id: number;
}

interface EvidenceItem {
    id: number;
    shipment_id: number;
    file_path: string;
    category: string;
    uploaded_by: string;
    created_at: string;
    rejection_id: number | null;
    fix_id: number | null;
}

interface ShipmentDetail {
    shipment: any;
    evidences: {
        data: EvidenceItem[];
    };
}

export default function OwoPage() {
    const [queue, setQueue] = useState<BappItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentDetail, setCurrentDetail] = useState<ShipmentDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image Modal State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    // PDF Modal State
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
    const [pdfPageNumber, setPdfPageNumber] = useState(1);
    const [pdfZoom, setPdfZoom] = useState(1);
    const [pdfRotation, setPdfRotation] = useState(0);

    // Fetch the list of items for the workspace
    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const userId = localStorage.getItem("user_id");
                if (!userId) {
                    setError("User ID not found. Please login.");
                    setLoadingList(false);
                    return;
                }

                const res = await fetch(`/api/fetch-bapp-list?user_id=${userId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch workspace list");
                }
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setQueue(data.data);
                } else {
                    setQueue([]);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoadingList(false);
            }
        };

        fetchQueue();
    }, []);

    // Fetch details when the current item changes
    useEffect(() => {
        const fetchDetail = async () => {
            if (queue.length === 0 || currentIndex >= queue.length) {
                setCurrentDetail(null);
                return;
            }

            const item = queue[currentIndex];
            setLoadingDetail(true);
            try {
                const res = await fetch(`/api/fetch-data?id=${item.shipment_id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`Failed to fetch details for shipment ${item.shipment_id}`);
                }
                const data = await res.json();
                setCurrentDetail(data);
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchDetail();
    }, [queue, currentIndex]);

    const handleNext = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(queue.length);
        }
    };

    const openImageModal = (url: string) => {
        setSelectedImage(url);
        setZoom(1);
        setRotation(0);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
    const handleRotateLeft = () => setRotation(prev => prev - 90);
    const handleRotateRight = () => setRotation(prev => prev + 90);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    // PDF Handlers
    const openPdfModal = (url: string) => {
        setSelectedPdf(url);
        setPdfPageNumber(1);
        setPdfZoom(1);
        setPdfRotation(0);
        setPdfNumPages(null);
    };

    const closePdfModal = () => {
        setSelectedPdf(null);
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setPdfNumPages(numPages);
    }

    const changePdfPage = (offset: number) => {
        setPdfPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            return Math.max(1, Math.min(newPage, pdfNumPages || 1));
        });
    };

    const handlePdfZoomIn = () => setPdfZoom(prev => Math.min(prev + 0.25, 3));
    const handlePdfZoomOut = () => setPdfZoom(prev => Math.max(prev - 0.25, 0.5));
    const handlePdfRotateLeft = () => setPdfRotation(prev => prev - 90);
    const handlePdfRotateRight = () => setPdfRotation(prev => prev + 90);
    const handlePdfReset = () => {
        setPdfZoom(1);
        setPdfRotation(0);
        setPdfPageNumber(1);
    };


    if (loadingList) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl bg-red-50 p-6 text-red-800 border border-red-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold">Error Occurred</h3>
                </div>
                <p className="mt-2 ml-9 text-sm">{error}</p>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-10">
                <div className="mx-auto h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">All Caught Up!</h3>
                <p className="mt-2 text-neutral-500">You have no pending items in your workspace. Great job!</p>
            </div>
        );
    }

    if (currentIndex >= queue.length) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-10">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Queue Completed</h3>
                <p className="mt-2 text-neutral-500">You have processed all {queue.length} items in your session.</p>
                <button
                    onClick={() => { setCurrentIndex(0); window.location.reload(); }}
                    className="mt-8 inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                >
                    Refresh List
                </button>
            </div>
        );
    }

    const currentItem = queue[currentIndex];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Workspace</h2>
                    <p className="mt-2 text-sm text-neutral-500 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            Item {currentIndex + 1} of {queue.length}
                        </span>
                        Processing queue...
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleNext}
                        className="group inline-flex items-center gap-x-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 transition-all"
                    >
                        Skip Item
                        <svg className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Top Section: Information */}
                <div className="space-y-6">
                    {/* BAPP Card */}
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
                            <h3 className="text-base font-semibold leading-7 text-neutral-900">School Information</h3>
                        </div>
                        <div className="px-6 py-6">
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">School Name</dt>
                                    <dd className="mt-1 text-base font-medium text-neutral-900">{currentItem.school_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">NPSN</dt>
                                    <dd className="mt-1 text-sm font-medium text-neutral-900 bg-neutral-100 inline-block px-2 py-1 rounded">{currentItem.npsn}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Resi Number</dt>
                                    <dd className="mt-1 text-sm font-medium text-neutral-900">{currentItem.resi_number}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Shipment Status</dt>
                                    <dd className="mt-1">
                                        {currentDetail ? (
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${currentDetail.shipment?.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                currentDetail.shipment?.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {currentDetail.shipment?.status || 'Unknown'}
                                            </span>
                                        ) : (
                                            <div className="h-5 w-20 bg-neutral-200 animate-pulse rounded"></div>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Starlink ID</dt>
                                    <dd className="mt-1 text-sm font-medium text-neutral-900 font-mono tracking-tight">{currentItem.starlink_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Received Date</dt>
                                    <dd className="mt-1 text-sm text-neutral-700 flex items-center gap-2">
                                        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(currentItem.received_date).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Evidence & Media */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm h-full flex flex-col">
                        <div className="border-b border-neutral-100 bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Evidence Gallery
                            </h3>
                            {(currentDetail?.evidences?.data?.length ?? 0) > 0 && (
                                <span className="text-xs text-neutral-500">{currentDetail?.evidences?.data?.length} files attached</span>
                            )}
                        </div>

                        <div className="p-6 flex-1 bg-neutral-50/30">
                            {loadingDetail ? (
                                <div className="flex h-64 items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-600"></div>
                                        <p className="text-sm text-neutral-500">Fetching evidences...</p>
                                    </div>
                                </div>
                            ) : currentDetail ? (
                                <div>
                                    {currentDetail.evidences?.data && Array.isArray(currentDetail.evidences.data) && currentDetail.evidences.data.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {currentDetail.evidences.data.map((ev, idx) => {
                                                const fileUrl = `/api/proxy-file?path=${ev.file_path}`;
                                                const isPdf = ev.file_path.toLowerCase().endsWith('.pdf');
                                                const fileName = ev.file_path.split('/').pop() || 'Unknown File';

                                                return (
                                                    <div key={idx} className="group relative break-inside-avoid rounded-lg border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-[400px]">
                                                        <div className="p-3 border-b border-neutral-50 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ev.category === 'BAPP' ? 'bg-purple-100 text-purple-800' :
                                                                    ev.category === 'FOTO_PERANGKAT' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {ev.category || 'Unknown'}
                                                                </span>
                                                                <span className="text-xs text-neutral-400 truncate flex-1 text-right" title={fileName}>{fileName}</span>
                                                            </div>
                                                        </div>

                                                        <div className="relative flex-1 w-full overflow-hidden bg-neutral-100 flex items-center justify-center min-h-0">
                                                            {isPdf ? (
                                                                <div className="w-full h-full overflow-hidden flex flex-col cursor-pointer" onClick={() => openPdfModal(fileUrl)}>
                                                                    <div className="flex-1 w-full overflow-hidden flex justify-center items-start bg-neutral-200 p-2 relative group/pdf">
                                                                        <PdfViewer
                                                                            file={fileUrl}
                                                                            pageNumber={1}
                                                                            width={280}
                                                                            className="shadow-lg max-h-full"
                                                                        />
                                                                        {/* Overlay */}
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/pdf:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/pdf:opacity-100 pointer-events-none">
                                                                            <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                                View PDF
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-8 bg-white border-t border-neutral-200 flex items-center justify-center text-xs text-neutral-500">
                                                                        Click to view
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="group/image relative h-full w-full cursor-pointer bg-neutral-50" onClick={() => openImageModal(fileUrl)}>
                                                                    <img
                                                                        src={fileUrl}
                                                                        alt={fileName}
                                                                        className="h-full w-full object-contain"
                                                                        loading="lazy"
                                                                    />
                                                                    {/* Overlay */}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                                                        <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                                            Zoom
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                                            <svg className="h-16 w-16 mb-4 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <p className="text-sm">No evidence files attached to this shipment.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-64 items-center justify-center">
                                    <p className="text-sm text-neutral-400 italic">Select an item to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar - Floating at bottom */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 p-4 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-neutral-900">Verification Action</h4>
                        <p className="text-xs text-neutral-500">Review evidences carefully</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Future buttons */}
                        <button
                            className="rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-400 hover:bg-neutral-200 transition-colors cursor-not-allowed"
                            disabled
                        >
                            Reject
                        </button>
                        <button
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors shadow-blue-200 hover:shadow-blue-300"
                            disabled
                        >
                            Verify & Proceed
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full h-full flex flex-col items-center">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-800/90 backdrop-blur-md p-2 rounded-full shadow-2xl z-50 border border-white/10">
                            <button onClick={handleZoomOut} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>
                            <span className="text-xs font-mono text-white min-w-[4ch] text-center select-none">{zoom.toFixed(1)}x</span>
                            <button onClick={handleZoomIn} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>
                            <div className="w-px h-5 bg-white/10 mx-1"></div>
                            <button onClick={handleRotateLeft} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Rotate Left">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            </button>
                            <button onClick={handleRotateRight} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Rotate Right">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                            </button>
                            <div className="w-px h-5 bg-white/10 mx-1"></div>
                            <button onClick={handleReset} className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reset">
                                Reset
                            </button>
                            <div className="w-px h-5 bg-white/10 mx-1"></div>
                            <button onClick={closeImageModal} className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-full transition-colors" title="Close">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Image Canvas */}
                        <div
                            className="flex-1 w-full h-full flex items-center justify-center overflow-auto cursor-grab active:cursor-grabbing p-8"
                            onClick={(e) => e.target === e.currentTarget && closeImageModal()}
                        >
                            <img
                                src={selectedImage}
                                alt="Evidence Fullscreen"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                                }}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                draggable={false}
                            />
                        </div>
                        <div className="absolute bottom-4 text-white/50 text-xs pointer-events-none">
                            Click outside or press ESC to close • Scroll to zoom
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {selectedPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full h-full flex flex-col items-center">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-800/90 backdrop-blur-md p-2 rounded-full shadow-2xl z-50 border border-white/10">
                            {/* Pagination */}
                            <button
                                onClick={() => changePdfPage(-1)}
                                disabled={pdfPageNumber <= 1}
                                className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Previous Page"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-xs font-mono text-white min-w-[6ch] text-center select-none">
                                {pdfPageNumber} / {pdfNumPages || '--'}
                            </span>
                            <button
                                onClick={() => changePdfPage(1)}
                                disabled={!pdfNumPages || pdfPageNumber >= pdfNumPages}
                                className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Next Page"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button onClick={handlePdfZoomOut} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>
                            <span className="text-xs font-mono text-white min-w-[4ch] text-center select-none">{pdfZoom.toFixed(1)}x</span>
                            <button onClick={handlePdfZoomIn} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button onClick={handlePdfRotateLeft} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Rotate Left">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            </button>
                            <button onClick={handlePdfRotateRight} className="p-2.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Rotate Right">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button onClick={handlePdfReset} className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reset">
                                Reset
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button onClick={closePdfModal} className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-full transition-colors" title="Close">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* PDF Viewport */}
                        <div
                            className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-8"
                            onClick={(e) => e.target === e.currentTarget && closePdfModal()}
                        >
                            <PdfViewer
                                file={selectedPdf}
                                pageNumber={pdfPageNumber}
                                scale={pdfZoom}
                                rotate={pdfRotation}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="shadow-2xl"
                            />
                        </div>
                        <div className="absolute bottom-4 text-white/50 text-xs pointer-events-none">
                            Click outside or press ESC to close • Scroll/Drag to view
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
