import { atom } from "nanostores";

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  folderId?: string;
}

export interface UploadState {
  uploads: UploadItem[];
  isUploading: boolean;
}

const defaultState: UploadState = {
  uploads: [],
  isUploading: false,
};

export const uploadStore = atom<UploadState>(defaultState);

// Helper functions
export const addUpload = (file: File, folderId?: string) => {
  const newUpload: UploadItem = {
    id: crypto.randomUUID(),
    file,
    progress: 0,
    status: "pending",
    folderId,
  };
  
  const current = uploadStore.get();
  uploadStore.set({
    ...current,
    uploads: [...current.uploads, newUpload],
    isUploading: true,
  });
  
  return newUpload.id;
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

export const completeUpload = (id: string) => {
  const current = uploadStore.get();
  const updatedUploads = current.uploads.map((u) =>
    u.id === id ? { ...u, progress: 100, status: "completed" as const } : u
  );
  
  const stillUploading = updatedUploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );
  
  uploadStore.set({
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

export const getActiveUploadsCount = () => {
  return uploadStore.get().uploads.filter(
    (u) => u.status === "pending" || u.status === "uploading"
  ).length;
};
