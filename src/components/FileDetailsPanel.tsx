"use client";

import { X, Folder, File, Calendar, HardDrive, User, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileItem {
    id: string;
    name: string;
    type: "file" | "folder";
    size?: number;
    modified: string;
    extension?: string;
}

interface FileDetailsPanelProps {
    item: FileItem | null;
    onClose: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(extension?: string) {
    const iconClass = "h-20 w-20";
    const textSize = "text-lg";

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
            <div className={`${iconClass} ${iconStyles[ext]} rounded-2xl flex items-center justify-center ${textSize} font-bold`}>
                {labels[ext]}
            </div>
        );
    }
    return <File className={iconClass} />;
}

export default function FileDetailsPanel({ item, onClose }: FileDetailsPanelProps) {
    if (!item) return null;

    const isFolder = item.type === "folder";

    const detailItems = [
        { icon: Tag, label: "Type", value: isFolder ? "Folder" : item.extension?.toUpperCase() || "File" },
        ...((!isFolder && item.size) ? [{ icon: HardDrive, label: "Size", value: formatFileSize(item.size) }] : []),
        { icon: Calendar, label: "Modified", value: item.modified },
        { icon: User, label: "Owner", value: "You" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <motion.div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            />
            
            {/* Panel */}
            <motion.div 
                className="fixed lg:relative top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 flex flex-col bg-base-100 shadow-lg rounded-box"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
                    <h3 className="font-semibold text-lg">Details</h3>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-square"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Preview/Icon */}
                    <div className="flex flex-col items-center mb-6 pb-6 border-b border-base-300">
                        {isFolder ? (
                            <Folder className="h-20 w-20 text-primary fill-primary/20" />
                        ) : (
                            getFileIcon(item.extension)
                        )}
                        <h4 className="mt-4 text-center font-medium break-all">{item.name}</h4>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4">
                        {detailItems.map((detail, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <detail.icon className="h-5 w-5 text-base-content/50 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-base-content/50">{detail.label}</p>
                                    <p className="font-medium">{detail.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t border-base-300 space-y-2">
                        <button className="btn btn-primary btn-block btn-sm">
                            Download
                        </button>
                        <button className="btn btn-ghost btn-block btn-sm">
                            Share
                        </button>
                        <button className="btn btn-ghost btn-block btn-sm">
                            Rename
                        </button>
                        <button className="btn btn-ghost btn-block btn-sm text-error">
                            Delete
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
