"use client";

import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteFolder } from "@/lib/api/folders";
import toast from "react-hot-toast";

interface DeleteFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    folderName: string;
    onSuccess?: () => void;
}

export default function DeleteFolderModal({
    isOpen,
    onClose,
    folderId,
    folderName,
    onSuccess,
}: DeleteFolderModalProps) {
    const deleteFolder = useDeleteFolder({
        onSuccess: (result) => {
            const message = result.documentsSoftDeleted > 0
                ? `Folder deleted. ${result.documentsSoftDeleted} document(s) moved to trash.`
                : "Folder deleted successfully";
            toast.success(message);
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete folder");
        },
    });

    const handleDelete = () => {
        deleteFolder.mutate(folderId);
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen && !deleteFolder.isPending) {
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
                        onClick={() => !deleteFolder.isPending && onClose()}
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
                                    <h3 className="text-lg font-semibold">Delete Folder</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={deleteFolder.isPending}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <p className="text-base-content/80">
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-base-content">"{folderName}"</span>?
                                </p>
                                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                                    <p className="text-sm text-warning-content">
                                        <strong>Warning:</strong> This action cannot be undone.
                                    </p>
                                    <ul className="mt-2 text-sm text-base-content/70 list-disc list-inside space-y-1">
                                        <li>The folder and all subfolders will be permanently deleted</li>
                                        <li>Documents inside will be moved to trash and can be restored</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-2 p-4 border-t border-base-200">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={onClose}
                                    disabled={deleteFolder.isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-error"
                                    onClick={handleDelete}
                                    disabled={deleteFolder.isPending}
                                >
                                    {deleteFolder.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete Folder
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
