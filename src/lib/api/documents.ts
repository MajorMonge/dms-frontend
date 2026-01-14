import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { getAccessToken } from '@/store/auth';
import { folderKeys } from './folders';
import { userKeys } from './user';
import type {
    Document,
    DocumentListResponse,
    DownloadUrlResponse,
    PresignedUploadResponse,
    ApiResponse,
} from '@/types/api';

// ============= Query Keys =============

export const documentKeys = {
    all: ['documents'] as const,
    lists: () => [...documentKeys.all, 'list'] as const,
    list: (params: ListDocumentsParams) => [...documentKeys.lists(), params] as const,
    details: () => [...documentKeys.all, 'detail'] as const,
    detail: (id: string) => [...documentKeys.details(), id] as const,
    trash: () => [...documentKeys.all, 'trash'] as const,
    search: (params: SearchDocumentsParams) => [...documentKeys.all, 'search', params] as const,
};

// ============= Types =============

export interface ListDocumentsParams {
    folderId?: string;
    tags?: string[];
    search?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
    sortOrder?: 'asc' | 'desc';
}

export interface SearchDocumentsParams {
    query?: string;
    name?: string;
    tags?: string[];
    extension?: string;
    mimeType?: string;
    minSize?: number;
    maxSize?: number;
    dateFrom?: string;
    dateTo?: string;
    folderId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'relevance';
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateDocumentData {
    name?: string;
    folderId?: string | null;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

// ============= Document API Functions =============

/**
 * List documents with optional filters
 */
export async function listDocuments(params: ListDocumentsParams = {}): Promise<DocumentListResponse> {
    const searchParams = new URLSearchParams();
    
    // For root folder (no folderId), pass 'null' to get only root-level documents
    // If folderId is specified, use it; otherwise use 'null' for root
    if (params.folderId) {
        searchParams.set('folderId', params.folderId);
    } else {
        searchParams.set('folderId', 'null');
    }
    if (params.tags?.length) {
        searchParams.set('tags', params.tags.join(','));
    }
    if (params.search) {
        searchParams.set('search', params.search);
    }
    if (params.includeDeleted) {
        searchParams.set('includeDeleted', 'true');
    }
    if (params.page) {
        searchParams.set('page', String(params.page));
    }
    if (params.limit) {
        searchParams.set('limit', String(params.limit));
    }
    if (params.sortBy) {
        searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
        searchParams.set('sortOrder', params.sortOrder);
    }

    const query = searchParams.toString();
    const url = `/api/v1/documents${query ? `?${query}` : ''}`;
    
    const response = await apiClient<ApiResponse<DocumentListResponse>>(url);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch documents');
    }
    
    return response.data;
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<Document> {
    const response = await apiClient<ApiResponse<Document>>(`/api/v1/documents/${id}`);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch document');
    }
    
    return response.data;
}

/**
 * Update document metadata
 */
export async function updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await apiClient<ApiResponse<Document>>(`/api/v1/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to update document');
    }
    
    return response.data;
}

/**
 * Delete a document (soft delete by default)
 */
export async function deleteDocument(id: string, permanent = false): Promise<void> {
    const url = permanent ? `/api/v1/documents/${id}?permanent=true` : `/api/v1/documents/${id}`;
    
    const response = await apiClient<ApiResponse<void> | undefined>(url, {
        method: 'DELETE',
    });
    
    console.log('[deleteDocument] Response:', response);
    
    // Check if the response indicates an error (for non-204 responses)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyResponse = response as any;
    if (anyResponse && anyResponse.success === false) {
        throw new Error(anyResponse.error?.message || 'Failed to delete document');
    }
}

/**
 * Move document to a different folder
 */
export async function moveDocument(id: string, folderId: string | null): Promise<Document> {
    const response = await apiClient<ApiResponse<Document>>(`/api/v1/documents/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ folderId }),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to move document');
    }
    
    return response.data;
}

/**
 * Copy a document
 */
export async function copyDocument(id: string, name?: string, folderId?: string | null): Promise<Document> {
    const response = await apiClient<ApiResponse<Document>>(`/api/v1/documents/${id}/copy`, {
        method: 'POST',
        body: JSON.stringify({ name, folderId }),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to copy document');
    }
    
    return response.data;
}

/**
 * Restore document from trash
 */
export async function restoreDocument(id: string): Promise<Document> {
    const response = await apiClient<ApiResponse<Document> | undefined>(`/api/v1/documents/${id}/restore`, {
        method: 'POST',
    });
    
    // Handle empty response
    if (!response) {
        throw new Error('No response from server');
    }
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to restore document');
    }
    
    return response.data;
}

/**
 * Get download URL for a document
 */
export async function getDownloadUrl(id: string): Promise<DownloadUrlResponse> {
    const response = await apiClient<ApiResponse<DownloadUrlResponse>>(`/api/v1/documents/${id}/download`);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to get download URL');
    }
    
    return response.data;
}

// ============= Upload API Functions =============

export interface PresignedUploadRequest {
    fileName: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
}

export interface ConfirmUploadRequest {
    key: string;
    name?: string;
    folderId?: string | null;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

/**
 * Get presigned URL for direct S3 upload
 */
export async function getPresignedUploadUrl(data: PresignedUploadRequest): Promise<PresignedUploadResponse> {
    const response = await apiClient<ApiResponse<PresignedUploadResponse>>('/api/v1/documents/upload/presigned', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to get upload URL');
    }
    
    return response.data;
}

/**
 * Upload file directly to S3 using presigned URL
 */
export async function uploadToPresignedUrl(
    uploadUrl: string, 
    file: File,
    onProgress?: (progress: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
    });
}

/**
 * Confirm upload after uploading to presigned URL
 */
export async function confirmUpload(data: ConfirmUploadRequest): Promise<Document> {
    const response = await apiClient<ApiResponse<Document>>('/api/v1/documents/upload/confirm', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to confirm upload');
    }
    
    return response.data;
}

/**
 * Direct upload via multipart form data (for smaller files)
 */
export async function uploadDirect(
    file: File,
    options?: { name?: string; folderId?: string | null; tags?: string[] },
    onProgress?: (progress: number) => void
): Promise<Document> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.name) formData.append('name', options.name);
        if (options?.folderId) formData.append('folderId', options.folderId);
        if (options?.tags?.length) formData.append('tags', options.tags.join(','));
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });
        
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error?.message || 'Upload failed'));
                }
            } catch {
                reject(new Error('Failed to parse response'));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });
        
        xhr.open('POST', `${API_BASE_URL}/api/v1/documents/upload`);
        
        // Add auth header
        const token = getAccessToken();
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
    });
}

/**
 * Get documents in trash
 */
export async function getTrashDocuments(page = 1, limit = 20): Promise<DocumentListResponse> {
    const response = await apiClient<ApiResponse<DocumentListResponse>>(
        `/api/v1/documents/trash?page=${page}&limit=${limit}`
    );
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch trash');
    }
    
    return response.data;
}

/**
 * Empty trash (permanently delete all)
 */
export async function emptyTrash(): Promise<{ deletedCount: number }> {
    const response = await apiClient<ApiResponse<{ deletedCount: number }>>('/api/v1/documents/trash', {
        method: 'DELETE',
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to empty trash');
    }
    
    return response.data;
}

/**
 * Search documents with advanced filters
 */
export async function searchDocuments(params: SearchDocumentsParams): Promise<DocumentListResponse & { searchMeta?: { query: string; resultsFound: number; searchTime: number } }> {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.set('query', params.query);
    if (params.name) searchParams.set('name', params.name);
    if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params.extension) searchParams.set('extension', params.extension);
    if (params.mimeType) searchParams.set('mimeType', params.mimeType);
    if (params.minSize !== undefined) searchParams.set('minSize', String(params.minSize));
    if (params.maxSize !== undefined) searchParams.set('maxSize', String(params.maxSize));
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    // Only include folderId if it's a valid ID (omit for root)
    if (params.folderId) {
        searchParams.set('folderId', params.folderId);
    }
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await apiClient<ApiResponse<DocumentListResponse & { searchMeta?: { query: string; resultsFound: number; searchTime: number } }>>(
        `/api/v1/documents/search${query ? `?${query}` : ''}`
    );
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to search documents');
    }
    
    return response.data;
}

// ============= React Query Hooks =============

/**
 * Hook to list documents
 */
export function useDocuments(params: ListDocumentsParams = {}) {
    return useQuery({
        queryKey: documentKeys.list(params),
        queryFn: () => listDocuments(params),
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to list documents with infinite scroll pagination
 */
export function useInfiniteDocuments(params: Omit<ListDocumentsParams, 'page'> = {}) {
    return useInfiniteQuery({
        queryKey: [...documentKeys.lists(), 'infinite', params] as const,
        queryFn: ({ pageParam = 1 }) => listDocuments({ ...params, page: pageParam, limit: params.limit || 20 }),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage;
            if (pagination.page < pagination.totalPages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to get a single document
 */
export function useDocument(id: string) {
    return useQuery({
        queryKey: documentKeys.detail(id),
        queryFn: () => getDocument(id),
        enabled: !!id,
    });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument(options?: { onSuccess?: () => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) => deleteDocument(id, permanent),
        onSuccess: async () => {
            console.log('[useDeleteDocument] onSuccess - invalidating queries');
            // Invalidate all document and folder queries to ensure list updates
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: documentKeys.all }),
                queryClient.invalidateQueries({ queryKey: folderKeys.all }),
                queryClient.invalidateQueries({ queryKey: userKeys.storage() }),
            ]);
            options?.onSuccess?.();
        },
        onError: (error) => {
            console.log('[useDeleteDocument] onError - invalidating queries', error);
            // Invalidate cache on error too (e.g., document already deleted)
            // Fire and forget - don't await
            queryClient.invalidateQueries({ queryKey: documentKeys.all });
            queryClient.invalidateQueries({ queryKey: folderKeys.all });
            queryClient.invalidateQueries({ queryKey: userKeys.storage() });
            options?.onError?.(error);
        },
    });
}

/**
 * Hook to move a document
 */
export function useMoveDocument(options?: { onSuccess?: (doc: Document) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) => moveDocument(id, folderId),
        onSuccess: (doc) => {
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
            options?.onSuccess?.(doc);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to update a document
 */
export function useUpdateDocument(options?: { onSuccess?: (doc: Document) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) => updateDocument(id, data),
        onSuccess: (doc) => {
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: documentKeys.detail(doc.id) });
            options?.onSuccess?.(doc);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to get trash documents
 */
export function useTrashDocuments(page = 1, limit = 20) {
    return useQuery({
        queryKey: [...documentKeys.trash(), { page, limit }] as const,
        queryFn: () => getTrashDocuments(page, limit),
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to search documents
 */
export function useSearchDocuments(params: SearchDocumentsParams, enabled = true) {
    return useQuery({
        queryKey: documentKeys.search(params),
        queryFn: () => searchDocuments(params),
        enabled: enabled && !!(params.query || params.name || params.tags?.length || params.extension),
    });
}

/**
 * Hook to restore a document from trash
 */
export function useRestoreDocument(options?: { onSuccess?: (doc: Document) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: restoreDocument,
        onSuccess: async (doc) => {
            // Invalidate all document and folder queries to ensure lists update
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: documentKeys.all }),
                queryClient.invalidateQueries({ queryKey: folderKeys.all }),
                queryClient.invalidateQueries({ queryKey: userKeys.storage() }),
            ]);
            options?.onSuccess?.(doc);
        },
        onError: async (error) => {
            // Invalidate cache on error too
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: documentKeys.all }),
                queryClient.invalidateQueries({ queryKey: folderKeys.all }),
                queryClient.invalidateQueries({ queryKey: userKeys.storage() }),
            ]);
            options?.onError?.(error);
        },
    });
}

/**
 * Hook to copy a document
 */
export function useCopyDocument(options?: { onSuccess?: (doc: Document) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, name, folderId }: { id: string; name?: string; folderId?: string | null }) => 
            copyDocument(id, name, folderId),
        onSuccess: (doc) => {
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
            options?.onSuccess?.(doc);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to get download URL
 */
export function useDownloadUrl(id: string, enabled = false) {
    return useQuery({
        queryKey: [...documentKeys.detail(id), 'download'] as const,
        queryFn: () => getDownloadUrl(id),
        enabled: enabled && !!id,
        staleTime: 0, // Always fetch fresh URL
        gcTime: 0, // Don't cache
    });
}

/**
 * Hook to empty trash
 */
export function useEmptyTrash(options?: { onSuccess?: (result: { deletedCount: number }) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: emptyTrash,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: documentKeys.trash() });
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.storage() });
            options?.onSuccess?.(result);
        },
        onError: options?.onError,
    });
}
