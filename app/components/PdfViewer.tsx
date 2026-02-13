"use client";

import { useEffect } from "react";
import { usePdfImage, usePdfAllPages } from "../hooks/usePdfImages";

interface PdfViewerProps {
    file: string;
    pageNumber?: number;
    width?: number;
    scale?: number;
    rotate?: number;
    allPages?: boolean;
    onLoadSuccess?: (data: { numPages: number }) => void;
    className?: string;
}

export default function PdfViewer({
    file,
    pageNumber = 1,
    width = 800,
    scale = 1,
    rotate = 0,
    allPages = false,
    onLoadSuccess,
    className,
}: PdfViewerProps) {
    const singlePage = usePdfImage(file, pageNumber, width);
    const multiPage = usePdfAllPages(file, width);

    const { numPages, loading, error } = allPages ? multiPage : singlePage;
    const pageImage = (singlePage as any).pageImage;
    const pages = (multiPage as any).pages;

    // Notify parent of total pages when available (in useEffect to avoid setState during render)
    useEffect(() => {
        if (numPages > 0 && onLoadSuccess) {
            onLoadSuccess({ numPages });
        }
    }, [numPages, onLoadSuccess]);

    if (error) {
        return (
            <div className={className}>
                <div className="flex flex-col items-center justify-center p-4 h-full text-red-500 text-sm">
                    <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>Failed to load PDF</p>
                </div>
            </div>
        );
    }

    if (loading || (allPages ? pages.length === 0 : !pageImage)) {
        return (
            <div className={className}>
                <div className="flex items-center justify-center p-4 h-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-600"></div>
                </div>
            </div>
        );
    }

    if (allPages) {
        return (
            <div className={`flex flex-col gap-4 items-center ${className}`}>
                {pages.map((img: string, idx: number) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`PDF page ${idx + 1}`}
                        className="shadow-md w-full h-full object-contain"
                        style={{
                            transform: `scale(${scale}) rotate(${rotate}deg)`,
                            transformOrigin: "center center",
                            transition: "transform 0.2s ease-out",
                            marginBottom: idx === pages.length - 1 ? 0 : '1rem'
                        }}
                        draggable={false}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={className}>
            <img
                src={pageImage}
                alt={`PDF page ${pageNumber}`}
                className="w-full h-full object-contain shadow-md"
                style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease-out",
                }}
                draggable={false}
            />
        </div>
    );
}
