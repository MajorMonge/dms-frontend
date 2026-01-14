"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteDocument } from "@/lib/api/documents";
import { useDeleteFolder } from "@/lib/api/folders";
import toast from "react-hot-toast";

interface DeleteItem {
    id: string;
    name: string;
    type: "file" | "folder";
}

interface BulkDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: DeleteItem[];
    onSuccess?: () => void;
}

export default function BulkDeleteModal({
    isOpen,
    onClose,
    items,
    onSuccess,
}: BulkDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [progress, setProgress] = useState(0);

    const deleteDocument = useDeleteDocument();
    const deleteFolder = useDeleteFolder();

    const handleDelete = async () => {
        if (items.length === 0) return;
        
        setIsDeleting(true);
        setProgress(0);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                if (item.type === "folder") {
                    await deleteFolder.mutateAsync(item.id);
                } else {
                    await deleteDocument.mutateAsync({ id: item.id });
                }
                successCount++;
            } catch (err) {
                console.error(`Failed to delete ${item.name}:`, err);
                errorCount++;
            }
            setProgress(((i + 1) / items.length) * 100);
        }
        
        setIsDeleting(false);
        
        if (errorCount === 0) {
            toast.success(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''}`);
        } else if (successCount === 0) {
            toast.error(`Failed to delete all items`);
        } else {
            toast.success(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''}, ${errorCount} failed`);
        }
        
        onClose();
        onSuccess?.();
    };

    const folderCount = items.filter(i => i.type === "folder").length;
    const fileCount = items.filter(i => i.type === "file").length;

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
                        onClick={() => !isDeleting && onClose()}
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
                                    <h3 className="text-lg font-semibold">Delete {items.length} Items</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={isDeleting}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <p className="text-base-content/80">
                                    Are you sure you want to delete the selected items?
                                </p>
                                <div className="mt-2 text-sm text-base-content/60">
                                    {folderCount > 0 && (
                                        <span>{folderCount} folder{folderCount !== 1 ? 's' : ''}</span>
                                    )}
                                    {folderCount > 0 && fileCount > 0 && <span> and </span>}
                                    {fileCount > 0 && (
                                        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                                
                                {folderCount > 0 && (
                                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                                        <p className="text-sm text-warning-content">
                                            <strong>Warning:</strong> Folders will be permanently deleted. Documents inside will be moved to trash.
                                        </p>
                                    </div>
                                )}
                                
                                {folderCount === 0 && (
                                    <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                                        <p className="text-sm text-info-content">
                                            <strong>Note:</strong> Files will be moved to trash. You can restore them within 30 days.
                                        </p>
                                    </div>
                                )}
                                
                                {isDeleting && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Deleting...</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <progress 
                                            className="progress progress-error w-full" 
                                            value={progress} 
                                            max="100"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 p-4 border-t border-base-200">
                                <button
                                    className="btn btn-ghost"
                                    onClick={onClose}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-error"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete All
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
