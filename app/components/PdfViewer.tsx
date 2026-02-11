"use client";

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState } from 'react';

// Set up worker
if (typeof window !== 'undefined' && pdfjs.version) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
    file: string;
    pageNumber?: number;
    scale?: number;
    rotate?: number;
    onLoadSuccess?: (data: { numPages: number }) => void;
    className?: string; // For Document container styling
    width?: number; // Optional specific width for Page
}

export default function PdfViewer({
    file,
    pageNumber = 1,
    scale = 1,
    rotate = 0,
    onLoadSuccess,
    className,
    width
}: PdfViewerProps) {
    return (
        <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            loading={
                <div className="flex flex-col items-center gap-3 text-neutral-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
                    <p className="text-xs font-medium opacity-80">Loading PDF...</p>
                </div>
            }
            error={
                <div className="text-red-500 text-sm p-4 text-center bg-red-50 rounded-lg">
                    Failed to load PDF document.
                </div>
            }
            rotate={rotate}
            className={className}
        >
            <Page
                pageNumber={pageNumber}
                scale={scale}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white shadow-sm"
            />
        </Document>
    );
}
