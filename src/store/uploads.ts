import { atom } from "nanostores";

// Threshold for using presigned uploads (5MB)
export const PRESIGNED_THRESHOLD_BYTES = 5 * 1024 * 1024;

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error" | "cancelled";
  error?: string;
  folderId?: string;
  // For presigned uploads
  uploadUrl?: string;
  key?: string;
  usePresigned: boolean;
}

export interface UploadState {
  uploads: UploadItem[];
  isUploading: boolean;
  isModalOpen: boolean;
}

const defaultState: UploadState = {
  uploads: [],
  isUploading: false,
  isModalOpen: false,
};

export const uploadStore = atom<UploadState>(defaultState);

// ============= Modal Actions =============

export const openUploadModal = () => {
  const current = uploadStore.get();
  uploadStore.set({ ...current, isModalOpen: true });
};

export const closeUploadModal = () => {
  const current = uploadStore.get();
  uploadStore.set({ ...current, isModalOpen: false });
};

// ============= Upload Actions =============

/**
 * Add a single upload to the queue
 */
export const addUpload = (file: File, folderId?: string) => {
  // Determine if we should use presigned upload
  const usePresigned = file.size > PRESIGNED_THRESHOLD_BYTES;
  
  const newUpload: UploadItem = {
    id: crypto.randomUUID(),
    file,
    progress: 0,
    status: "pending",
    folderId,
    usePresigned,
  };
  
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: [...current.uploads, newUpload],
    isUploading: true,
  });
  
  return newUpload.id;
};

/**
 * Add multiple uploads to the queue
 * Uses presigned upload if multiple files OR any file > 5MB
 */
export const addUploads = (files: File[], folderId?: string) => {
  const shouldUsePresigned = files.length > 1 || files.some(f => f.size > PRESIGNED_THRESHOLD_BYTES);
  
  const newUploads: UploadItem[] = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    progress: 0,
    status: "pending" as const,
    folderId,
    usePresigned: shouldUsePresigned,
  }));
  
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: [...current.uploads, ...newUploads],
    isUploading: true,
  });
  
  return newUploads.map(u => u.id);
};

export const updateUploadProgress = (id: string, progress: number) => {
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: current.uploads.map((u) =>
      u.id === id ? { ...u, progress, status: "uploading" } : u
    ),
  });
};

export const setUploadPresignedData = (id: string, uploadUrl: string, key: string) => {
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: current.uploads.map((u) =>
      u.id === id ? { ...u, uploadUrl, key } : u
    ),
  });
};

export const completeUpload = (id: string) => {
  const current = uploadStore.get();
  const updatedUploads = current.uploads.map((u) =>
    u.id === id ? { ...u, progress: 100, status: "completed" as const } : u
  );
  
  const stillUploading = updatedUploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );
  
  uploadStore.set({
    ...current,
    uploads: updatedUploads,
    isUploading: stillUploading,
  });
};

export const failUpload = (id: string, error: string) => {
  const current = uploadStore.get();
  const updatedUploads = current.uploads.map((u) =>
    u.id === id ? { ...u, status: "error" as const, error } : u
  );
  
  const stillUploading = updatedUploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );
  
  uploadStore.set({
    ...current,
    uploads: updatedUploads,
    isUploading: stillUploading,
  });
};

export const cancelUpload = (id: string) => {
  const current = uploadStore.get();
  const updatedUploads = current.uploads.map((u) =>
    u.id === id ? { ...u, status: "cancelled" as const } : u
  );
  
  const stillUploading = updatedUploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );
  
  uploadStore.set({
    ...current,
    uploads: updatedUploads,
    isUploading: stillUploading,
  });
};

export const removeUpload = (id: string) => {
  const current = uploadStore.get();
  const updatedUploads = current.uploads.filter((u) => u.id !== id);
  
  const stillUploading = updatedUploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );
  
  uploadStore.set({
    ...current,
    uploads: updatedUploads,
    isUploading: stillUploading,
  });
};

export const clearCompletedUploads = () => {
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: current.uploads.filter((u) => u.status !== "completed"),
  });
};

export const clearAllUploads = () => {
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: [],
    isUploading: false,
  });
};

export const retryUpload = (id: string) => {
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: current.uploads.map((u) =>
      u.id === id ? { ...u, status: "pending" as const, progress: 0, error: undefined } : u
    ),
    isUploading: true,
  });
};

// ============= Selectors =============

export const getActiveUploadsCount = () => {
  return uploadStore.get().uploads.filter(
    (u) => u.status === "pending" || u.status === "uploading"
  ).length;
};

export const getPendingUploads = () => {
  return uploadStore.get().uploads.filter((u) => u.status === "pending");
};

export const getUploadingUploads = () => {
  return uploadStore.get().uploads.filter((u) => u.status === "uploading");
};

export const getTotalProgress = () => {
  const uploads = uploadStore.get().uploads;
  if (uploads.length === 0) return 0;
  
  const activeUploads = uploads.filter(
    (u) => u.status === "pending" || u.status === "uploading" || u.status === "completed"
  );
  
  if (activeUploads.length === 0) return 0;
  
  const totalProgress = activeUploads.reduce((sum, u) => sum + u.progress, 0);
  return Math.round(totalProgress / activeUploads.length);
};
