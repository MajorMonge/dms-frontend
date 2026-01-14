import { atom } from "nanostores";

export interface DownloadItem {
    id: string;
    name: string;
    size?: number;
    progress: number;
    status: "pending" | "downloading" | "zipping" | "completed" | "error" | "cancelled";
    error?: string;
    fileCount: number;
    currentFile?: string;
    currentFileIndex?: number;
}

export interface DownloadState {
    downloads: DownloadItem[];
    isDownloading: boolean;
}

const defaultState: DownloadState = {
    downloads: [],
    isDownloading: false,
};

export const downloadStore = atom<DownloadState>(defaultState);

// ============= Download Actions =============

/**
 * Add a download to the queue
 */
export const addDownload = (
    id: string,
    name: string,
    fileCount: number,
    size?: number
): string => {
    const downloadId = id || crypto.randomUUID();

    const newDownload: DownloadItem = {
        id: downloadId,
        name,
        size,
        progress: 0,
        status: "pending",
        fileCount,
    };

    const current = downloadStore.get();
    downloadStore.set({
        ...current,
        downloads: [...current.downloads, newDownload],
        isDownloading: true,
    });

    return downloadId;
};

export const updateDownloadProgress = (
    id: string,
    progress: number,
    currentFile?: string,
    currentFileIndex?: number
) => {
    const current = downloadStore.get();
    downloadStore.set({
        ...current,
        downloads: current.downloads.map((d) =>
            d.id === id
                ? { ...d, progress, status: "downloading" as const, currentFile, currentFileIndex }
                : d
        ),
    });
};

export const setDownloadZipping = (id: string) => {
    const current = downloadStore.get();
    downloadStore.set({
        ...current,
        downloads: current.downloads.map((d) =>
            d.id === id
                ? { ...d, status: "zipping" as const, progress: 95, currentFile: "Creating archive..." }
                : d
        ),
    });
};

export const completeDownload = (id: string) => {
    const current = downloadStore.get();
    const updatedDownloads = current.downloads.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "completed" as const, currentFile: undefined } : d
    );

    const stillDownloading = updatedDownloads.some(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping"
    );

    downloadStore.set({
        ...current,
        downloads: updatedDownloads,
        isDownloading: stillDownloading,
    });
};

export const failDownload = (id: string, error: string) => {
    const current = downloadStore.get();
    const updatedDownloads = current.downloads.map((d) =>
        d.id === id ? { ...d, status: "error" as const, error } : d
    );

    const stillDownloading = updatedDownloads.some(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping"
    );

    downloadStore.set({
        ...current,
        downloads: updatedDownloads,
        isDownloading: stillDownloading,
    });
};

export const removeDownload = (id: string) => {
    const current = downloadStore.get();
    const updatedDownloads = current.downloads.filter((d) => d.id !== id);

    const stillDownloading = updatedDownloads.some(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping"
    );

    downloadStore.set({
        ...current,
        downloads: updatedDownloads,
        isDownloading: stillDownloading,
    });
};

export const clearCompletedDownloads = () => {
    const current = downloadStore.get();
    downloadStore.set({
        ...current,
        downloads: current.downloads.filter((d) => d.status !== "completed"),
    });
};

export const clearAllDownloads = () => {
    downloadStore.set({
        downloads: [],
        isDownloading: false,
    });
};

// ============= Selectors =============

export const getActiveDownloadsCount = () => {
    return downloadStore.get().downloads.filter(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping"
    ).length;
};

export const getTotalDownloadProgress = () => {
    const downloads = downloadStore.get().downloads;
    if (downloads.length === 0) return 0;

    const activeDownloads = downloads.filter(
        (d) => d.status === "pending" || d.status === "downloading" || d.status === "zipping" || d.status === "completed"
    );

    if (activeDownloads.length === 0) return 0;

    const totalProgress = activeDownloads.reduce((sum, d) => sum + d.progress, 0);
    return Math.round(totalProgress / activeDownloads.length);
};
