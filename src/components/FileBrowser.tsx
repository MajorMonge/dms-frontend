"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Folder, File, MoreVertical, Upload, FolderPlus, Grid, List, HomeIcon, TrashIcon, DownloadIcon, BrushCleaning, Star, Pencil, FolderInput } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { appPreferencesStore } from "@/store/app";
import FileDetailsPanel from "./FileDetailsPanel";

interface FileItem {
    id: string;
    name: string;
    type: "file" | "folder";
    size?: number;
    modified: string;
    extension?: string;
}

const mockFiles: FileItem[] = [
    { id: "1", name: "Documents", type: "folder", modified: "Jan 10, 2026" },
    { id: "2", name: "Images", type: "folder", modified: "Jan 9, 2026" },
    { id: "3", name: "Projects", type: "folder", modified: "Jan 8, 2026" },
    { id: "4", name: "Annual Report.pdf", type: "file", size: 2400000, modified: "Jan 10, 2026", extension: "pdf" },
    { id: "5", name: "Budget 2026.xlsx", type: "file", size: 156000, modified: "Jan 9, 2026", extension: "xlsx" },
    { id: "6", name: "Presentation.pptx", type: "file", size: 5100000, modified: "Jan 7, 2026", extension: "pptx" },
    { id: "7", name: "Meeting Notes.docx", type: "file", size: 89000, modified: "Jan 6, 2026", extension: "docx" },
];

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(extension?: string, size: "sm" | "md" = "md") {
    const iconClass = size === "sm" ? "h-6 w-6" : "h-10 w-10";
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
            <div className={`${iconClass} ${iconStyles[ext]} rounded-lg flex items-center justify-center ${textSize} font-bold`}>
                {labels[ext]}
            </div>
        );
    }
    return <File className={iconClass} />;
}

// Reusable dropdown menu for file/folder actions
function ItemDropdown({ onAction }: { onAction?: (action: string) => void }) {
    const handleClick = (action: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAction?.(action);
    };

    return (
        <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                <MoreVertical className="h-4 w-4" />
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-44 p-2 shadow-lg border border-base-300">
                <li><a onClick={handleClick("details")}><File className="h-4 w-4" /> Details</a></li>
                <li><a onClick={handleClick("rename")}><Pencil className="h-4 w-4" /> Rename</a></li>
                <li><a onClick={handleClick("move")}><FolderInput className="h-4 w-4" /> Move</a></li>
                <li><a onClick={handleClick("star")}><Star className="h-4 w-4" /> Star</a></li>
                <li><a onClick={handleClick("download")}><DownloadIcon className="h-4 w-4" /> Download</a></li>
                <li className="border-t border-base-300 mt-1 pt-1">
                    <a onClick={handleClick("delete")} className="text-error"><TrashIcon className="h-4 w-4" /> Delete</a>
                </li>
            </ul>
        </div>
    );
}

// Grid card for folders and files
function GridCard({
    item,
    isSelected,
    onClick,
    onAction
}: {
    item: FileItem;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onAction?: (action: string) => void;
}) {
    const isFolder = item.type === "folder";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors select-none ${isSelected ? "ring-2 ring-primary" : ""}`}
            onClick={onClick}
        >
            <div className="card-body p-4 items-center text-center">
                <div className="absolute top-2 right-2">
                    <ItemDropdown onAction={onAction} />
                </div>
                {isFolder ? (
                    <Folder className="h-10 w-10 text-primary fill-primary/20" />
                ) : (
                    getFileIcon(item.extension)
                )}
                <p className="text-sm font-medium truncate w-full">{item.name}</p>
                {!isFolder && item.size && (
                    <p className="text-xs text-base-content/50">{formatFileSize(item.size)}</p>
                )}
            </div>
        </motion.div>
    );
}

// List row for folders and files
function ListRow({
    item,
    isSelected,
    onClick,
    onAction
}: {
    item: FileItem;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onAction?: (action: string) => void;
}) {
    const isFolder = item.type === "folder";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 cursor-pointer select-none ${isSelected ? "bg-primary/10 ring-1 ring-primary" : ""}`}
            onClick={onClick}
        >
            {isFolder ? (
                <Folder className="h-6 w-6 text-primary fill-primary/20" />
            ) : (
                getFileIcon(item.extension, "sm")
            )}
            <span className="flex-1 font-medium">{item.name}</span>
            {!isFolder && (
                <span className="text-sm text-base-content/50 hidden sm:block">
                    {item.size ? formatFileSize(item.size) : "-"}
                </span>
            )}
            <span className="text-sm text-base-content/50">{item.modified}</span>
            <ItemDropdown onAction={onAction} />
        </motion.div>
    );
}

export default function FileBrowser() {
    const preferences = useStore(appPreferencesStore);
    const viewMode = preferences.viewMode;
    const setViewMode = (mode: "grid" | "list") => {
        appPreferencesStore.set({ ...preferences, viewMode: mode });
    };
    
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [detailsItem, setDetailsItem] = useState<FileItem | null>(null);
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

    const folders = mockFiles.filter((f) => f.type === "folder");
    const files = mockFiles.filter((f) => f.type === "file");

    const toggleSelect = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const navigateToFolder = (folderName: string) => {
        setCurrentPath([...currentPath, folderName]);
        setSelectedItems([]);
    };

    const handleItemClick = (item: FileItem) => (e: React.MouseEvent) => {
        if (e.shiftKey) {
            toggleSelect(item.id);
            return;
        }

        if (item.type === "folder") {
            if (e.detail === 2) {
                if (clickTimeout) clearTimeout(clickTimeout);
                setClickTimeout(null);
                navigateToFolder(item.name);
            } else {
                if (clickTimeout) clearTimeout(clickTimeout);
                const timeout = setTimeout(() => {
                    setDetailsItem(item);
                    setClickTimeout(null);
                }, 200);
                setClickTimeout(timeout);
            }
        } else {
            setDetailsItem(item);
        }
    };

    const handleItemAction = (item: FileItem) => (action: string) => {
        if (action === "details") {
            setDetailsItem(item);
        }
    };

    const renderItems = (items: FileItem[], gridCols: string) => {
        if (items.length === 0) return null;

        return viewMode === "grid" ? (
            <motion.div
                className={`grid ${gridCols} gap-3`}
                transition={{ staggerChildren: 0.03 }}
            >
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <GridCard
                            key={item.id}
                            item={item}
                            isSelected={selectedItems.includes(item.id)}
                            onClick={handleItemClick(item)}
                            onAction={handleItemAction(item)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        ) : (
            <motion.div
                className="space-y-1"
                transition={{ staggerChildren: 0.03 }}
            >
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <ListRow
                            key={item.id}
                            item={item}
                            isSelected={selectedItems.includes(item.id)}
                            onClick={handleItemClick(item)}
                            onAction={handleItemAction(item)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="h-full flex gap-2">
            <div
                className={`bg-base-100 shadow-lg rounded-box flex flex-col border border-base-300 transition-all duration-300 min-h-0 ${detailsItem ? "flex-1" : "w-full"}`}
            >
                {/* Toolbar */}
                <div className="bg-base-200 flex items-center justify-between rounded-t-md p-4 border-b border-base-300">
                    <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                        </button>
                        <button className="btn btn-ghost btn-sm gap-2">
                            <FolderPlus className="h-4 w-4" />
                            New Folder
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <button
                            className={`btn btn-ghost btn-sm btn-square ${viewMode === "grid" ? "btn-active" : ""}`}
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            className={`btn btn-ghost btn-sm btn-square ${viewMode === "list" ? "btn-active" : ""}`}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Path Breadcrumbs */}
                <div className="px-4 pt-4">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li>
                                <a
                                    className="flex items-center gap-1 hover:text-primary cursor-pointer"
                                    onClick={() => setCurrentPath([])}
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    Home
                                </a>
                            </li>
                            {currentPath.map((segment, index) => (
                                <li key={index}>
                                    <a
                                        className="hover:text-primary cursor-pointer"
                                        onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                                    >
                                        {segment}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {folders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-base-content/70 mb-3">Folders</h3>
                            {renderItems(folders, "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8")}
                        </div>
                    )}

                    {files.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-base-content/70 mb-3">Files</h3>
                            {renderItems(files, "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8")}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-base-300 bg-base-200 rounded-b-box">
                    <div className="text-sm text-base-content/70">
                        {selectedItems.length > 0 ? (
                            <span>
                                <span className="font-medium text-base-content">{selectedItems.length}</span> item{selectedItems.length !== 1 ? 's' : ''} selected
                            </span>
                        ) : (
                            <span>{folders.length + files.length} items</span>
                        )}
                    </div>
                    {selectedItems.length > 0 && (
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm text-error">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                            <div className="divider divider-horizontal"></div>
                            <button className="btn btn-primary btn-sm">
                                <DownloadIcon className="h-4 w-4" /> Download
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItems([])}>
                                <BrushCleaning className="h-4 w-4" /> Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {detailsItem && (
                <FileDetailsPanel
                    item={detailsItem}
                    onClose={() => setDetailsItem(null)}
                />
            )}
        </div>
    );
}
