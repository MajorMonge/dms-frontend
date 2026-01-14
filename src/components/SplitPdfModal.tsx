"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X,
    Scissors,
    Loader2,
    FileText,
    Layers,
    SplitSquareVertical,
    FileOutput,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePdfInfo, splitPdf } from "@/lib/api/pdf";
import { 
    addProcessingTask, 
    updateProcessingProgress, 
    completeProcessing, 
    failProcessing 
} from "@/store/processing";
import { useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "@/lib/api/documents";
import { folderKeys } from "@/lib/api/folders";
import type { SplitMode, SplitPdfBody, SplitResultItem } from "@/lib/validations/pdf";
import toast from "react-hot-toast";

// ============= Form Schema =============

const splitFormSchema = z.object({
    mode: z.enum(["all", "ranges", "chunks", "extract"]),
    // For chunks mode
    chunkSize: z.number().int().min(1).max(100).optional(),
    // For ranges mode
    ranges: z.array(z.object({
        start: z.number().int().min(1).optional(),
        end: z.number().int().min(1).optional(),
    })).optional(),
    // For extract mode
    pages: z.string().optional(), // Comma-separated pages like "1, 3, 5-7"
    // Common options
    namePrefix: z.string().max(100).optional(),
});

type SplitFormData = z.infer<typeof splitFormSchema>;

// ============= Types =============

interface SplitPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentName: string;
    folderId?: string | null;
    onSuccess?: () => void;
}

// ============= Helper Functions =============

function parsePageRanges(input: string): number[] {
    const pages: number[] = [];
    const parts = input.split(",").map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
        if (part.includes("-")) {
            const [start, end] = part.split("-").map(s => parseInt(s.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    if (!pages.includes(i)) pages.push(i);
                }
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num) && !pages.includes(num)) {
                pages.push(num);
            }
        }
    }

    return pages.sort((a, b) => a - b);
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ============= Mode Info Cards =============

const modeInfo: Record<SplitMode, { icon: React.ReactNode; title: string; description: string }> = {
    all: {
        icon: <Layers className="h-5 w-5" />,
        title: "Split All Pages",
        description: "Each page becomes a separate PDF document",
    },
    chunks: {
        icon: <SplitSquareVertical className="h-5 w-5" />,
        title: "Split by Chunks",
        description: "Split into groups of N pages each",
    },
    ranges: {
        icon: <FileText className="h-5 w-5" />,
        title: "Split by Ranges",
        description: "Define custom page ranges for each output file",
    },
    extract: {
        icon: <FileOutput className="h-5 w-5" />,
        title: "Extract Pages",
        description: "Extract specific pages into a single new document",
    },
};

// ============= Component =============

export default function SplitPdfModal({
    isOpen,
    onClose,
    documentId,
    documentName,
    folderId,
    onSuccess,
}: SplitPdfModalProps) {
    const queryClient = useQueryClient();

    // Fetch PDF info
    const { data: pdfInfo, isLoading: pdfInfoLoading, error: pdfInfoError } = usePdfInfo(
        isOpen ? documentId : undefined
    );

    const {
        register,
        handleSubmit,
        watch,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm<SplitFormData>({
        resolver: zodResolver(splitFormSchema),
        defaultValues: {
            mode: "all",
            chunkSize: 5,
            ranges: [{ start: 1, end: undefined }],
            pages: "",
            namePrefix: "",
        },
    });

    const { fields: rangeFields, append: appendRange, remove: removeRange } = useFieldArray({
        control,
        name: "ranges",
    });

    const selectedMode = watch("mode");
    const chunkSize = watch("chunkSize");
    const pagesInput = watch("pages");

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset({
                mode: "all",
                chunkSize: 5,
                ranges: [{ start: 1, end: undefined }],
                pages: "",
                namePrefix: "",
            });
        }
    }, [isOpen, reset]);

    // Calculate preview info
    const previewInfo = useMemo(() => {
        if (!pdfInfo) return null;

        const pageCount = pdfInfo.pageCount;

        switch (selectedMode) {
            case "all":
                return {
                    outputCount: pageCount,
                    description: `Will create ${pageCount} separate PDF files`,
                };
            case "chunks": {
                const chunks = Math.ceil(pageCount / (chunkSize || 1));
                return {
                    outputCount: chunks,
                    description: `Will create ${chunks} files of ${chunkSize} pages each`,
                };
            }
            case "extract": {
                const pages = parsePageRanges(pagesInput || "");
                const validPages = pages.filter(p => p >= 1 && p <= pageCount);
                return {
                    outputCount: 1,
                    description: validPages.length > 0
                        ? `Will extract ${validPages.length} pages into 1 file`
                        : "Enter pages to extract",
                };
            }
            case "ranges":
                return {
                    outputCount: rangeFields.length,
                    description: `Will create ${rangeFields.length} files from defined ranges`,
                };
            default:
                return null;
        }
    }, [selectedMode, pdfInfo, chunkSize, pagesInput, rangeFields.length]);

    // Build request body
    const buildRequestBody = (data: SplitFormData): SplitPdfBody => {
        const body: SplitPdfBody = {
            mode: data.mode,
            folderId: folderId || null,
        };

        if (data.namePrefix) {
            body.namePrefix = data.namePrefix;
        }

        switch (data.mode) {
            case "chunks":
                body.chunkSize = data.chunkSize;
                break;
            case "ranges":
                body.ranges = (data.ranges || [])
                    .filter(r => r.start || r.end)
                    .map(r => ({
                        start: r.start,
                        end: r.end,
                    }));
                break;
            case "extract":
                body.pages = parsePageRanges(data.pages || "");
                break;
        }

        return body;
    };

    // Validate form
    const validateForm = (data: SplitFormData): string | null => {
        if (!pdfInfo) return "PDF info not loaded";

        switch (data.mode) {
            case "chunks":
                if (!data.chunkSize || data.chunkSize < 1) {
                    return "Chunk size must be at least 1";
                }
                break;
            case "ranges": {
                const validRanges = (data.ranges || []).filter(r => r.start || r.end);
                if (validRanges.length === 0) {
                    return "At least one range is required";
                }
                for (const range of validRanges) {
                    if (range.start && range.start > pdfInfo.pageCount) {
                        return `Start page ${range.start} exceeds document length (${pdfInfo.pageCount} pages)`;
                    }
                    if (range.end && range.end > pdfInfo.pageCount) {
                        return `End page ${range.end} exceeds document length (${pdfInfo.pageCount} pages)`;
                    }
                    if (range.start && range.end && range.start > range.end) {
                        return "Start page cannot be greater than end page";
                    }
                }
                break;
            }
            case "extract": {
                const pages = parsePageRanges(data.pages || "");
                if (pages.length === 0) {
                    return "At least one page is required";
                }
                const invalidPages = pages.filter(p => p > pdfInfo.pageCount);
                if (invalidPages.length > 0) {
                    return `Pages ${invalidPages.join(", ")} exceed document length (${pdfInfo.pageCount} pages)`;
                }
                break;
            }
        }

        return null;
    };

    const onSubmit = async (data: SplitFormData) => {
        const validationError = validateForm(data);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        const body = buildRequestBody(data);
        
        // Add to processing queue and close modal immediately
        const taskId = addProcessingTask(documentId, documentName, "split", data.mode);
        toast.success("PDF split started - check progress in the transfer indicator");
        onClose();

        // Start processing in background
        try {
            updateProcessingProgress(taskId, 10);
            
            const result = await splitPdf(documentId, body);
            
            // Complete processing
            completeProcessing(
                taskId,
                result.outputDocuments.map(doc => ({
                    name: doc.name,
                    pageCount: doc.pageCount,
                    size: doc.size,
                }))
            );

            // Invalidate queries to refresh file list
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: documentKeys.all }),
                queryClient.invalidateQueries({ queryKey: folderKeys.all }),
            ]);

            onSuccess?.();
        } catch (error) {
            failProcessing(taskId, error instanceof Error ? error.message : "Failed to split PDF");
        }
    };

    const handleClose = () => {
        onClose();
    };

    const isLoading = pdfInfoLoading;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-base-100 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-base-200 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Scissors className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Split PDF</h3>
                                        <p className="text-sm text-base-content/60 truncate max-w-xs">
                                            {documentName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Loading PDF Info */}
                                {pdfInfoLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-3">Loading PDF information...</span>
                                    </div>
                                )}

                                {/* PDF Info Error */}
                                {pdfInfoError && (
                                    <div className="alert alert-error">
                                        <AlertCircle className="h-5 w-5" />
                                        <span>
                                            Failed to load PDF information. The file might not be a valid PDF or is encrypted.
                                        </span>
                                    </div>
                                )}

                                {/* Configure Step */}
                                {pdfInfo && (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        {/* PDF Info Banner */}
                                        <div className="bg-base-200 rounded-lg p-3 flex items-center gap-3">
                                            <Info className="h-5 w-5 text-info shrink-0" />
                                            <div className="text-sm">
                                                <span className="font-medium">{pdfInfo.pageCount} pages</span>
                                                {pdfInfo.title && (
                                                    <span className="text-base-content/60 ml-2">
                                                        • {pdfInfo.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mode Selection */}
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Split Mode</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(Object.keys(modeInfo) as SplitMode[]).map((mode) => (
                                                    <label
                                                        key={mode}
                                                        className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${
                                                            selectedMode === mode
                                                                ? "ring-2 ring-primary bg-primary/5"
                                                                : ""
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            {...register("mode")}
                                                            value={mode}
                                                            className="hidden"
                                                        />
                                                        <div className="card-body p-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`p-1.5 rounded ${
                                                                    selectedMode === mode
                                                                        ? "bg-primary text-primary-content"
                                                                        : "bg-base-300"
                                                                }`}>
                                                                    {modeInfo[mode].icon}
                                                                </div>
                                                                <span className="font-medium text-sm">
                                                                    {modeInfo[mode].title}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-base-content/60 mt-1">
                                                                {modeInfo[mode].description}
                                                            </p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mode-specific Options */}
                                        <AnimatePresence mode="wait">
                                            {/* Chunks Mode */}
                                            {selectedMode === "chunks" && (
                                                <motion.div
                                                    key="chunks"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="form-control"
                                                >
                                                    <label className="label">
                                                        <span className="label-text">Pages per chunk</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        {...register("chunkSize", { valueAsNumber: true })}
                                                        min={1}
                                                        max={100}
                                                        className="input input-bordered w-full max-w-xs"
                                                    />
                                                    <label className="label">
                                                        <span className="label-text-alt text-base-content/60">
                                                            Each output file will contain up to this many pages
                                                        </span>
                                                    </label>
                                                </motion.div>
                                            )}

                                            {/* Ranges Mode */}
                                            {selectedMode === "ranges" && (
                                                <motion.div
                                                    key="ranges"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-3"
                                                >
                                                    <label className="label">
                                                        <span className="label-text">Page Ranges</span>
                                                        <span className="label-text-alt">
                                                            Total pages: {pdfInfo.pageCount}
                                                        </span>
                                                    </label>
                                                    
                                                    <div className="space-y-2">
                                                        {rangeFields.map((field, index) => (
                                                            <div key={field.id} className="flex items-center gap-2">
                                                                <span className="text-sm text-base-content/60 w-16">
                                                                    File {index + 1}:
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    {...register(`ranges.${index}.start`, { valueAsNumber: true })}
                                                                    placeholder="Start"
                                                                    min={1}
                                                                    max={pdfInfo.pageCount}
                                                                    className="input input-bordered input-sm w-24"
                                                                />
                                                                <span>to</span>
                                                                <input
                                                                    type="number"
                                                                    {...register(`ranges.${index}.end`, { valueAsNumber: true })}
                                                                    placeholder="End"
                                                                    min={1}
                                                                    max={pdfInfo.pageCount}
                                                                    className="input input-bordered input-sm w-24"
                                                                />
                                                                {rangeFields.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeRange(index)}
                                                                        className="btn btn-ghost btn-sm btn-square text-error"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => appendRange({ start: undefined, end: undefined })}
                                                        className="btn btn-ghost btn-sm"
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Range
                                                    </button>
                                                </motion.div>
                                            )}

                                            {/* Extract Mode */}
                                            {selectedMode === "extract" && (
                                                <motion.div
                                                    key="extract"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="form-control"
                                                >
                                                    <label className="label">
                                                        <span className="label-text">Pages to extract</span>
                                                        <span className="label-text-alt">
                                                            Total pages: {pdfInfo.pageCount}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...register("pages")}
                                                        placeholder="e.g., 1, 3, 5-7, 10"
                                                        className="input input-bordered w-full"
                                                    />
                                                    <label className="label">
                                                        <span className="label-text-alt text-base-content/60">
                                                            Use commas to separate pages, and dashes for ranges
                                                        </span>
                                                    </label>
                                                </motion.div>
                                            )}

                                            {/* All Mode - No extra options */}
                                            {selectedMode === "all" && (
                                                <motion.div
                                                    key="all"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="bg-base-200 rounded-lg p-4 text-center"
                                                >
                                                    <Layers className="h-8 w-8 mx-auto text-primary mb-2" />
                                                    <p className="text-sm text-base-content/80">
                                                        Each of the {pdfInfo.pageCount} pages will be saved as a separate PDF file.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Name Prefix */}
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Name prefix (optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                {...register("namePrefix")}
                                                placeholder={documentName.replace(".pdf", "")}
                                                className="input input-bordered w-full"
                                            />
                                            <label className="label">
                                                <span className="label-text-alt text-base-content/60">
                                                    Output files will be named: [prefix]_page_1.pdf, [prefix]_page_2.pdf, etc.
                                                </span>
                                            </label>
                                        </div>

                                        {/* Preview */}
                                        {previewInfo && (
                                            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                                                <p className="text-sm font-medium text-info-content">
                                                    Preview: {previewInfo.description}
                                                </p>
                                            </div>
                                        )}
                                    </form>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-base-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-ghost"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    className="btn btn-primary"
                                    disabled={isLoading || !pdfInfo}
                                >
                                    <Scissors className="h-4 w-4 mr-2" />
                                    Split PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
