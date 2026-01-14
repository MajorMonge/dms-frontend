"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    X,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    File,
    Loader2,
    RotateCcw,
    Trash2,
} from "lucide-react";
import {
    uploadStore,
    removeUpload,
    clearCompletedUploads,
    retryUpload,
    getTotalProgress,
} from "@/store/uploads";

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(extension?: string, size: "sm" | "md" = "sm") {
    const iconClass = size === "sm" ? "h-5 w-5" : "h-8 w-8";
    const textSize = size === "sm" ? "text-[8px]" : "text-xs";

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
        pdf: "PDF", xlsx: "XLS", xls: "XLS",
        docx: "DOC", doc: "DOC", pptx: "PPT", ppt: "PPT",
    };

    const ext = extension?.toLowerCase() || "";
    if (iconStyles[ext]) {
        return (
            <div className={`${iconClass} ${iconStyles[ext]} rounded flex items-center justify-center ${textSize} font-bold flex-shrink-0`}>
                {labels[ext]}
            </div>
        );
    }
    return <File className={`${iconClass} text-base-content/50 flex-shrink-0`} />;
}

function getExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() || "" : "";
}

export default function UploadIndicator() {
    const { uploads, isUploading } = useStore(uploadStore);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    // Only show if there are uploads
    if (uploads.length === 0) {
        return null;
    }

    const activeCount = uploads.filter(
        (u) => u.status === "pending" || u.status === "uploading"
    ).length;
    const completedCount = uploads.filter((u) => u.status === "completed").length;
    const errorCount = uploads.filter((u) => u.status === "error").length;
    const totalProgress = getTotalProgress();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-error" />;
            case "uploading":
                return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
            default:
                return <div className="h-4 w-4 rounded-full border-2 border-base-300" />;
        }
    };

    const getStatusText = () => {
        if (activeCount > 0) {
            return `Uploading ${activeCount} file${activeCount !== 1 ? "s" : ""}...`;
        }
        if (errorCount > 0 && completedCount > 0) {
            return `${completedCount} completed, ${errorCount} failed`;
        }
        if (errorCount > 0) {
            return `${errorCount} upload${errorCount !== 1 ? "s" : ""} failed`;
        }
        return `${completedCount} upload${completedCount !== 1 ? "s" : ""} complete`;
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 w-80 bg-base-100 rounded-xl shadow-2xl border border-base-200 overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 bg-base-200/50 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isUploading ? (
                        <div className="relative">
                            <Upload className="h-5 w-5 text-primary" />
                            <motion.div
                                className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                        </div>
                    ) : errorCount > 0 ? (
                        <AlertCircle className="h-5 w-5 text-error" />
                    ) : (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <div className="flex items-center gap-1">
                    {completedCount > 0 && !isUploading && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearCompletedUploads();
                            }}
                            className="btn btn-ghost btn-xs"
                            title="Clear completed"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                    <button className="btn btn-ghost btn-xs btn-square">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Progress bar (always visible) */}
            {isUploading && (
                <div className="h-1 bg-base-200">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            {/* Upload list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto">
                            {uploads.map((upload) => (
                                <motion.div
                                    key={upload.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-2 p-2 border-b border-base-200 last:border-b-0 hover:bg-base-200/50"
                                >
                                    {getFileIcon(getExtension(upload.file.name))}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{upload.file.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-base-content/50">
                                                {formatFileSize(upload.file.size)}
                                            </span>
                                            {upload.status === "uploading" && (
                                                <span className="text-xs text-primary">
                                                    {upload.progress}%
                                                </span>
                                            )}
                                            {upload.status === "error" && (
                                                <span className="text-xs text-error truncate">
                                                    {upload.error}
                                                </span>
                                            )}
                                        </div>
                                        {upload.status === "uploading" && (
                                            <div className="mt-1 h-1 bg-base-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-primary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(upload.status)}
                                        {upload.status === "error" && (
                                            <button
                                                onClick={() => retryUpload(upload.id)}
                                                className="btn btn-ghost btn-xs btn-square"
                                                title="Retry"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                            </button>
                                        )}
                                        {(upload.status === "completed" || upload.status === "error") && (
                                            <button
                                                onClick={() => removeUpload(upload.id)}
                                                className="btn btn-ghost btn-xs btn-square"
                                                title="Remove"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
