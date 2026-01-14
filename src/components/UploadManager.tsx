"use client";

import { useStore } from "@nanostores/react";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    uploadStore,
    updateUploadProgress,
    completeUpload,
    failUpload,
    setUploadPresignedData,
    type UploadItem,
} from "@/store/uploads";
import {
    getPresignedUploadUrl,
    uploadToPresignedUrl,
    confirmUpload,
    uploadDirect,
    documentKeys,
} from "@/lib/api/documents";
import { folderKeys } from "@/lib/api/folders";
import { userKeys } from "@/lib/api/user";

// Maximum concurrent uploads
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * UploadManager - Lives in the layout, never unmounts
 * Handles actual file uploads and browser close protection
 */
export default function UploadManager() {
    const { uploads, isUploading } = useStore(uploadStore);
    const queryClient = useQueryClient();
    const processingRef = useRef<Set<string>>(new Set());
    const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

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

    /**
     * Process a single presigned upload
     */
    const processPresignedUpload = useCallback(async (upload: UploadItem) => {
        try {
            // Step 1: Get presigned URL
            console.log('[Upload] Getting presigned URL for:', upload.file.name);
            const presignedData = await getPresignedUploadUrl({
                fileName: upload.file.name,
                mimeType: upload.file.type || 'application/octet-stream',
                size: upload.file.size,
                folderId: upload.folderId || null,
            });
            console.log('[Upload] Got presigned URL, key:', presignedData.key);

            setUploadPresignedData(upload.id, presignedData.uploadUrl, presignedData.key);

            // Step 2: Upload to S3
            console.log('[Upload] Uploading to S3...');
            await uploadToPresignedUrl(
                presignedData.uploadUrl,
                upload.file,
                (progress) => {
                    // Scale progress: 0-90% for S3 upload, 90-100% for confirm
                    updateUploadProgress(upload.id, Math.round(progress * 0.9));
                }
            );
            console.log('[Upload] S3 upload complete');

            // Step 3: Confirm upload
            updateUploadProgress(upload.id, 95);
            console.log('[Upload] Confirming upload...');
            await confirmUpload({
                key: presignedData.key,
                name: upload.file.name,
                folderId: upload.folderId || null,
            });
            console.log('[Upload] Upload confirmed');

            completeUpload(upload.id);
            
            // Invalidate queries to refresh file list
            console.log('[Upload] Invalidating cache...');
            await queryClient.invalidateQueries({ 
                queryKey: documentKeys.all,
            });
            // Also invalidate folder counts
            await queryClient.invalidateQueries({ 
                queryKey: folderKeys.all,
            });
            // Invalidate storage info to update sidebar
            await queryClient.invalidateQueries({
                queryKey: userKeys.storage(),
            });
            console.log('[Upload] Cache invalidated');
        } catch (error) {
            console.error('[Upload] Presigned upload failed:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            if (message !== 'Upload cancelled') {
                failUpload(upload.id, message);
            }
        }
    }, [queryClient]);

    /**
     * Process a single direct upload
     */
    const processDirectUpload = useCallback(async (upload: UploadItem) => {
        try {
            await uploadDirect(
                upload.file,
                { folderId: upload.folderId || null },
                (progress) => updateUploadProgress(upload.id, progress)
            );

            completeUpload(upload.id);
            
            // Invalidate queries to refresh file list
            console.log('[Upload] Invalidating cache...');
            await queryClient.invalidateQueries({ 
                queryKey: documentKeys.all,
            });
            // Also invalidate folder counts
            await queryClient.invalidateQueries({ 
                queryKey: folderKeys.all,
            });
            // Invalidate storage info to update sidebar
            await queryClient.invalidateQueries({
                queryKey: userKeys.storage(),
            });
            console.log('[Upload] Cache invalidated');
        } catch (error) {
            console.error('[Upload] Direct upload failed:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            if (message !== 'Upload cancelled') {
                failUpload(upload.id, message);
            }
        }
    }, [queryClient]);

    /**
     * Process an upload based on its type
     */
    const processUpload = useCallback(async (upload: UploadItem) => {
        if (processingRef.current.has(upload.id)) {
            return; // Already processing
        }

        processingRef.current.add(upload.id);
        updateUploadProgress(upload.id, 0);

        try {
            if (upload.usePresigned) {
                await processPresignedUpload(upload);
            } else {
                await processDirectUpload(upload);
            }
        } finally {
            processingRef.current.delete(upload.id);
            abortControllersRef.current.delete(upload.id);
        }
    }, [processPresignedUpload, processDirectUpload]);

    // Process pending uploads
    useEffect(() => {
        const pendingUploads = uploads.filter((u) => u.status === "pending");
        const currentlyProcessing = processingRef.current.size;
        const availableSlots = MAX_CONCURRENT_UPLOADS - currentlyProcessing;

        if (availableSlots <= 0 || pendingUploads.length === 0) {
            return;
        }

        // Start processing uploads up to the available slots
        const uploadsToProcess = pendingUploads.slice(0, availableSlots);
        uploadsToProcess.forEach((upload) => {
            processUpload(upload);
        });
    }, [uploads, processUpload]);

    // This component renders nothing - it just manages uploads
    return null;
}
