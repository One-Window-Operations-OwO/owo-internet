"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import StickyInfoBox from '../components/StickyInfoBox';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
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
    history: any[];
    is_duplicate_sn?: boolean;
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
    const currentItem = queue[currentIndex];
    const [currentDetail, setCurrentDetail] = useState<ShipmentDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prefetchData, setPrefetchData] = useState<{ id: number; data: ShipmentDetail } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [failedLog, setFailedLog] = useState<{ error: string, data: any } | null>(null);

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
    const isModalOpenRef = useRef(false);
    const pdfTransformRef = useRef<ReactZoomPanPinchRef>(null);
    const lastScrollTimeRef = useRef(0);

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

    // Layout State
    const [showThumbnails, setShowThumbnails] = useState(true);

    // Rejection State
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [selectedRejections, setSelectedRejections] = useState<Record<string, string>>({});
    const [customReason, setCustomReason] = useState<string>('');

    // New State for Sidebar Inputs
    const [tanggalBapp, setTanggalBapp] = useState<string>(new Date().toISOString().split("T")[0]);
    const [manualSerialNumber, setManualSerialNumber] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);
    const [lockedClusters, setLockedClusters] = useState<string[]>([]);

    const sortedEvidences = useMemo(() => {
        if (!currentDetail?.evidences?.data) return [];

        const priority = [
            'PLANG_SEKOLAH',
            'PENERIMA',
            'UNBOXING',
            'SERIAL_NUMBER',
            'BAPP',
            'CONNECTED_DEVICE'
        ];

        return [...currentDetail.evidences.data].sort((a, b) => {
            const indexA = priority.indexOf(a.category);
            const indexB = priority.indexOf(b.category);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
    }, [currentDetail]);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                const res = await fetch('/api/master/clusters');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        const fetchedClusters: Cluster[] = data.data;
                        // Inject (10B) if missing (Frontend-only injection as requested)
                        const has10B = fetchedClusters.some(c => c.sub_cluster === '(10B) Tanggal pada BAPP Tidak Sesuai dengan Web');
                        if (!has10B) {
                            fetchedClusters.push({
                                id: 9999, // Temp ID
                                main_cluster: 'Skylink Web',
                                sub_cluster: '(10B) Tanggal pada BAPP Tidak Sesuai dengan Web',
                                nama_opsi: 'Tanggal BAPP dan Web Berbeda'
                            });
                        }
                        setClusters(fetchedClusters);
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

            // Initialize Tanggal Pengecekan with Received Date
            if (isMounted) {
                if (currentItem.received_date) {
                    const d = new Date(currentItem.received_date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setTanggalBapp(`${year}-${month}-${day}`);
                } else {
                    setTanggalBapp('');
                }
            }


            // Check SN Logic
            if (currentItem.starlink_id) {
                const sn = currentItem.starlink_id;

                // 1. Check Length (Must be 15)
                if (sn.length !== 15) {
                    const reason = '(3E) SN tidak valid (jumlah karakter tidak sesuai)';
                    const kardusCluster = 'Serial Number Kardus';
                    const bappCluster = 'Serial Number BAPP';

                    setLockedClusters(prev => {
                        const newLocks = new Set(prev);
                        newLocks.add(kardusCluster);
                        return Array.from(newLocks);
                    });

                    setSelectedRejections(prev => {
                        const next = {
                            ...prev,
                            [bappCluster]: reason,
                            [kardusCluster]: reason
                        };
                        setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                        return next;
                    });
                }
            }

            // 1. Load Current Item
            if (prefetchData?.id === currentItem.shipment_id) {
                if (isMounted) {
                    setCurrentDetail(prefetchData.data);
                    setHistory(prefetchData.data.history || []);
                    setLoadingDetail(false);

                    // Check duplicate from prefetched data
                    if (prefetchData.data.is_duplicate_sn && currentItem.starlink_id?.length === 15) {
                        const reason = '(3D) SN Duplikat';
                        const kardusCluster = 'Serial Number Kardus';
                        const bappCluster = 'Serial Number BAPP';

                        setLockedClusters(prev => {
                            const newLocks = new Set(prev);
                            newLocks.add(kardusCluster);
                            return Array.from(newLocks);
                        });

                        setSelectedRejections(prev => {
                            const next = {
                                ...prev,
                                [bappCluster]: reason,
                                [kardusCluster]: reason
                            };
                            setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                            return next;
                        });
                    }

                    // Check for missing BAPP Number
                    if (!prefetchData.data.shipment.bapp_number) {
                        // Find the exact sub_cluster string for "Nomor BAPP Tidak Ada" in "Skylink Web"
                        const targetOption = clusters.find(c => c.main_cluster === 'Skylink Web' && c.nama_opsi.includes('Nomor BAPP Tidak Ada'));
                        const reason = targetOption ? targetOption.sub_cluster : '(10A) Nomor BAPP Tidak Ada';

                        // Use "Skylink Web" as main cluster name based on user request/grep
                        const mainCluster = 'Skylink Web';

                        setLockedClusters(prev => [...prev, mainCluster]);
                        setSelectedRejections(prev => {
                            const next = { ...prev, [mainCluster]: reason };
                            setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                            return next;
                        });
                    } else {
                        // Ensure it's unlocked if it has a number (though this runs on new item load which should be fresh)
                        setLockedClusters(prev => prev.filter(c => c !== 'Skylink Web'));
                    }
                }
            } else {
                if (isMounted) setLoadingDetail(true);
                try {
                    const res = await fetch(`/api/fetch-data?id=${currentItem.shipment_id}&cutoff_id=${currentItem.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                        }
                    });

                    if (!res.ok) {
                        throw new Error(`Failed to fetch details for shipment ${currentItem.shipment_id}`);
                    }
                    const data = await res.json();
                    if (isMounted) {
                        setCurrentDetail(data);
                        setHistory(data.history || []);

                        // Check duplicate from fetched data
                        if (data.is_duplicate_sn && currentItem.starlink_id?.length === 15) {
                            const reason = '(3D) SN Duplikat';
                            const kardusCluster = 'Serial Number Kardus';
                            const bappCluster = 'Serial Number BAPP';

                            setLockedClusters(prev => {
                                const newLocks = new Set(prev);
                                newLocks.add(kardusCluster);
                                return Array.from(newLocks);
                            });

                            setSelectedRejections(prev => {
                                const next = {
                                    ...prev,
                                    [bappCluster]: reason,
                                    [kardusCluster]: reason
                                };
                                setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                                return next;
                            });
                        }

                        // Check for missing BAPP Number
                        if (!data.shipment.bapp_number) {
                            const targetOption = clusters.find(c => c.main_cluster === 'Skylink Web' && c.nama_opsi.includes('Nomor BAPP Tidak Ada'));
                            const reason = targetOption ? targetOption.sub_cluster : '(10A) Nomor BAPP Tidak Ada';

                            const mainCluster = 'Skylink Web';

                            setLockedClusters(prev => [...prev, mainCluster]);
                            setSelectedRejections(prev => {
                                const next = { ...prev, [mainCluster]: reason };
                                setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                                return next;
                            });
                        } else {
                            setLockedClusters(prev => prev.filter(c => c !== 'Skylink Web'));
                        }
                    }
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

                    const nextCutoffItem = queue[currentIndex + 1];
                    const res = await fetch(`/api/fetch-data?id=${nextItem.shipment_id}&cutoff_id=${nextCutoffItem.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (isMounted) {
                            setPrefetchData({ id: nextItem.shipment_id, data });

                            // Prefetch images and PDFs
                            if (data?.evidences?.data && Array.isArray(data.evidences.data)) {
                                data.evidences.data.forEach((ev: EvidenceItem) => {
                                    if (!ev?.file_path) return;
                                    const fileUrl = `/api/proxy-file?path=${ev.file_path}`;
                                    if (ev.file_path.toLowerCase().endsWith('.pdf')) {
                                        // Fetch PDF to browser cache
                                        fetch(fileUrl, { priority: 'low' } as RequestInit).catch(() => { });
                                    } else {
                                        // Prefetch image to browser cache
                                        const img = new Image();
                                        img.src = fileUrl;
                                    }
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Prefetch failed", err);
                }
            }
        };

        loadCurrentAndPrefetchNext();

        return () => { isMounted = false; };
    }, [queue, currentIndex, clusters]); // eslint-disable-line react-hooks/exhaustive-deps



    // Date Mismatch Logic
    useEffect(() => {
        if (!currentItem) return;

        let receivedDate = '';
        if (currentItem.received_date) {
            const d = new Date(currentItem.received_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            receivedDate = `${year}-${month}-${day}`;
        }

        const mainCluster = 'Skylink Web';
        const reason = '(10B) Tanggal pada BAPP Tidak Sesuai dengan Web';

        if (tanggalBapp && receivedDate && tanggalBapp !== receivedDate) {
            const currentRejection = selectedRejections[mainCluster];
            // Priority: If "Nomor BAPP Tidak Ada" is already active, do not overwrite it.
            if (currentRejection && currentRejection.includes("Nomor BAPP Tidak Ada")) {
                return;
            }

            if (currentRejection === reason) {
                return;
            }

            setLockedClusters(prev => {
                const newLocks = new Set(prev);
                newLocks.add(mainCluster);
                return Array.from(newLocks);
            });

            setSelectedRejections(prev => {
                const next = { ...prev, [mainCluster]: reason };
                setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                return next;
            });
        } else if (tanggalBapp && receivedDate && tanggalBapp === receivedDate) {
            if (selectedRejections[mainCluster] === reason) {
                setLockedClusters(prev => prev.filter(c => c !== mainCluster));
                setSelectedRejections(prev => {
                    const next = { ...prev };
                    delete next[mainCluster];
                    setCustomReason(Array.from(new Set(Object.values(next))).join('; '));
                    return next;
                });
            }
        }
    }, [tanggalBapp, currentItem, selectedRejections]); // Added dependency on selectedRejections to check value

    // Update manualSerialNumber based on selectedRejections['Serial Number BAPP']
    useEffect(() => {
        if (queue.length === 0 || currentIndex >= queue.length) return;

        const currentItem = queue[currentIndex];
        const serialRejection = selectedRejections['Serial Number BAPP'];

        if (serialRejection) {
            // Check if the specific rejection reason matches
            // (7A) SN pada BAPP tidak jelas -> set to " - "
            // (7C) SN pada BAPP tidak ada -> set to " - "
            if (serialRejection.includes("tidak jelas") || serialRejection.includes("tidak ada")) {
                setManualSerialNumber(" - ");
            } else {
                // Default to STARLINK ID if some other rejection reason is selected
                setManualSerialNumber(currentItem.starlink_id || "");
            }
        } else {
            // Reset if no rejection selected for Serial Number BAPP
            setManualSerialNumber("");
        }
    }, [selectedRejections['Serial Number BAPP'], currentIndex, queue]); // specific dependency on the value to avoid loops

    const handleNext = () => {
        setSelectedRejections({});
        setLockedClusters([]);
        setCustomReason('');
        setHistory([]);
        // manualSerialNumber will be reset by the effect when selectedRejections is cleared
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
        const status = hasRejections ? 'REJECTED' : 'VERIFIED';

        const token = localStorage.getItem('access_token');
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
                .map(([_, value]) => `${value}`);

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
                // Determine final serial number
                const isSerialNumberMismatch = Object.entries(selectedRejections).some(([main, sub]) =>
                    main === 'Serial Number BAPP' && Boolean(sub)
                );
                const finalSerialNumber = isSerialNumberMismatch ? manualSerialNumber : currentItem.starlink_id;

                // Insert log to database
                const logData = {
                    cutoff_id: currentItem.id,
                    serial_number: finalSerialNumber,
                    user_id: parseInt(userId),
                    rejections: selectedRejections,
                    tanggal_bapp: tanggalBapp
                };

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const logRes = await fetch('/api/insert-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(logData),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!logRes.ok) {
                        const logErr = await logRes.json().catch(() => ({}));
                        throw new Error(logErr.error || `HTTP error ${logRes.status}`);
                    }

                    setProcessingStatus("success");
                    setTimeout(() => setProcessingStatus("idle"), 2000);
                    handleNext();
                } catch (logError: any) {
                    console.error("Failed to insert log:", logError);
                    setProcessingStatus("idle");
                    setFailedLog({
                        error: logError.name === 'AbortError' ? 'Request timeout (exceeded 3 seconds)' : (logError.message || String(logError)),
                        data: logData
                    });
                }
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

    const retryLogInsert = async () => {
        if (!failedLog) return;
        setProcessingStatus("processing");
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const logRes = await fetch('/api/insert-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(failedLog.data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!logRes.ok) {
                const logErr = await logRes.json().catch(() => ({}));
                throw new Error(logErr.error || `HTTP error ${logRes.status}`);
            }

            setFailedLog(null);
            setProcessingStatus("success");
            setTimeout(() => setProcessingStatus("idle"), 2000);
            handleNext();
        } catch (error: any) {
            console.error("Retry failed:", error);
            setFailedLog({ ...failedLog, error: error.name === 'AbortError' ? 'Request timeout (exceeded 3 seconds)' : (error.message || String(error)) });
            setProcessingStatus("idle");
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

    useEffect(() => {
        isModalOpenRef.current = !!(selectedImage || selectedPdf);
    }, [selectedImage, selectedPdf]);

    useEffect(() => {
        if (isModalOpenRef.current && currentDetail) {
            const firstEvidence = sortedEvidences[0];
            if (firstEvidence) {
                const nextUrl = `/api/proxy-file?path=${firstEvidence.file_path}`;
                const isNextPdf = firstEvidence.file_path.toLowerCase().endsWith('.pdf');

                if (isNextPdf) {
                    setSelectedImage(null);
                    setSelectedPdf(nextUrl);
                    setPdfPageNumber(1);
                    setPdfZoom(1);
                    setPdfRotation(0);
                    setPdfNumPages(null);
                } else {
                    setSelectedPdf(null);
                    setSelectedImage(nextUrl);
                    setZoom(1);
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                }
            } else {
                setSelectedImage(null);
                setSelectedPdf(null);
            }
        }
    }, [currentDetail]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setPdfNumPages(numPages);
    }

    const changePdfPage = (offset: number) => {
        setPdfPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            return Math.max(1, Math.min(newPage, pdfNumPages || 1));
        });
    };

    const handlePdfZoomIn = () => pdfTransformRef.current?.zoomIn(0.25);
    const handlePdfZoomOut = () => pdfTransformRef.current?.zoomOut(0.25);
    const handlePdfRotateLeft = () => setPdfRotation(prev => prev - 90);
    const handlePdfRotateRight = () => setPdfRotation(prev => prev + 90);
    const handlePdfReset = () => {
        pdfTransformRef.current?.resetTransform();
        setPdfRotation(0);
        setPdfPageNumber(1);
    };

    // Navigation Helper
    const switchEvidence = useCallback((direction: 'next' | 'prev') => {
        if (!sortedEvidences.length) return;

        const evidences = sortedEvidences;
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

    // Keyboard Shortcuts & Mouse Macro
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedImage && !selectedPdf) return;

            // Close on Escape or Space
            if (e.key.toLowerCase() === 'escape' || e.key === ' ') {
                e.preventDefault(); // Prevent scrolling on Space
                closeImageModal();
                closePdfModal();
            }

            switch (e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    switchEvidence('prev');
                    break;
                case 'd':
                case 'arrowright':
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

        const handleMouse = (e: MouseEvent) => {
            if (!selectedImage && !selectedPdf) return;

            // Mouse 3 (Back) -> Prev
            if (e.button === 3) {
                e.preventDefault();
                switchEvidence('prev');
            }
            // Mouse 4 (Forward) -> Next
            else if (e.button === 4) {
                e.preventDefault();
                switchEvidence('next');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleMouse);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouse);
        };
    }, [selectedImage, selectedPdf, switchEvidence]);

    // Mouse Wheel Handler
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!selectedImage && !selectedPdf) return;

        if (selectedImage) {
            e.stopPropagation();
            const delta = e.deltaY * -0.001;
            const newScale = delta > 0 ? 0.1 : -0.1;
            setZoom(prev => Math.min(Math.max(0.2, prev + newScale), 5));
        }
    }, [selectedImage]);


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
                    onSkip={() => {
                        handleNext();
                        setProcessingStatus("idle");
                    }}
                    isSubmitting={isSubmitting}
                    processingStatus={processingStatus}
                    errorMessage={processingError}
                    onRetry={handleSubmit}
                    position={sidebarPosition}
                    setPosition={setSidebarPosition}
                    manualSerialNumber={manualSerialNumber}
                    setManualSerialNumber={setManualSerialNumber}
                    lockedClusters={lockedClusters}
                    isLoading={loadingDetail}
                    currentCategory={(() => {
                        const currentUrl = selectedImage || selectedPdf;
                        if (!currentDetail?.evidences?.data?.length || !currentUrl) return undefined;

                        const currentEvidence = currentDetail.evidences.data.find(e => {
                            const proxyUrl = `/api/proxy-file?path=${e.file_path}`;
                            // Match either the proxy URL or the direct path if url includes it (encoding safe)
                            return proxyUrl === currentUrl || currentUrl.includes(encodeURIComponent(e.file_path)) || currentUrl.includes(e.file_path);
                        });
                        return currentEvidence?.category;
                    })()}
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

                            {/* Riwayat Approval Card */}
                            {history.length > 0 && (
                                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 border-b dark:border-zinc-700 pb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                        Riwayat Approval
                                        <span className="text-xs font-normal text-zinc-500 ml-auto">{history.length} log{history.length > 1 ? 's' : ''}</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {history.map((log: any, idx: number) => {
                                            const isVerified = log.status?.toUpperCase() === 'VERIFIED';
                                            const rejections = log.rejections && typeof log.rejections === 'object' && Object.keys(log.rejections).length > 0
                                                ? Object.entries(log.rejections).map(([k, v]) => `${k}: ${v}`)
                                                : null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`rounded-lg p-3 border ${isVerified
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
                                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                                                {log.username || '-'}
                                                            </span>
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                                                                {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', {
                                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                }) : '-'}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isVerified
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                    {rejections && (
                                                        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                            {rejections.map((r: string, i: number) => (
                                                                <div key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-red-400 mt-0.5">•</span>
                                                                    <span>{r}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {log.serial_number && (
                                                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500 font-mono">
                                                            SN: {log.serial_number}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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

                                {sortedEvidences.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {sortedEvidences.map((ev, idx) => {
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
                                                                <div className="bg-white p-1 shadow-md w-full h-full flex items-center justify-center overflow-hidden">
                                                                    <span className="text-xs font-bold text-zinc-500">PDF</span>
                                                                </div>
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
                                                    <div className="mt-2 text-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${ev.category === 'BAPP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            ev.category === 'PLANG_SEKOLAH' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                                ev.category === 'PENERIMA' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                    ev.category === 'SERIAL_NUMBER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {ev.category || 'File'}
                                                        </span>
                                                        <div className="truncate w-full px-1">{fileName}</div>
                                                    </div>
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

                        {/* New Overlay UI Implementation */}
                        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black/50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    switchEvidence('prev');
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-6xl transition-colors p-4 z-[60]"
                            >
                                ‹
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    switchEvidence('next');
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-6xl transition-colors p-4 z-[60]"
                            >
                                ›
                            </button>

                            {/* Toolbar for Image */}
                            {selectedImage && (
                                <div
                                    className="absolute top-4 right-4 z-[60] flex gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => handleRotateLeft()}
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors"
                                    >
                                        ↺
                                    </button>
                                    <button
                                        onClick={() => handleRotateRight()}
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors"
                                    >
                                        ↻
                                    </button>
                                    <button
                                        onClick={() => closeImageModal()}
                                        className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}


                            {selectedPdf ? (
                                <div
                                    className="w-full h-full p-4 overflow-hidden flex justify-center bg-black/50"
                                    onWheel={(e) => {
                                        if (e.shiftKey) return; // Let TransformWrapper handle zoom

                                        // Manual Vertical Pan
                                        if (pdfTransformRef.current) {
                                            const { positionX, positionY, scale } = pdfTransformRef.current.instance.transformState;
                                            // Multiply deltaY by 3 for faster scrolling
                                            const shift = e.deltaY * 3;
                                            const newY = positionY - shift;
                                            // We rely on the library to clamp bounds if configured, or just let it scroll
                                            pdfTransformRef.current.setTransform(positionX, newY, scale);
                                        }
                                    }}
                                >
                                    <TransformWrapper
                                        ref={pdfTransformRef}
                                        initialScale={1}
                                        minScale={0.5}
                                        maxScale={5}
                                        centerZoomedOut={false}
                                        limitToBounds={false}
                                        wheel={{ step: 0.1, activationKeys: ['Shift'] }}
                                        onTransformed={(e) => setPdfZoom(e.state.scale)}
                                    >
                                        <TransformComponent
                                            wrapperClass="!w-full !h-full"
                                            contentClass="!w-full !h-full flex justify-center"
                                        >
                                            <PdfViewer
                                                file={selectedPdf!}
                                                allPages={true}
                                                scale={1}
                                                rotate={pdfRotation}
                                                onLoadSuccess={onDocumentLoadSuccess}
                                                width={1500}
                                                className="shadow-2xl w-full h-full flex items-center justify-center"
                                            />
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden w-full h-full">
                                    <TransformWrapper
                                        key={selectedImage + "-" + rotation}
                                        initialScale={1}
                                        centerOnInit
                                        wheel={{ step: 0.1 }}
                                    >
                                        <TransformComponent
                                            wrapperClass="!w-full !h-full"
                                            contentClass="!w-full !h-full flex items-center justify-center"
                                        >
                                            <img
                                                src={selectedImage!}
                                                alt="Preview"
                                                style={{
                                                    transform: `rotate(${rotation}deg)`,
                                                    maxWidth: "100%",
                                                    maxHeight: "100%",
                                                    objectFit: "contain",
                                                }}
                                                className="rounded shadow-2xl transition-transform duration-200"
                                            />
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip Footer */}
                        <div className={`flex-none relative bg-neutral-900 border-t border-neutral-800 transition-all duration-300 ease-in-out ${showThumbnails ? 'h-24' : 'h-0'}`}>
                            {/* Toggle Tab Button */}
                            <button
                                onClick={() => setShowThumbnails(!showThumbnails)}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 border-b-0 rounded-t-lg px-6 py-1 text-[10px] font-medium text-neutral-400 hover:text-white transition-colors z-[70] flex items-center gap-1 shadow-sm"
                                title={showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
                            >
                                {showThumbnails ? (
                                    <>
                                        <span>Hide</span>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </>
                                ) : (
                                    <>
                                        <span>Show Thumbs</span>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                    </>
                                )}
                            </button>

                            <div className={`flex gap-2 h-full items-center justify-center w-full overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 px-4 py-2 ${showThumbnails ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                {sortedEvidences.map((ev, idx) => {
                                    const fileUrl = `/api/proxy-file?path=${ev.file_path}`;
                                    const isPdf = ev.file_path.toLowerCase().endsWith('.pdf');
                                    const isSelected = selectedImage === fileUrl || selectedPdf === fileUrl;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent closing
                                                if (isPdf) {
                                                    openPdfModal(fileUrl);
                                                } else {
                                                    openImageModal(fileUrl);
                                                }
                                            }}
                                            className={`relative group h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border transition-all duration-200 ${isSelected
                                                ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105 z-10'
                                                : 'border-neutral-700 opacity-60 hover:opacity-100 hover:border-neutral-500 hover:scale-105'
                                                }`}
                                        >
                                            {isPdf ? (
                                                <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center p-0.5">
                                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                    <span className="text-[8px] text-neutral-400 font-mono mt-0.5">PDF</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={fileUrl}
                                                    alt={`Thumb ${idx}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* StickyInfoBox - Floating info when viewer is open */}
            {
                (selectedImage || selectedPdf) && currentItem && (
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
                        tangalBapp={tanggalBapp}
                        setTanggalBapp={setTanggalBapp}
                        history={history}
                    />
                )
            }

            {/* Failed Log Modal */}
            {failedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-lg font-bold">Failed to Insert Log</h3>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                            The status was updated successfully, but saving the history log failed. Please retry.
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-lg text-sm font-mono break-all mb-6 border border-red-100 dark:border-red-900/50">
                            {failedLog.error}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setFailedLog(null)}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={retryLogInsert}
                                disabled={processingStatus === 'processing'}
                                className="px-5 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingStatus === 'processing' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Retrying...
                                    </>
                                ) : (
                                    'Retry Insert Log'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
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
