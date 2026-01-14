"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    Download,
    X,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    File,
    Loader2,
    RotateCcw,
    Trash2,
    Package,
    Scissors,
} from "lucide-react";
import {
    uploadStore,
    removeUpload,
    clearCompletedUploads,
    retryUpload,
    getTotalProgress,
} from "@/store/uploads";
import {
    downloadStore,
    removeDownload,
    clearCompletedDownloads,
    getTotalDownloadProgress,
} from "@/store/downloads";
import {
    processingStore,
    removeProcessingTask,
    clearCompletedProcessing,
    getTotalProcessingProgress,
} from "@/store/processing";

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

export default function TransferIndicator() {
    const { uploads, isUploading } = useStore(uploadStore);
    const { downloads, isDownloading } = useStore(downloadStore);
    const { items: processingItems, isProcessing } = useStore(processingStore);
    const [isExpanded, setIsExpanded] = useState(true);

    // Only show if there are transfers
    const hasTransfers = uploads.length > 0 || downloads.length > 0 || processingItems.length > 0;
    if (!hasTransfers) {
        return null;
    }

    // Upload stats
    const uploadActiveCount = uploads.filter(
        (u) => u.status === "pending" || u.status === "uploading"
    ).length;
    const uploadCompletedCount = uploads.filter((u) => u.status === "completed").length;
    const uploadErrorCount = uploads.filter((u) => u.status === "error").length;
    const uploadProgress = getTotalProgress();

    // Download stats
    const downloadActiveCount = downloads.filter(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping"
    ).length;
    const downloadCompletedCount = downloads.filter((d) => d.status === "completed").length;
    const downloadErrorCount = downloads.filter((d) => d.status === "error").length;
    const downloadProgress = getTotalDownloadProgress();

    // Processing stats
    const processingActiveCount = processingItems.filter(
        (p) => p.status === "pending" || p.status === "processing"
    ).length;
    const processingCompletedCount = processingItems.filter((p) => p.status === "completed").length;
    const processingErrorCount = processingItems.filter((p) => p.status === "error").length;
    const processingProgress = getTotalProcessingProgress();

    // Combined stats
    const isActive = isUploading || isDownloading || isProcessing;
    const totalCompleted = uploadCompletedCount + downloadCompletedCount + processingCompletedCount;
    const totalErrors = uploadErrorCount + downloadErrorCount + processingErrorCount;

    // Overall progress (weighted average)
    const totalActiveCount = uploadActiveCount + downloadActiveCount + processingActiveCount;
    const totalProgress = isActive
        ? Math.round(
            (uploadActiveCount * uploadProgress + 
             downloadActiveCount * downloadProgress + 
             processingActiveCount * processingProgress) /
            Math.max(totalActiveCount, 1)
          )
        : 100;

    const getStatusIcon = (status: string, type: "upload" | "download" | "processing") => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-error" />;
            case "uploading":
            case "downloading":
            case "zipping":
            case "processing":
                return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
            default:
                return <div className="h-4 w-4 rounded-full border-2 border-base-300" />;
        }
    };

    const getStatusText = () => {
        const parts: string[] = [];
        
        if (uploadActiveCount > 0) {
            parts.push(`Uploading ${uploadActiveCount}`);
        }
        if (downloadActiveCount > 0) {
            parts.push(`Downloading ${downloadActiveCount}`);
        }
        if (processingActiveCount > 0) {
            parts.push(`Processing ${processingActiveCount}`);
        }
        
        if (parts.length > 0) {
            return parts.join(", ");
        }
        
        if (totalErrors > 0 && totalCompleted > 0) {
            return `${totalCompleted} completed, ${totalErrors} failed`;
        }
        if (totalErrors > 0) {
            return `${totalErrors} transfer${totalErrors !== 1 ? "s" : ""} failed`;
        }
        return `${totalCompleted} transfer${totalCompleted !== 1 ? "s" : ""} complete`;
    };

    const handleClearCompleted = (e: React.MouseEvent) => {
        e.stopPropagation();
        clearCompletedUploads();
        clearCompletedDownloads();
        clearCompletedProcessing();
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
                    {isActive ? (
                        <div className="relative flex items-center gap-1">
                            {isUploading && <Upload className="h-4 w-4 text-primary" />}
                            {isDownloading && <Download className="h-4 w-4 text-secondary" />}
                            {isProcessing && <Scissors className="h-4 w-4 text-accent" />}
                            <motion.div
                                className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                        </div>
                    ) : totalErrors > 0 ? (
                        <AlertCircle className="h-5 w-5 text-error" />
                    ) : (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <div className="flex items-center gap-1">
                    {totalCompleted > 0 && !isActive && (
                        <button
                            onClick={handleClearCompleted}
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

            {/* Progress bar (always visible when active) */}
            {isActive && (
                <div className="h-1 bg-base-200">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            {/* Transfer list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto">
                            {/* Uploads */}
                            {uploads.map((upload) => (
                                <motion.div
                                    key={`upload-${upload.id}`}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-2 p-2 border-b border-base-200 last:border-b-0 hover:bg-base-200/50"
                                >
                                    <div className="relative">
                                        {getFileIcon(getExtension(upload.file.name))}
                                        <Upload className="absolute -bottom-1 -right-1 h-3 w-3 text-primary bg-base-100 rounded-full" />
                                    </div>
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
                                        {getStatusIcon(upload.status, "upload")}
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

                            {/* Downloads */}
                            {downloads.map((download) => (
                                <motion.div
                                    key={`download-${download.id}`}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-2 p-2 border-b border-base-200 last:border-b-0 hover:bg-base-200/50"
                                >
                                    <div className="relative">
                                        {download.fileCount > 1 ? (
                                            <Package className="h-5 w-5 text-secondary" />
                                        ) : (
                                            getFileIcon(getExtension(download.name))
                                        )}
                                        <Download className="absolute -bottom-1 -right-1 h-3 w-3 text-secondary bg-base-100 rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{download.name}</p>
                                        <div className="flex items-center gap-2">
                                            {download.size && download.size > 0 && (
                                                <span className="text-xs text-base-content/50">
                                                    {formatFileSize(download.size)}
                                                </span>
                                            )}
                                            {download.fileCount > 1 && (
                                                <span className="text-xs text-base-content/50">
                                                    {download.fileCount} files
                                                </span>
                                            )}
                                            {(download.status === "downloading" || download.status === "zipping") && (
                                                <span className="text-xs text-secondary">
                                                    {download.status === "zipping" ? "Zipping..." : `${download.progress}%`}
                                                </span>
                                            )}
                                            {download.status === "error" && (
                                                <span className="text-xs text-error truncate">
                                                    {download.error}
                                                </span>
                                            )}
                                        </div>
                                        {download.currentFile && download.status === "downloading" && (
                                            <p className="text-xs text-base-content/40 truncate">
                                                {download.currentFileIndex}/{download.fileCount}: {download.currentFile}
                                            </p>
                                        )}
                                        {(download.status === "downloading" || download.status === "zipping") && (
                                            <div className="mt-1 h-1 bg-base-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-secondary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${download.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(download.status, "download")}
                                        {(download.status === "completed" || download.status === "error") && (
                                            <button
                                                onClick={() => removeDownload(download.id)}
                                                className="btn btn-ghost btn-xs btn-square"
                                                title="Remove"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Processing Tasks */}
                            {processingItems.map((task) => (
                                <motion.div
                                    key={`processing-${task.id}`}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-2 p-2 border-b border-base-200 last:border-b-0 hover:bg-base-200/50"
                                >
                                    <div className="relative">
                                        <Scissors className="h-5 w-5 text-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{task.documentName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-base-content/50 capitalize">
                                                Split ({task.mode || "all"})
                                            </span>
                                            {task.status === "processing" && (
                                                <span className="text-xs text-accent">
                                                    Processing...
                                                </span>
                                            )}
                                            {task.status === "completed" && task.outputCount && (
                                                <span className="text-xs text-success">
                                                    {task.outputCount} files created
                                                </span>
                                            )}
                                            {task.status === "error" && (
                                                <span className="text-xs text-error truncate">
                                                    {task.error}
                                                </span>
                                            )}
                                        </div>
                                        {task.status === "processing" && (
                                            <div className="mt-1 h-1 bg-base-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-accent"
                                                    initial={{ width: "5%" }}
                                                    animate={{ width: "90%" }}
                                                    transition={{ duration: 30, ease: "linear" }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(task.status, "processing")}
                                        {(task.status === "completed" || task.status === "error") && (
                                            <button
                                                onClick={() => removeProcessingTask(task.id)}
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
