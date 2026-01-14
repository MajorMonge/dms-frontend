import { atom } from "nanostores";

export interface ProcessingItem {
    id: string;
    documentId: string;
    documentName: string;
    type: "split";
    mode?: string;
    progress: number;
    status: "pending" | "processing" | "completed" | "error" | "cancelled";
    error?: string;
    outputCount?: number;
    outputFiles?: { name: string; pageCount: number; size: number }[];
}

export interface ProcessingState {
    items: ProcessingItem[];
    isProcessing: boolean;
}

const defaultState: ProcessingState = {
    items: [],
    isProcessing: false,
};

export const processingStore = atom<ProcessingState>(defaultState);

// ============= Processing Actions =============

/**
 * Add a processing task to the queue
 */
export const addProcessingTask = (
    documentId: string,
    documentName: string,
    type: "split",
    mode?: string
): string => {
    const id = crypto.randomUUID();

    const newTask: ProcessingItem = {
        id,
        documentId,
        documentName,
        type,
        mode,
        progress: 0,
        status: "pending",
    };

    const current = processingStore.get();
    processingStore.set({
        ...current,
        items: [...current.items, newTask],
        isProcessing: true,
    });

    return id;
};

export const updateProcessingProgress = (id: string, progress: number) => {
    const current = processingStore.get();
    processingStore.set({
        ...current,
        items: current.items.map((item) =>
            item.id === id
                ? { ...item, progress, status: "processing" as const }
                : item
        ),
    });
};

export const completeProcessing = (
    id: string,
    outputFiles?: { name: string; pageCount: number; size: number }[]
) => {
    const current = processingStore.get();
    const updatedItems = current.items.map((item) =>
        item.id === id
            ? {
                  ...item,
                  progress: 100,
                  status: "completed" as const,
                  outputCount: outputFiles?.length,
                  outputFiles,
              }
            : item
    );

    const stillProcessing = updatedItems.some(
        (item) => item.status === "pending" || item.status === "processing"
    );

    processingStore.set({
        ...current,
        items: updatedItems,
        isProcessing: stillProcessing,
    });
};

export const failProcessing = (id: string, error: string) => {
    const current = processingStore.get();
    const updatedItems = current.items.map((item) =>
        item.id === id ? { ...item, status: "error" as const, error } : item
    );

    const stillProcessing = updatedItems.some(
        (item) => item.status === "pending" || item.status === "processing"
    );

    processingStore.set({
        ...current,
        items: updatedItems,
        isProcessing: stillProcessing,
    });
};

export const removeProcessingTask = (id: string) => {
    const current = processingStore.get();
    const updatedItems = current.items.filter((item) => item.id !== id);

    const stillProcessing = updatedItems.some(
        (item) => item.status === "pending" || item.status === "processing"
    );

    processingStore.set({
        ...current,
        items: updatedItems,
        isProcessing: stillProcessing,
    });
};

export const clearCompletedProcessing = () => {
    const current = processingStore.get();
    processingStore.set({
        ...current,
        items: current.items.filter((item) => item.status !== "completed"),
    });
};

export const clearAllProcessing = () => {
    processingStore.set({
        items: [],
        isProcessing: false,
    });
};

// ============= Selectors =============

export const getActiveProcessingCount = () => {
    return processingStore.get().items.filter(
        (item) => item.status === "pending" || item.status === "processing"
    ).length;
};

export const getTotalProcessingProgress = () => {
    const items = processingStore.get().items;
    if (items.length === 0) return 0;

    const activeItems = items.filter(
        (item) =>
            item.status === "pending" ||
            item.status === "processing" ||
            item.status === "completed"
    );

    if (activeItems.length === 0) return 0;

    const totalProgress = activeItems.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / activeItems.length);
};
