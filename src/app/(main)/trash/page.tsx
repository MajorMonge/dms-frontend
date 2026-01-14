"use client";

import { useState } from "react";
import { Trash2, RotateCcw, Loader2, AlertTriangle, File, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrashDocuments, useRestoreDocument, useDeleteDocument, useEmptyTrash } from "@/lib/api/documents";
import type { Document } from "@/types/api";
import toast from "react-hot-toast";

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
    });
}

function getFileIcon(extension?: string) {
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
            <div className={`h-8 w-8 ${iconStyles[ext]} rounded-lg flex items-center justify-center text-xs font-bold`}>
                {labels[ext]}
            </div>
        );
    }
    return <File className="h-8 w-8 text-base-content/50" />;
}

function TrashItem({ 
    document, 
    onRestore, 
    onDelete,
    isRestoring,
    isDeleting 
}: { 
    document: Document; 
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    isRestoring: boolean;
    isDeleting: boolean;
}) {
    const isLoading = isRestoring || isDeleting;
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 group"
        >
            {getFileIcon(document.extension)}
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{document.name}</p>
                <p className="text-sm text-base-content/50">
                    {formatFileSize(document.size)} • Deleted {document.deletedAt ? formatDate(document.deletedAt) : ""}
                </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => onRestore(document.id)}
                    disabled={isLoading}
                    title="Restore"
                >
                    {isRestoring ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                </button>
                <button
                    className="btn btn-ghost btn-sm btn-square text-error"
                    onClick={() => onDelete(document.id)}
                    disabled={isLoading}
                    title="Delete permanently"
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </button>
            </div>
        </motion.div>
    );
}

export default function TrashPage() {
    const [page, setPage] = useState(1);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

    const { data, isLoading, error, refetch } = useTrashDocuments(page, 20);
    
    const restoreMutation = useRestoreDocument({
        onSuccess: () => {
            toast.success("Document restored");
            setRestoringId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to restore document");
            setRestoringId(null);
        },
    });

    const deleteMutation = useDeleteDocument({
        onSuccess: () => {
            toast.success("Document permanently deleted");
            setDeletingId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete document");
            setDeletingId(null);
        },
    });

    const emptyTrashMutation = useEmptyTrash({
        onSuccess: (result) => {
            toast.success(`Deleted ${result.deletedCount} document(s)`);
            setShowEmptyConfirm(false);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to empty trash");
        },
    });

    const handleRestore = (id: string) => {
        setRestoringId(id);
        restoreMutation.mutate(id);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        deleteMutation.mutate({ id, permanent: true });
    };

    const documents = data?.documents || [];
    const pagination = data?.pagination;
    const isEmpty = !isLoading && documents.length === 0;

    return (
        <div className="h-full bg-base-100 rounded-box p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Trash</h1>
                    <p className="text-base-content/70 text-sm">
                        Deleted files will be kept for 30 days before being permanently removed.
                    </p>
                </div>
                {documents.length > 0 && (
                    <button
                        className="btn btn-error btn-sm"
                        onClick={() => setShowEmptyConfirm(true)}
                        disabled={emptyTrashMutation.isPending}
                    >
                        {emptyTrashMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Empty Trash
                    </button>
                )}
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-error">
                    <AlertTriangle className="h-12 w-12 mb-2" />
                    <p>Failed to load trash</p>
                    <button className="btn btn-ghost btn-sm mt-2" onClick={() => refetch()}>
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state */}
            {isEmpty && (
                <div className="flex-1 flex flex-col items-center justify-center text-base-content/50">
                    <Trash2 className="h-16 w-16 mb-4" />
                    <p>Trash is empty</p>
                </div>
            )}

            {/* Documents list */}
            {!isLoading && !error && documents.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {documents.map((doc) => (
                            <TrashItem
                                key={doc.id}
                                document={doc}
                                onRestore={handleRestore}
                                onDelete={handleDelete}
                                isRestoring={restoringId === doc.id}
                                isDeleting={deletingId === doc.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-base-200">
                    <button
                        className="btn btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span className="btn btn-sm btn-ghost pointer-events-none">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        className="btn btn-sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Empty trash confirmation modal */}
            <AnimatePresence>
                {showEmptyConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowEmptyConfirm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-error/10 rounded-lg">
                                        <AlertTriangle className="h-6 w-6 text-error" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Empty Trash?</h3>
                                </div>
                                <p className="text-base-content/70 mb-6">
                                    This will permanently delete all {pagination?.total || documents.length} item(s) in trash. 
                                    This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setShowEmptyConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-error"
                                        onClick={() => emptyTrashMutation.mutate()}
                                        disabled={emptyTrashMutation.isPending}
                                    >
                                        {emptyTrashMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                        Empty Trash
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
