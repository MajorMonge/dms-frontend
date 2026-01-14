"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteDocument } from "@/lib/api/documents";
import toast from "react-hot-toast";

interface DeleteDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentName: string;
    onSuccess?: () => void;
}

export default function DeleteDocumentModal({
    isOpen,
    onClose,
    documentId,
    documentName,
    onSuccess,
}: DeleteDocumentModalProps) {
    const [isPermanent, setIsPermanent] = useState(false);
    
    const deleteDocument = useDeleteDocument({
        onSuccess: () => {
            toast.success(isPermanent ? "Document permanently deleted" : "Document moved to trash");
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete document");
            // Close modal on error too - cache is already refreshed
            onClose();
        },
    });

    const handleDelete = () => {
        deleteDocument.mutate({ id: documentId, permanent: isPermanent });
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen && !deleteDocument.isPending) {
            onClose();
        }
    };

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
                        onClick={() => !deleteDocument.isPending && onClose()}
                        onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler}
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
                            className="bg-base-100 rounded-xl shadow-xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-base-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-error/10 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-error" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Delete Document</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={deleteDocument.isPending}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <p className="text-base-content/80">
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-base-content">"{documentName}"</span>?
                                </p>
                                
                                {/* Permanent deletion checkbox */}
                                <div className="form-control mt-4">
                                    <label className="label cursor-pointer justify-start gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="checkbox checkbox-error" 
                                            checked={isPermanent}
                                            onChange={(e) => setIsPermanent(e.target.checked)}
                                            disabled={deleteDocument.isPending}
                                        />
                                        <div className="flex-1">
                                            <span className="label-text font-medium">Delete permanently</span>
                                            <p className="text-xs text-base-content/60 mt-0.5">
                                                Cannot be restored if permanently deleted
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                
                                {isPermanent ? (
                                    <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                                        <p className="text-sm text-error-content">
                                            <strong>Warning:</strong> This document will be permanently deleted and cannot be restored.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                                        <p className="text-sm text-info-content">
                                            <strong>Note:</strong> The document will be moved to trash. You can restore it within 30 days.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 p-4 border-t border-base-200">
                                <button
                                    className="btn btn-ghost"
                                    onClick={onClose}
                                    disabled={deleteDocument.isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-error"
                                    onClick={handleDelete}
                                    disabled={deleteDocument.isPending}
                                >
                                    {deleteDocument.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
