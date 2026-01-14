"use client";

import { useStore } from "@nanostores/react";
import { uploadStore } from "@/store/uploads";
import { useEffect } from "react";

/**
 * UploadManager - Lives in the layout, never unmounts
 * Handles actual file uploads and browser close protection
 */
export default function UploadManager() {
  const { uploads, isUploading } = useStore(uploadStore);

  // Warn user before closing tab if uploads are in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  // TODO: Implement actual upload logic here
  // This component will process the upload queue
  // For now it just manages the beforeunload protection

  // Process pending uploads
  useEffect(() => {
    const pendingUploads = uploads.filter((u) => u.status === "pending");
    
    // TODO: Start uploading pending files
    // This is where you'd call your upload API
    // Example:
    // pendingUploads.forEach(upload => {
    //   startUpload(upload);
    // });
    
  }, [uploads]);

  // This component renders nothing - it just manages uploads
  return null;
}
