"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import StickyInfoBox from '../components/StickyInfoBox';
import type { ProcessStatus } from '../components/ProcessStatusLight';

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

export interface Cluster {
    id: number;
    main_cluster: string;
    sub_cluster: string;
    nama_opsi: string;
}

export default function OwoPage() {
    const [queue, setQueue] = useState<BappItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentDetail, setCurrentDetail] = useState<ShipmentDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prefetchData, setPrefetchData] = useState<{ id: number; data: ShipmentDetail } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sidebar Position State
    const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">("left");

    // Processing Status State
    const [processingStatus, setProcessingStatus] = useState<ProcessStatus>("idle");
    const [processingError, setProcessingError] = useState<string>("");

    // Image Modal State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        setPosition({ x: 0, y: 0 });
    }, [selectedImage]);

    // PDF Modal State
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
    const [pdfPageNumber, setPdfPageNumber] = useState(1);
    const [pdfZoom, setPdfZoom] = useState(1);
    const [pdfRotation, setPdfRotation] = useState(0);

    // Rejection State
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [selectedRejections, setSelectedRejections] = useState<Record<string, string>>({});
    const [customReason, setCustomReason] = useState<string>('');

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                const res = await fetch('/api/master/clusters');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setClusters(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clusters", error);
            }
        };
        fetchClusters();
    }, []);

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

    // Fetch details when the current item changes with prefetching
    useEffect(() => {
        let isMounted = true;

        const loadCurrentAndPrefetchNext = async () => {
            if (queue.length === 0 || currentIndex >= queue.length) {
                if (isMounted) setCurrentDetail(null);
                return;
            }

            const currentItem = queue[currentIndex];
            const nextItem = currentIndex + 1 < queue.length ? queue[currentIndex + 1] : null;

            // 1. Load Current Item
            if (prefetchData?.id === currentItem.shipment_id) {
                if (isMounted) {
                    setCurrentDetail(prefetchData.data);
                    setLoadingDetail(false);
                }
            } else {
                if (isMounted) setLoadingDetail(true);
                try {
                    const res = await fetch(`/api/fetch-data?id=${currentItem.shipment_id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    });

                    if (!res.ok) {
                        throw new Error(`Failed to fetch details for shipment ${currentItem.shipment_id}`);
                    }
                    const data = await res.json();
                    if (isMounted) setCurrentDetail(data);
                } catch (err: any) {
                    console.error(err);
                } finally {
                    if (isMounted) setLoadingDetail(false);
                }
            }

            // 2. Prefetch Next Item
            if (nextItem) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (!isMounted) return;

                    const res = await fetch(`/api/fetch-data?id=${nextItem.shipment_id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (isMounted) {
                            setPrefetchData({ id: nextItem.shipment_id, data });
                        }
                    }
                } catch (err) {
                    console.error("Prefetch failed", err);
                }
            }
        };

        loadCurrentAndPrefetchNext();

        return () => { isMounted = false; };
    }, [queue, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleNext = () => {
        setSelectedRejections({});
        setCustomReason('');
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(queue.length);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setProcessingStatus("processing");
        setProcessingError("");

        const hasRejections = Object.keys(selectedRejections).length > 0 || !!customReason;
        const status = hasRejections ? 'REJECTED' : 'APPROVED';

        const token = localStorage.getItem('token');
        const csrfToken = localStorage.getItem('csrf_token');
        const userId = localStorage.getItem('user_id');

        if (!token || !csrfToken || !userId) {
            alert("Authentication tokens or User ID missing. Please login again.");
            setIsSubmitting(false);
            setProcessingStatus("error");
            setProcessingError("Auth tokens or User ID missing");
            return;
        }

        const currentItem = queue[currentIndex];
        const evidenceIds = currentDetail?.evidences.data.map(e => e.id) || [];
        let finalReason = '';

        if (hasRejections) {
            const reasons = Object.entries(selectedRejections)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`);

            if (customReason && !reasons.some(r => r.includes(customReason))) {
                finalReason = customReason;
            } else {
                finalReason = reasons.join('; ');
            }
        }

        try {
            const body: any = {
                shipment_id: currentItem.shipment_id,
                status: status,
                auth_token: token,
                csrf_token: csrfToken
            };

            if (status === 'REJECTED') {
                body.client_reject_reason = finalReason || "No reason provided";
                body.evidence_ids = evidenceIds;
            }

            const res = await fetch('/api/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Insert log to database
                try {
                    await fetch('/api/insert-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            cutoff_id: currentItem.id,
                            serial_number: currentItem.starlink_id,
                            user_id: parseInt(userId),
                            rejections: selectedRejections
                        })
                    });
                } catch (logError) {
                    console.error("Failed to insert log:", logError);
                }

                setProcessingStatus("success");
                setTimeout(() => setProcessingStatus("idle"), 2000);
                handleNext();
            } else {
                const data = await res.json();
                setProcessingStatus("error");
                setProcessingError(data.error || 'Unknown error');
                alert(`Failed to ${status.toLowerCase()}: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Action error:", error);
            setProcessingStatus("error");
            setProcessingError(String(error));
            alert(`An error occurred while trying to ${status.toLowerCase()}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openImageModal = (url: string) => {
        setSelectedPdf(null);
        setSelectedImage(url);
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
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
        setSelectedImage(null);
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

    // Navigation Helper
    const switchEvidence = useCallback((direction: 'next' | 'prev') => {
        if (!currentDetail?.evidences?.data?.length) return;

        const evidences = currentDetail.evidences.data;
        const currentUrl = selectedImage || selectedPdf;
        const currentIdx = evidences.findIndex(e => {
            const proxyUrl = `/api/proxy-file?path=${e.file_path}`;
            return proxyUrl === currentUrl || currentUrl?.includes(encodeURIComponent(e.file_path));
        });

        const startIdx = currentIdx === -1 ? 0 : currentIdx;

        let newIndex;
        if (direction === 'next') {
            newIndex = (startIdx + 1) % evidences.length;
        } else {
            newIndex = (startIdx - 1 + evidences.length) % evidences.length;
        }

        const nextEvidence = evidences[newIndex];
        const nextUrl = `/api/proxy-file?path=${nextEvidence.file_path}`;
        const isPdf = nextEvidence.file_path.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            setSelectedImage(null);
            openPdfModal(nextUrl);
        } else {
            setSelectedPdf(null);
            openImageModal(nextUrl);
        }
    }, [currentDetail, selectedImage, selectedPdf]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedImage && !selectedPdf) return;

            switch (e.key.toLowerCase()) {
                case 'escape':
                    closeImageModal();
                    closePdfModal();
                    break;
                case 'a':
                    switchEvidence('prev');
                    break;
                case 'd':
                    switchEvidence('next');
                    break;
                case 'q':
                    if (selectedImage) handleRotateLeft();
                    if (selectedPdf) handlePdfRotateLeft();
                    break;
                case 'e':
                    if (selectedImage) handleRotateRight();
                    if (selectedPdf) handlePdfRotateRight();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, selectedPdf, switchEvidence]);

    // Mouse Wheel Handler
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!selectedImage && !selectedPdf) return;

        if (selectedImage) {
            e.stopPropagation();
            const delta = e.deltaY * -0.001;
            const newScale = delta > 0 ? 0.1 : -0.1;
            setZoom(prev => Math.min(Math.max(0.2, prev + newScale), 5));
        } else if (selectedPdf) {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY * -0.001;
                const newScale = delta > 0 ? 0.1 : -0.1;
                setPdfZoom(prev => Math.min(Math.max(0.5, prev + newScale), 5));
            }
        }
    }, [selectedImage, selectedPdf]);


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
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden relative">
            {/* Sidebar */}
            <div className={`flex-shrink-0 h-full ${sidebarPosition === "left" ? "order-1 border-r border-zinc-700" : "order-2 border-l border-zinc-700"}`}>
                <Sidebar
                    currentIndex={currentIndex}
                    totalItems={queue.length}
                    clusters={clusters}
                    selectedRejections={selectedRejections}
                    setSelectedRejections={setSelectedRejections}
                    customReason={customReason}
                    setCustomReason={setCustomReason}
                    onSubmit={handleSubmit}
                    onSkip={handleNext}
                    isSubmitting={isSubmitting}
                    processingStatus={processingStatus}
                    errorMessage={processingError}
                    onRetry={handleSubmit}
                    position={sidebarPosition}
                    setPosition={setSidebarPosition}
                />
            </div>

            {/* Main Content */}
            <div className={`flex-1 h-full overflow-hidden relative bg-zinc-50/50 dark:bg-zinc-900/50 ${sidebarPosition === "left" ? "order-2" : "order-1"}`}>
                <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {currentDetail && !loadingDetail ? (
                        <div className="max-w-5xl mx-auto flex flex-col gap-6">
                            {/* School Info Card */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5 relative">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 border-b dark:border-zinc-700 pb-2">
                                    Informasi Sekolah
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                    <InfoItem label="Nama Sekolah" value={currentItem.school_name} />
                                    <InfoItem label="NPSN" value={currentItem.npsn} />
                                    <InfoItem label="Resi Number" value={currentItem.resi_number} />
                                    <InfoItem label="Starlink ID" value={currentItem.starlink_id} />
                                    <InfoItem label="Received Date" value={new Date(currentItem.received_date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} />
                                    <InfoItem label="Status" value={currentDetail?.shipment?.status || 'Unknown'} />
                                </div>
                            </div>

                            {/* Data Barang Card */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 border-b dark:border-zinc-700 pb-2">
                                    Data Perangkat
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <InfoItem label="Shipment ID" value={String(currentItem.shipment_id)} />
                                    <InfoItem label="Starlink ID" value={currentItem.starlink_id} />
                                </div>
                            </div>

                            {/* Evidence Gallery Card */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                                <div className="flex justify-between items-center mb-4 border-b dark:border-zinc-700 pb-2">
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                        Dokumentasi Pengiriman
                                    </h2>
                                    {(currentDetail?.evidences?.data?.length ?? 0) > 0 && (
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {currentDetail?.evidences?.data?.length} files
                                        </span>
                                    )}
                                </div>

                                {currentDetail.evidences?.data && Array.isArray(currentDetail.evidences.data) && currentDetail.evidences.data.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {currentDetail.evidences.data.map((ev, idx) => {
                                            const fileUrl = `/api/proxy-file?path=${ev.file_path}`;
                                            const isPdf = ev.file_path.toLowerCase().endsWith('.pdf');
                                            const fileName = ev.file_path.split('/').pop() || 'Unknown File';

                                            return (
                                                <div
                                                    key={idx}
                                                    className="group relative cursor-pointer"
                                                    onClick={() => isPdf ? openPdfModal(fileUrl) : openImageModal(fileUrl)}
                                                >
                                                    <div className="aspect-square w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
                                                        {isPdf ? (
                                                            <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-800 p-2">
                                                                <PdfViewer
                                                                    file={fileUrl}
                                                                    pageNumber={1}
                                                                    width={150}
                                                                    className="shadow-lg max-h-full"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={fileUrl}
                                                                alt={fileName}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                loading="lazy"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="mt-2 text-xs font-medium text-center text-zinc-600 dark:text-zinc-400 truncate">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${ev.category === 'BAPP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            ev.category === 'FOTO_PERANGKAT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {ev.category || 'File'}
                                                        </span>
                                                        {fileName}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-zinc-400 text-sm italic">
                                        No evidence files attached to this shipment.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center flex-col gap-4 text-zinc-500">
                            {loadingDetail
                                ? "Loading task data..."
                                : queue.length === 0
                                    ? "Fetching task list..."
                                    : "Select an item to view details"}
                        </div>
                    )}
                </div>

                {/* Inline Viewer (Image/PDF) - Overlays the main content */}
                {(selectedImage || selectedPdf) && (
                    <div
                        className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col h-full"
                        onWheel={handleWheel}
                    >
                        {/* Toolbar */}
                        <div className="flex-none p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shadow-md z-10">
                            <div className="text-white text-sm font-medium truncate max-w-md flex items-center gap-2">
                                <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs text-neutral-400 border border-neutral-700">Preview</span>
                                {selectedPdf
                                    ? selectedPdf.split('/').pop()
                                    : selectedImage?.split('/').pop()}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedImage && (
                                    <>
                                        <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                            <button onClick={handleZoomOut} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom Out">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                            </button>
                                            <span className="text-xs font-mono text-neutral-300 min-w-[3.5ch] text-center select-none">{zoom.toFixed(1)}x</span>
                                            <button onClick={handleZoomIn} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom In">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                        <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                            <button onClick={handleRotateLeft} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Rotate Left">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                            </button>
                                            <button onClick={handleRotateRight} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Rotate Right">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                        <button onClick={handleReset} className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700" title="Reset view">
                                            Reset
                                        </button>
                                    </>
                                )}
                                {selectedPdf && (
                                    <>
                                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                        <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                            <button onClick={handlePdfZoomOut} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom Out">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                            </button>
                                            <span className="text-xs font-mono text-neutral-300 min-w-[3.5ch] text-center select-none">{pdfZoom.toFixed(1)}x</span>
                                            <button onClick={handlePdfZoomIn} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom In">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                        <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                            <button onClick={handlePdfRotateLeft} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Rotate Left">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                            </button>
                                            <button onClick={handlePdfRotateRight} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Rotate Right">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                        <button onClick={handlePdfReset} className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700" title="Reset view">
                                            Reset
                                        </button>
                                    </>
                                )}
                                <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                                <button
                                    onClick={() => {
                                        closeImageModal();
                                        closePdfModal();
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg transition-colors border border-red-500/20"
                                    title="Close Viewer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    Close
                                </button>
                            </div>
                        </div>


                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-neutral-950">
                            {selectedPdf ? (
                                <div className="w-full h-full p-4 overflow-auto flex justify-center custom-scrollbar">
                                    <PdfViewer
                                        file={selectedPdf!}
                                        allPages={true}
                                        scale={pdfZoom}
                                        rotate={pdfRotation}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        width={1000}
                                        className="shadow-2xl"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing p-8"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <img
                                        ref={imageRef}
                                        src={selectedImage!}
                                        alt="Preview"
                                        className="max-w-none transition-transform duration-200 ease-out shadow-2xl"
                                        draggable={false}
                                        style={{
                                            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                            maxHeight: '100%',
                                            maxWidth: '100%'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip Footer */}
                        <div className="flex-none h-32 bg-neutral-900 border-t border-neutral-800 p-4 relative z-20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-black/20 to-transparent"></div>
                            <div className="flex gap-3 h-full items-center p-1 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800 pb-2">
                                {currentDetail?.evidences?.data?.map((ev, idx) => {
                                    const fileUrl = `/api/proxy-file?path=${ev.file_path}`;
                                    const isPdf = ev.file_path.toLowerCase().endsWith('.pdf');
                                    const isSelected = selectedImage === fileUrl || selectedPdf === fileUrl;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (isPdf) {
                                                    openPdfModal(fileUrl);
                                                } else {
                                                    openImageModal(fileUrl);
                                                }
                                            }}
                                            className={`relative group h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-200 ${isSelected
                                                ? 'border-blue-500 ring-2 ring-blue-500/30 scale-100'
                                                : 'border-neutral-700 opacity-60 hover:opacity-100 hover:border-neutral-500 hover:scale-105'
                                                }`}
                                        >
                                            {isPdf ? (
                                                <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center p-1">
                                                    <svg className="w-6 h-6 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                    <span className="text-[9px] text-neutral-400 truncate w-full text-center">PDF</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={fileUrl}
                                                    alt={`Thumb ${idx}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 px-0.5 truncate">
                                                <span className="text-[8px] text-white font-medium block text-center truncate">
                                                    {ev.category?.replace('_', ' ') || 'File'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* StickyInfoBox - Floating info when viewer is open */}
            {(selectedImage || selectedPdf) && currentItem && (
                <StickyInfoBox
                    schoolName={currentItem.school_name}
                    npsn={currentItem.npsn}
                    starlinkId={currentItem.starlink_id}
                    resiNumber={currentItem.resi_number}
                    shipmentStatus={currentDetail?.shipment?.status || 'Unknown'}
                    receivedDate={new Date(currentItem.received_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                />
            )}
        </div>
    );
}

function InfoItem({
    label,
    value,
    full,
}: {
    label: string;
    value: string;
    full?: boolean;
}) {
    return (
        <div className={`flex flex-col ${full ? 'col-span-full' : ''}`}>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {label}
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-200 dark:border-zinc-700/50 block min-h-[38px]">
                {value || '-'}
            </span>
        </div>
    );
}
