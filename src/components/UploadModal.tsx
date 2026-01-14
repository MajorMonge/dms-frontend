"use client";

import { useState, useCallback, useRef } from "react";
import { X, Upload, FileUp, AlertCircle, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addUploads } from "@/store/uploads";
import { 
    MAX_FILE_SIZE_MB, 
    MAX_FILE_SIZE_BYTES, 
    ALLOWED_FILE_EXTENSIONS,
    FILE_INPUT_ACCEPT 
} from "@/lib/validations/document";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? (parts.pop()?.toLowerCase() || "") : "";
}

function isAllowedFileType(filename: string): boolean {
    const ext = getFileExtension(filename);
    return ALLOWED_FILE_EXTENSIONS.includes(ext);
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
            <div className={`h-8 w-8 ${iconStyles[ext]} rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                {labels[ext]}
            </div>
        );
    }
    return <File className="h-8 w-8 text-base-content/50 flex-shrink-0" />;
}

export default function UploadModal({ isOpen, onClose, folderId }: UploadModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAndAddFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const validFiles: File[] = [];
        const newErrors: string[] = [];

        fileArray.forEach((file) => {
            if (!isAllowedFileType(file.name)) {
                const ext = getFileExtension(file.name) || 'unknown';
                newErrors.push(`${file.name}: File type ".${ext}" is not allowed`);
            } else if (file.size > MAX_FILE_SIZE_BYTES) {
                newErrors.push(`${file.name}: File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
            } else if (file.size === 0) {
                newErrors.push(`${file.name}: Empty file`);
            } else {
                // Check for duplicates
                const isDuplicate = files.some(
                    (f) => f.name === file.name && f.size === file.size
                );
                if (!isDuplicate) {
                    validFiles.push(file);
                }
            }
        });

        setFiles((prev) => [...prev, ...validFiles]);
        if (newErrors.length > 0) {
            setErrors((prev) => [...prev, ...newErrors]);
        }
    }, [files]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        if (e.dataTransfer.files.length > 0) {
            validateAndAddFiles(e.dataTransfer.files);
        }
    }, [validateAndAddFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(e.target.files);
        }
        // Reset input so same file can be selected again
        e.target.value = "";
    }, [validateAndAddFiles]);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const handleStartUpload = useCallback(() => {
        if (files.length === 0) return;
        
        // Add all files to the upload queue
        addUploads(files, folderId);
        
        // Clear state and close modal
        setFiles([]);
        setErrors([]);
        onClose();
    }, [files, folderId, onClose]);

    const handleClose = useCallback(() => {
        setFiles([]);
        setErrors([]);
        setIsDragOver(false);
        onClose();
    }, [onClose]);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

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
                            className="bg-base-100 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-base-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Upload className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Upload Files</h3>
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
                                {/* Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                                        transition-colors
                                        ${isDragOver 
                                            ? "border-primary bg-primary/5" 
                                            : "border-base-300 hover:border-primary/50 hover:bg-base-200"
                                        }
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept={FILE_INPUT_ACCEPT}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <FileUp className={`h-12 w-12 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-base-content/30"}`} />
                                    <p className="font-medium mb-1">
                                        {isDragOver ? "Drop files here" : "Drag & drop files here"}
                                    </p>
                                    <p className="text-sm text-base-content/50">
                                        or click to browse
                                    </p>
                                    <p className="text-xs text-base-content/40 mt-2">
                                        PDF, Word, Excel, PowerPoint, TXT, Images • Max {MAX_FILE_SIZE_MB}MB
                                    </p>
                                </div>

                                {/* Error messages */}
                                <AnimatePresence>
                                    {errors.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4"
                                        >
                                            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-error">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Upload errors</span>
                                                    </div>
                                                    <button
                                                        onClick={clearErrors}
                                                        className="btn btn-ghost btn-xs"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                                <ul className="text-sm text-error/80 space-y-1">
                                                    {errors.map((error, i) => (
                                                        <li key={i}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Selected files */}
                                {files.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">
                                                {files.length} file{files.length !== 1 ? "s" : ""} selected
                                            </span>
                                            <span className="text-sm text-base-content/50">
                                                {formatFileSize(totalSize)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            <AnimatePresence mode="popLayout">
                                                {files.map((file, index) => (
                                                    <motion.div
                                                        key={`${file.name}-${file.size}`}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                                        className="flex items-center gap-3 p-2 bg-base-200 rounded-lg"
                                                    >
                                                        {getFileIcon(getFileExtension(file.name))}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-base-content/50">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFile(index)}
                                                            className="btn btn-ghost btn-xs btn-circle"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-2 p-4 border-t border-base-200">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleStartUpload}
                                    disabled={files.length === 0}
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload {files.length > 0 && `(${files.length})`}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
