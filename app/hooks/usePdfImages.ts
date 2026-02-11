"use client";

import { useState, useEffect, useRef } from "react";

// Global cache: key = `${url}_page${pageNumber}_w${width}`, value = dataUrl
const pageCache = new Map<string, string>();
const docCache = new Map<string, any>();

export function usePdfImage(file: string, pageNumber: number = 1, width: number = 800) {
    const [pageImage, setPageImage] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!file) {
            setLoading(false);
            return;
        }

        const cacheKey = `${file}_page${pageNumber}_w${width}`;

        // Check cache first
        if (pageCache.has(cacheKey)) {
            setPageImage(pageCache.get(cacheKey)!);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const renderPage = async () => {
            try {
                // Dynamically import pdfjs-dist
                const pdfjsLib = await import("pdfjs-dist");

                // Set worker source
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                }

                // Get or load the PDF document
                let pdf: any;
                if (docCache.has(file)) {
                    pdf = docCache.get(file);
                } else {
                    const loadingTask = pdfjsLib.getDocument(file);
                    pdf = await loadingTask.promise;
                    docCache.set(file, pdf);
                }

                if (cancelled) return;

                if (isMountedRef.current) {
                    setNumPages(pdf.numPages);
                }

                // Clamp page number
                const safePage = Math.max(1, Math.min(pageNumber, pdf.numPages));
                const page = await pdf.getPage(safePage);

                if (cancelled) return;

                // Calculate scale to match desired width
                const viewport = page.getViewport({ scale: 1 });
                const scale = width / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                // Create offscreen canvas
                const canvas = document.createElement("canvas");
                canvas.width = Math.floor(scaledViewport.width);
                canvas.height = Math.floor(scaledViewport.height);
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    throw new Error("Could not get canvas context");
                }

                await page.render({
                    canvasContext: ctx,
                    viewport: scaledViewport,
                }).promise;

                if (cancelled) return;

                const dataUrl = canvas.toDataURL("image/png");
                pageCache.set(cacheKey, dataUrl);

                if (isMountedRef.current) {
                    setPageImage(dataUrl);
                    setLoading(false);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled && isMountedRef.current) {
                    console.error("PDF render error:", err);
                    setError(err.message || "Failed to render PDF page");
                    setLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            cancelled = true;
        };
    }, [file, pageNumber, width]);

    return { pageImage, numPages, loading, error };
}

export function usePdfAllPages(file: string, width: number = 800) {
    const [pages, setPages] = useState<string[]>([]);
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!file) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        setPages([]);

        const renderAllPages = async () => {
            try {
                const pdfjsLib = await import("pdfjs-dist");

                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                }

                let pdf: any;
                if (docCache.has(file)) {
                    pdf = docCache.get(file);
                } else {
                    const loadingTask = pdfjsLib.getDocument(file);
                    pdf = await loadingTask.promise;
                    docCache.set(file, pdf);
                }

                if (cancelled) return;

                const total = pdf.numPages;
                if (isMountedRef.current) {
                    setNumPages(total);
                }

                const renderedPages: string[] = [];

                // Render pages one by one to avoid browser freeze and heavy memory usage
                for (let i = 1; i <= total; i++) {
                    if (cancelled) return;

                    const cacheKey = `${file}_page${i}_w${width}`;
                    if (pageCache.has(cacheKey)) {
                        renderedPages.push(pageCache.get(cacheKey)!);
                        if (isMountedRef.current) {
                            setPages([...renderedPages]);
                        }
                        continue;
                    }

                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = width / viewport.width;
                    const scaledViewport = page.getViewport({ scale });

                    const canvas = document.createElement("canvas");
                    canvas.width = Math.floor(scaledViewport.width);
                    canvas.height = Math.floor(scaledViewport.height);
                    const ctx = canvas.getContext("2d");

                    if (!ctx) throw new Error("Could not get canvas context");

                    await page.render({
                        canvasContext: ctx,
                        viewport: scaledViewport,
                    }).promise;

                    const dataUrl = canvas.toDataURL("image/png");
                    pageCache.set(cacheKey, dataUrl);
                    renderedPages.push(dataUrl);

                    if (isMountedRef.current) {
                        setPages([...renderedPages]);
                    }
                }

                if (isMountedRef.current) {
                    setLoading(false);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled && isMountedRef.current) {
                    console.error("PDF all pages render error:", err);
                    setError(err.message || "Failed to render PDF pages");
                    setLoading(false);
                }
            }
        };

        renderAllPages();

        return () => {
            cancelled = true;
        };
    }, [file, width]);

    return { pages, numPages, loading, error };
}
