import JSZip from 'jszip';
import { getDownloadUrl } from './api/documents';
import {
    addDownload,
    updateDownloadProgress,
    setDownloadZipping,
    completeDownload,
    failDownload,
} from '@/store/downloads';

/**
 * Download a single file by opening its URL
 */
export async function downloadSingleFile(documentId: string, fileName?: string): Promise<void> {
    const { downloadUrl } = await getDownloadUrl(documentId);
    
    // Create a hidden link and click it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Fetch a file as a blob from a URL
 */
async function fetchFileAsBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
    }
    return response.blob();
}

/**
 * Download multiple files as a zip bundle with store tracking
 */
export async function downloadMultipleFilesWithTracking(
    documents: Array<{ id: string; name: string; size?: number }>,
    downloadId: string
): Promise<void> {
    const zip = new JSZip();
    const total = documents.length;
    
    // Track file names to handle duplicates
    const fileNameCounts = new Map<string, number>();
    
    // Fetch all files and add to zip
    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        updateDownloadProgress(
            downloadId,
            Math.round(((i) / total) * 90), // 0-90% for fetching
            doc.name,
            i + 1
        );
        
        try {
            // Get download URL
            const { downloadUrl } = await getDownloadUrl(doc.id);
            
            // Fetch file content
            const blob = await fetchFileAsBlob(downloadUrl);
            
            // Handle duplicate file names
            let fileName = doc.name;
            const count = fileNameCounts.get(fileName) || 0;
            if (count > 0) {
                const ext = fileName.lastIndexOf('.');
                if (ext > 0) {
                    fileName = `${fileName.slice(0, ext)} (${count})${fileName.slice(ext)}`;
                } else {
                    fileName = `${fileName} (${count})`;
                }
            }
            fileNameCounts.set(doc.name, count + 1);
            
            // Add to zip
            zip.file(fileName, blob);
        } catch (error) {
            console.error(`Failed to fetch ${doc.name}:`, error);
            // Continue with other files
        }
    }
    
    setDownloadZipping(downloadId);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFileName = `documents-${timestamp}.zip`;
    
    // Download the zip
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    completeDownload(downloadId);
}

/**
 * Smart download with indicator tracking
 * Returns the download ID for tracking
 */
export async function downloadFilesWithTracking(
    documents: Array<{ id: string; name: string; size?: number }>
): Promise<string> {
    if (documents.length === 0) {
        throw new Error('No documents to download');
    }
    
    const totalSize = documents.reduce((sum, d) => sum + (d.size || 0), 0);
    const isSingle = documents.length === 1;
    const displayName = isSingle 
        ? documents[0].name 
        : `${documents.length} files`;
    
    const downloadId = addDownload(
        crypto.randomUUID(),
        displayName,
        documents.length,
        totalSize
    );
    
    try {
        if (isSingle) {
            updateDownloadProgress(downloadId, 50, documents[0].name, 1);
            await downloadSingleFile(documents[0].id, documents[0].name);
            completeDownload(downloadId);
        } else {
            await downloadMultipleFilesWithTracking(documents, downloadId);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Download failed';
        failDownload(downloadId, message);
        throw error;
    }
    
    return downloadId;
}

// Legacy exports for backward compatibility
export interface DownloadProgress {
    current: number;
    total: number;
    fileName: string;
    phase: 'fetching' | 'zipping' | 'complete';
}

export async function downloadFiles(
    documents: Array<{ id: string; name: string }>,
    onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
    // Use the tracked version but ignore the progress callback
    // since we now use the indicator
    await downloadFilesWithTracking(documents);
}
