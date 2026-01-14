"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useStore } from "@nanostores/react";
import { Folder as FolderIcon, File, MoreVertical, Upload, FolderPlus, Grid, List, HomeIcon, TrashIcon, DownloadIcon, BrushCleaning, Star, Pencil, FolderInput, Loader2, AlertCircle, Scissors, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { appPreferencesStore } from "@/store/app";
import FileDetailsPanel from "./FileDetailsPanel";
import { useInfiniteDocuments, type ListDocumentsParams } from "@/lib/api/documents";
import { downloadSingleFile, downloadFilesWithTracking } from "@/lib/download";
import { useFolders, useRootFolders, useFolderBreadcrumbs } from "@/lib/api/folders";
import type { Document, Folder, Breadcrumb } from "@/types/api";
import toast from "react-hot-toast";
import CreateFolderModal from "./CreateFolderModal";
import RenameFolderModal from "./RenameFolderModal";
import DeleteFolderModal from "./DeleteFolderModal";
import RenameDocumentModal from "./RenameDocumentModal";
import DeleteDocumentModal from "./DeleteDocumentModal";
import BulkDeleteModal from "./BulkDeleteModal";
import UploadModal from "./UploadModal";
import SplitPdfModal from "./SplitPdfModal";

// Sort options type
type SortField = 'name' | 'updatedAt' | 'size' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortOption {
    field: SortField;
    order: SortOrder;
    label: string;
}

interface FileItem {
    id: string;
    name: string;
    type: "file" | "folder";
    size?: number;
    modified: string;
    extension?: string;
    originalData?: Document | Folder;
}

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
function ItemDropdown({ item, onAction }: { item: FileItem; onAction?: (action: string) => void }) {
    const handleClick = (action: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAction?.(action);
    };

    const isFolder = item.type === "folder";
    const isPdf = !isFolder && item.extension?.toLowerCase() === "pdf";

    return (
        <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                <MoreVertical className="h-4 w-4" />
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-44 p-2 shadow-lg border border-base-300">
                <li><a onClick={handleClick("details")}><File className="h-4 w-4" /> Details</a></li>
                <li><a onClick={handleClick("rename")}><Pencil className="h-4 w-4" /> Rename</a></li>
                <li><a onClick={handleClick("move")}><FolderInput className="h-4 w-4" /> Move</a></li>
                {!isFolder && <li><a onClick={handleClick("star")}><Star className="h-4 w-4" /> Star</a></li>}
                {!isFolder && <li><a onClick={handleClick("download")}><DownloadIcon className="h-4 w-4" /> Download</a></li>}
                {isPdf && <li><a onClick={handleClick("split")}><Scissors className="h-4 w-4" /> Split PDF</a></li>}
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
                    <ItemDropdown item={item} onAction={onAction} />
                </div>
                {isFolder ? (
                    <FolderIcon className="h-10 w-10 text-primary fill-primary/20" />
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
                <FolderIcon className="h-6 w-6 text-primary fill-primary/20" />
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
            <ItemDropdown item={item} onAction={onAction} />
        </motion.div>
    );
}

export default function FileBrowser() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    const preferences = useStore(appPreferencesStore);
    const viewMode = preferences.viewMode;
    const setViewMode = (mode: "grid" | "list") => {
        appPreferencesStore.set({ ...preferences, viewMode: mode });
    };
    
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [detailsItem, setDetailsItem] = useState<FileItem | null>(null);
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [renameFolderItem, setRenameFolderItem] = useState<FileItem | null>(null);
    const [deleteFolderItem, setDeleteFolderItem] = useState<FileItem | null>(null);
    const [renameDocumentItem, setRenameDocumentItem] = useState<FileItem | null>(null);
    const [deleteDocumentItem, setDeleteDocumentItem] = useState<FileItem | null>(null);
    const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
    const [splitPdfItem, setSplitPdfItem] = useState<FileItem | null>(null);
    
    // Sorting state
    const [sortBy, setSortBy] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const currentFolderId = searchParams.get("folder") || undefined;
    const selectedFileId = searchParams.get("file") || undefined;
    const isAtRoot = !currentFolderId;

    const updateUrl = useCallback((folderId: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (folderId) {
            params.set("folder", folderId);
        } else {
            params.delete("folder");
        }
        const queryString = params.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }, [router, pathname, searchParams]);

    const { 
        data: rootFoldersData, 
        isLoading: rootFoldersLoading, 
        error: rootFoldersError,
        refetch: refetchRootFolders 
    } = useRootFolders();

    const { 
        data: subFoldersData, 
        isLoading: subFoldersLoading, 
        error: subFoldersError,
        refetch: refetchSubFolders 
    } = useFolders({ parentId: currentFolderId });

    const foldersData = isAtRoot 
        ? { folders: rootFoldersData || [] } 
        : subFoldersData;
    const foldersLoading = isAtRoot ? rootFoldersLoading : subFoldersLoading;
    const foldersError = isAtRoot ? rootFoldersError : subFoldersError;
    const refetchFolders = isAtRoot ? refetchRootFolders : refetchSubFolders;
    
    // Use infinite query for documents with sorting
    const { 
        data: documentsData, 
        isLoading: documentsLoading, 
        error: documentsError,
        refetch: refetchDocuments,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteDocuments({ 
        folderId: currentFolderId,
        sortBy,
        sortOrder,
        limit: 30,
    });

    const { data: breadcrumbsData } = useFolderBreadcrumbs(currentFolderId);

    // Sort folders client-side to match document sorting
    const folders: FileItem[] = useMemo(() => {
        const folderItems = (foldersData?.folders || []).map((folder): FileItem => ({
            id: folder.id,
            name: folder.name,
            type: "folder",
            modified: new Date(folder.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }),
            originalData: folder,
        }));
        
        // Sort folders
        return folderItems.sort((a, b) => {
            const folderA = a.originalData as Folder;
            const folderB = b.originalData as Folder;
            
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'updatedAt':
                    comparison = new Date(folderA.updatedAt).getTime() - new Date(folderB.updatedAt).getTime();
                    break;
                case 'createdAt':
                    comparison = new Date(folderA.createdAt).getTime() - new Date(folderB.createdAt).getTime();
                    break;
                case 'size':
                    // Folders don't have size, sort by name
                    comparison = a.name.localeCompare(b.name);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [foldersData, sortBy, sortOrder]);

    // Flatten infinite query pages into single array
    const files: FileItem[] = useMemo(() => {
        if (!documentsData?.pages) return [];
        
        return documentsData.pages.flatMap(page => 
            page.documents.map((doc): FileItem => ({
                id: doc.id,
                name: doc.name,
                type: "file",
                size: doc.size,
                extension: doc.extension,
                modified: new Date(doc.updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                originalData: doc,
            }))
        );
    }, [documentsData]);

    const isLoading = foldersLoading || documentsLoading;
    const error = foldersError || documentsError;

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle sorting change
    const handleSortChange = useCallback((field: SortField) => {
        if (sortBy === field) {
            // Toggle order if same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            // Default order based on field type
            setSortOrder(field === 'name' ? 'asc' : 'desc');
        }
    }, [sortBy]);

    // Get sort icon
    const getSortIcon = (field: SortField) => {
        if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
        return sortOrder === 'asc' 
            ? <ArrowUp className="h-3 w-3" /> 
            : <ArrowDown className="h-3 w-3" />;
    };

    useEffect(() => {
        if (selectedFileId && files.length > 0) {
            const fileItem = files.find(f => f.id === selectedFileId);
            if (fileItem) {
                setDetailsItem(fileItem);
                setSelectedItems([selectedFileId]);
                
                const params = new URLSearchParams(searchParams.toString());
                params.delete("file");
                const queryString = params.toString();
                router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
            }
        }
    }, [selectedFileId, files, searchParams, router, pathname]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }, []);

    const navigateToFolder = useCallback((folderId: string) => {
        updateUrl(folderId);
        setSelectedItems([]);
        setDetailsItem(null);
    }, [updateUrl]);

    const navigateToRoot = useCallback(() => {
        updateUrl(undefined);
        setSelectedItems([]);
        setDetailsItem(null);
    }, [updateUrl]);

    const navigateToBreadcrumb = useCallback((breadcrumb: Breadcrumb) => {
        updateUrl(breadcrumb.id);
        setSelectedItems([]);
        setDetailsItem(null);
    }, [updateUrl]);

    const handleItemClick = useCallback((item: FileItem) => (e: React.MouseEvent) => {
        if (e.shiftKey) {
            toggleSelect(item.id);
            return;
        }

        if (item.type === "folder") {
            if (e.detail === 2) {
                if (clickTimeout) clearTimeout(clickTimeout);
                setClickTimeout(null);
                navigateToFolder(item.id);
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
    }, [clickTimeout, toggleSelect, navigateToFolder]);

    const handleItemAction = useCallback((item: FileItem) => async (action: string) => {
        switch (action) {
            case "details":
                setDetailsItem(item);
                break;
            case "rename":
                if (item.type === "folder") {
                    setRenameFolderItem(item);
                } else {
                    setRenameDocumentItem(item);
                }
                break;
            case "delete":
                if (item.type === "folder") {
                    setDeleteFolderItem(item);
                } else {
                    setDeleteDocumentItem(item);
                }
                break;
            case "download":
                if (item.type === "file") {
                    try {
                        await downloadSingleFile(item.id);
                    } catch (err) {
                        toast.error('Failed to download file');
                    }
                }
                break;
            case "split":
                if (item.type === "file" && item.extension?.toLowerCase() === "pdf") {
                    setSplitPdfItem(item);
                } else {
                    toast.error("Only PDF files can be split");
                }
                break;
            default:
                toast.error(`Action "${action}" not implemented yet`);
        }
    }, []);

    const handleDownloadSelected = useCallback(async () => {
        const selectedFiles = files.filter(f => selectedItems.includes(f.id));
        
        if (selectedFiles.length === 0) {
            toast.error('No files selected for download');
            return;
        }
        
        try {
            await downloadFilesWithTracking(
                selectedFiles.map(f => ({ 
                    id: f.id, 
                    name: f.name,
                    size: f.size 
                }))
            );
            setSelectedItems([]);
        } catch (err) {
            console.error('Download failed:', err);
        }
    }, [files, selectedItems]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedItems.length === 0) return;
        
        if (selectedItems.length === 1) {
            const item = [...folders, ...files].find(i => i.id === selectedItems[0]);
            if (item) {
                if (item.type === 'folder') {
                    setDeleteFolderItem(item);
                } else {
                    setDeleteDocumentItem(item);
                }
            }
        } else {
            setShowDeleteSelectedConfirm(true);
        }
    }, [selectedItems, folders, files]);

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
                <div className="bg-base-200 flex flex-wrap  items-center justify-between rounded-t-md p-4 border-b border-base-300 gap-2">
                    <div className="basis-full lg:basis-auto flex gap-2">
                        <button 
                            className="btn btn-primary btn-sm gap-2"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <Upload className="h-4 w-4" />
                            Upload
                        </button>
                        <button 
                            className="btn btn-ghost btn-sm gap-2"
                            onClick={() => setIsCreateFolderModalOpen(true)}
                        >
                            <FolderPlus className="h-4 w-4" />
                            New Folder
                        </button>
                    </div>
                    <div className="basis-full lg:basis-auto  flex gap-2 items-center justify-end">
                        {/* Sort Dropdown */}
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1">
                                <ArrowUpDown className="h-4 w-4" />
                                <span className="hidden sm:inline">Sort</span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-48 p-2 shadow-lg border border-base-300">
                                <li>
                                    <a 
                                        onClick={() => handleSortChange('name')}
                                        className={sortBy === 'name' ? 'active' : ''}
                                    >
                                        {getSortIcon('name')}
                                        Name
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        onClick={() => handleSortChange('updatedAt')}
                                        className={sortBy === 'updatedAt' ? 'active' : ''}
                                    >
                                        {getSortIcon('updatedAt')}
                                        Modified
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        onClick={() => handleSortChange('createdAt')}
                                        className={sortBy === 'createdAt' ? 'active' : ''}
                                    >
                                        {getSortIcon('createdAt')}
                                        Created
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        onClick={() => handleSortChange('size')}
                                        className={sortBy === 'size' ? 'active' : ''}
                                    >
                                        {getSortIcon('size')}
                                        Size
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="divider divider-horizontal m-0 h-6"></div>
                        
                        {/* View Mode */}
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
                                    onClick={navigateToRoot}
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    Home
                                </a>
                            </li>
                            {currentFolderId && !breadcrumbsData && (
                                <li>
                                    <span className="flex items-center gap-1 text-base-content/50">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    </span>
                                </li>
                            )}
                            {breadcrumbsData?.map((breadcrumb) => (
                                <li key={breadcrumb.id}>
                                    <a
                                        className="hover:text-primary cursor-pointer"
                                        onClick={() => navigateToBreadcrumb(breadcrumb)}
                                    >
                                        {breadcrumb.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-base-content/60">Loading...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3 text-error">
                                <AlertCircle className="h-8 w-8" />
                                <p>Failed to load files</p>
                                <button 
                                    className="btn btn-sm btn-outline btn-error"
                                    onClick={() => {
                                        refetchFolders();
                                        refetchDocuments();
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && folders.length === 0 && files.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3 text-base-content/60">
                                <FolderIcon className="h-16 w-16" />
                                <p className="text-lg">This folder is empty</p>
                                <p className="text-sm">Upload files or create a new folder to get started</p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && !error && (
                        <>
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

                            {/* Infinite scroll trigger */}
                            <div 
                                ref={loadMoreRef} 
                                className="h-10 flex items-center justify-center"
                            >
                                {isFetchingNextPage && (
                                    <div className="flex items-center gap-2 text-base-content/60">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Loading more...</span>
                                    </div>
                                )}
                                {!hasNextPage && files.length > 0 && (
                                    <span className="text-xs text-base-content/40">
                                        All files loaded
                                    </span>
                                )}
                            </div>
                        </>
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
                            <button 
                                className="btn btn-ghost btn-sm text-error"
                                onClick={handleDeleteSelected}
                            >
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                            <div className="divider divider-horizontal"></div>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={handleDownloadSelected}
                                disabled={!files.some(f => selectedItems.includes(f.id))}
                            >
                                <DownloadIcon className="h-4 w-4" />
                                Download
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
                    onRename={(item) => {
                        if (item.type === 'folder') {
                            setRenameFolderItem(item);
                        } else {
                            setRenameDocumentItem(item);
                        }
                    }}
                    onDelete={(item) => {
                        if (item.type === 'folder') {
                            setDeleteFolderItem(item);
                        } else {
                            setDeleteDocumentItem(item);
                        }
                    }}
                    onSplitPdf={(item) => {
                        if (item.type === 'file' && item.extension?.toLowerCase() === 'pdf') {
                            setSplitPdfItem(item);
                        }
                    }}
                />
            )}

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
                parentId={currentFolderId}
                onSuccess={() => refetchFolders()}
            />

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                folderId={currentFolderId}
            />

            {/* Rename Folder Modal */}
            <RenameFolderModal
                isOpen={!!renameFolderItem}
                onClose={() => setRenameFolderItem(null)}
                folderId={renameFolderItem?.id || ''}
                currentName={renameFolderItem?.name || ''}
                onSuccess={() => refetchFolders()}
            />

            {/* Delete Folder Modal */}
            <DeleteFolderModal
                isOpen={!!deleteFolderItem}
                onClose={() => setDeleteFolderItem(null)}
                folderId={deleteFolderItem?.id || ''}
                folderName={deleteFolderItem?.name || ''}
                onSuccess={() => refetchFolders()}
            />

            {/* Rename Document Modal */}
            <RenameDocumentModal
                isOpen={!!renameDocumentItem}
                onClose={() => setRenameDocumentItem(null)}
                documentId={renameDocumentItem?.id || ''}
                currentName={renameDocumentItem?.name || ''}
                onSuccess={() => refetchDocuments()}
            />

            {/* Delete Document Modal */}
            <DeleteDocumentModal
                isOpen={!!deleteDocumentItem}
                onClose={() => setDeleteDocumentItem(null)}
                documentId={deleteDocumentItem?.id || ''}
                documentName={deleteDocumentItem?.name || ''}
                onSuccess={() => refetchDocuments()}
            />

            {/* Bulk Delete Modal */}
            <BulkDeleteModal
                isOpen={showDeleteSelectedConfirm}
                onClose={() => setShowDeleteSelectedConfirm(false)}
                items={[...folders, ...files]
                    .filter(item => selectedItems.includes(item.id))
                    .map(item => ({ id: item.id, name: item.name, type: item.type }))}
                onSuccess={() => {
                    setSelectedItems([]);
                    refetchFolders();
                    refetchDocuments();
                }}
            />

            {/* Split PDF Modal */}
            <SplitPdfModal
                isOpen={!!splitPdfItem}
                onClose={() => setSplitPdfItem(null)}
                documentId={splitPdfItem?.id || ''}
                documentName={splitPdfItem?.name || ''}
                folderId={currentFolderId}
                onSuccess={() => refetchDocuments()}
            />
        </div>
    );
}
