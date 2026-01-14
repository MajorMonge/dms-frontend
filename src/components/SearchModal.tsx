"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    X,
    File,
    Folder,
    Loader2,
    Filter,
    Calendar,
    HardDrive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchDocuments, type SearchDocumentsParams } from "@/lib/api/documents";
import { useDebounce } from "@/hooks/useDebounce";
import type { Document } from "@/types/api";

// ============= Types =============

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDocument?: (doc: Document) => void;
}

// ============= Helper Functions =============

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getFileIcon(extension?: string) {
    const iconClass = "h-8 w-8";
    const textSize = "text-xs";

    const iconStyles: Record<string, string> = {
        pdf: "bg-red-100 text-red-600",
        xlsx: "bg-green-100 text-green-600",
        xls: "bg-green-100 text-green-600",
        docx: "bg-blue-100 text-blue-600",
        doc: "bg-blue-100 text-blue-600",
        pptx: "bg-orange-100 text-orange-600",
        ppt: "bg-orange-100 text-orange-600",
    };

    const labels: Record<string, string> = {
        pdf: "PDF",
        xlsx: "XLS",
        xls: "XLS",
        docx: "DOC",
        doc: "DOC",
        pptx: "PPT",
        ppt: "PPT",
    };

    const ext = extension?.toLowerCase() || "";
    if (iconStyles[ext]) {
        return (
            <div
                className={`${iconClass} ${iconStyles[ext]} rounded-lg flex items-center justify-center ${textSize} font-bold flex-shrink-0`}
            >
                {labels[ext]}
            </div>
        );
    }
    return <File className={`${iconClass} text-base-content/50 flex-shrink-0`} />;
}

// ============= Component =============


export default function SearchModal({
    isOpen,
    onClose,
    onSelectDocument,
}: SearchModalProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<{
        extension?: string;
        minSize?: number;
        maxSize?: number;
        dateFrom?: string;
        dateTo?: string;
    }>({});
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const debouncedQuery = useDebounce(query, 300);

    const searchParams: SearchDocumentsParams = {
        query: debouncedQuery,
        extension: filters.extension,
        minSize: filters.minSize,
        maxSize: filters.maxSize,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: 20,
        sortBy: "relevance",
    };

    const { data, isLoading, isFetching } = useSearchDocuments(
        searchParams,
        isOpen && debouncedQuery.length >= 2
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setShowFilters(false);
            setFilters({});
            setActiveIndex(-1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && data?.documents && data.documents.length > 0 && debouncedQuery.length >= 2) {
            setActiveIndex(0);
        } else {
            setActiveIndex(-1);
        }
    }, [data?.documents, isOpen, debouncedQuery]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
            if (debouncedQuery.length >= 2 && data?.documents?.length) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) => {
                        const next = prev < data.documents.length - 1 ? prev + 1 : 0;
                        return next;
                    });
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) => {
                        const next = prev > 0 ? prev - 1 : data.documents.length - 1;
                        return next;
                    });
                } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < data.documents.length) {
                    e.preventDefault();
                    handleSelectDocument(data.documents[activeIndex]);
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, debouncedQuery, data, activeIndex, onClose]);

    // Scroll active item into view
    useEffect(() => {
        if (!isOpen) return;
        if (activeIndex < 0) return;
        const results = resultsRef.current;
        if (results) {
            const item = results.querySelectorAll<HTMLButtonElement>("button[data-result-item]")[activeIndex];
            if (item) {
                item.scrollIntoView({ block: "nearest" });
            }
        }
    }, [activeIndex, isOpen]);

    const handleSelectDocument = (doc: Document) => {
        if (onSelectDocument) {
            onSelectDocument(doc);
        } else {
            // Navigate to the folder containing the document and select the file
            const params = new URLSearchParams();
            if (doc.folderId) {
                params.set("folder", doc.folderId);
            }
            params.set("file", doc.id);
            router.push(`/?${params.toString()}`);
        }
        onClose();
    };

    const clearFilters = () => {
        setFilters({});
    };

    const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");
    const showResults = debouncedQuery.length >= 2;
    const documents = data?.documents || [];
    const searchMeta = data?.searchMeta;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                    >
                        <div
                            className="bg-base-100 rounded-xl shadow-2xl border border-base-200 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 p-4 border-b border-base-200">
                                <Search className="h-5 w-5 text-base-content/50 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search documents..."
                                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-base-content/40"
                                />
                                {(isLoading || isFetching) && (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                                )}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`btn btn-ghost btn-sm btn-square ${
                                        showFilters || hasFilters ? "text-primary" : ""
                                    }`}
                                    title="Filters"
                                >
                                    <Filter className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-square"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Filters Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-b border-base-200"
                                    >
                                        <div className="p-4 bg-base-200/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Filters</span>
                                                {hasFilters && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {/* File Type */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs">File type</span>
                                                    </label>
                                                    <select
                                                        value={filters.extension || ""}
                                                        onChange={(e) =>
                                                            setFilters({
                                                                ...filters,
                                                                extension: e.target.value || undefined,
                                                            })
                                                        }
                                                        className="select select-bordered select-sm w-full"
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="pdf">PDF</option>
                                                        <option value="docx">Word</option>
                                                        <option value="xlsx">Excel</option>
                                                        <option value="pptx">PowerPoint</option>
                                                        <option value="jpg">Images</option>
                                                    </select>
                                                </div>

                                                {/* Min Size */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs">Min size</span>
                                                    </label>
                                                    <select
                                                        value={filters.minSize?.toString() || ""}
                                                        onChange={(e) =>
                                                            setFilters({
                                                                ...filters,
                                                                minSize: e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : undefined,
                                                            })
                                                        }
                                                        className="select select-bordered select-sm w-full"
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="102400">100 KB</option>
                                                        <option value="1048576">1 MB</option>
                                                        <option value="10485760">10 MB</option>
                                                    </select>
                                                </div>

                                                {/* Date From */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs">From date</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={filters.dateFrom || ""}
                                                        onChange={(e) =>
                                                            setFilters({
                                                                ...filters,
                                                                dateFrom: e.target.value || undefined,
                                                            })
                                                        }
                                                        className="input input-bordered input-sm w-full"
                                                    />
                                                </div>

                                                {/* Date To */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs">To date</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={filters.dateTo || ""}
                                                        onChange={(e) =>
                                                            setFilters({
                                                                ...filters,
                                                                dateTo: e.target.value || undefined,
                                                            })
                                                        }
                                                        className="input input-bordered input-sm w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Results */}
                            <div className="max-h-[60vh] overflow-y-auto" ref={resultsRef}>
                                {/* Empty state - type to search */}
                                {!showResults && (
                                    <div className="p-8 text-center text-base-content/50">
                                        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>Type at least 2 characters to search</p>
                                        <p className="text-sm mt-1">
                                            Press <kbd className="kbd kbd-sm">Ctrl</kbd> +{" "}
                                            <kbd className="kbd kbd-sm">K</kbd> to open search anytime
                                        </p>
                                    </div>
                                )}

                                {/* Loading state */}
                                {showResults && isLoading && (
                                    <div className="p-8 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-base-content/50">Searching...</p>
                                    </div>
                                )}

                                {/* No results */}
                                {showResults && !isLoading && documents.length === 0 && (
                                    <div className="p-8 text-center text-base-content/50">
                                        <File className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>No documents found</p>
                                        <p className="text-sm mt-1">
                                            Try different keywords or adjust filters
                                        </p>
                                    </div>
                                )}

                                {/* Results list */}
                                {showResults && !isLoading && documents.length > 0 && (
                                    <div className="divide-y divide-base-200">
                                        {/* Search meta */}
                                        {searchMeta && (
                                            <div className="px-4 py-2 bg-base-200/30 text-xs text-base-content/60">
                                                Found {searchMeta.resultsFound} result
                                                {searchMeta.resultsFound !== 1 ? "s" : ""} in{" "}
                                                {searchMeta.searchTime}ms
                                            </div>
                                        )}

                                        {/* Document items */}
                                        {documents.map((doc, idx) => (
                                            <button
                                                key={doc.id}
                                                data-result-item
                                                onClick={() => handleSelectDocument(doc)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                                                    idx === activeIndex
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-base-200/50"
                                                }`}
                                                tabIndex={-1}
                                            >
                                                {getFileIcon(doc.extension)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{doc.name}</p>
                                                    <div className="flex items-center gap-3 text-xs text-base-content/50">
                                                        <span className="flex items-center gap-1">
                                                            <HardDrive className="h-3 w-3" />
                                                            {formatFileSize(doc.size)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(doc.updatedAt)}
                                                        </span>
                                                        {doc.folderId && (
                                                            <span className="flex items-center gap-1 truncate">
                                                                <Folder className="h-3 w-3" />
                                                                In folder
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-base-content/40 uppercase">
                                                    {doc.extension}
                                                </span>
                                            </button>
                                        ))}
                                        {/* Details panel for active document */}
                                    </div>
                                )}
                                {/* Details panel for active document (moved outside .map) */}
                                {showResults && !isLoading && documents.length > 0 && activeIndex >= 0 && documents[activeIndex] && (
                                    <div className="p-4 border-t border-base-200 bg-base-100 animate-fade-in">
                                        <div className="flex items-center gap-4 mb-2">
                                            {getFileIcon(documents[activeIndex].extension)}
                                            <div>
                                                <div className="font-semibold text-lg truncate">{documents[activeIndex].name}</div>
                                                <div className="text-xs text-base-content/50">
                                                    {documents[activeIndex].extension?.toUpperCase()} &bull; {formatFileSize(documents[activeIndex].size)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="font-medium">Modified:</span> {formatDate(documents[activeIndex].updatedAt)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Created:</span> {formatDate(documents[activeIndex].createdAt)}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="font-medium">ID:</span> {documents[activeIndex].id}
                                            </div>
                                            {documents[activeIndex].folderId && (
                                                <div className="col-span-2">
                                                    <span className="font-medium">Folder ID:</span> {documents[activeIndex].folderId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-3 border-t border-base-200 bg-base-200/30 text-xs text-base-content/50">
                                <div className="flex items-center gap-4">
                                    <span>
                                        <kbd className="kbd kbd-xs">↑</kbd>{" "}
                                        <kbd className="kbd kbd-xs">↓</kbd> to navigate
                                    </span>
                                    <span>
                                        <kbd className="kbd kbd-xs">Enter</kbd> to select
                                    </span>
                                </div>
                                <span>
                                    <kbd className="kbd kbd-xs">Esc</kbd> to close
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
