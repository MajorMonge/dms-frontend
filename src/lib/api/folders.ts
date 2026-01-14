import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userKeys } from './user';
import type {
    Folder,
    FolderWithCounts,
    Breadcrumb,
    FolderListResponse,
    ApiResponse,
} from '@/types/api';

// ============= Query Keys =============

export const folderKeys = {
    all: ['folders'] as const,
    lists: () => [...folderKeys.all, 'list'] as const,
    list: (params: ListFoldersParams) => [...folderKeys.lists(), params] as const,
    details: () => [...folderKeys.all, 'detail'] as const,
    detail: (id: string) => [...folderKeys.details(), id] as const,
    breadcrumbs: (id: string) => [...folderKeys.all, 'breadcrumbs', id] as const,
    subfolders: (id: string) => [...folderKeys.all, 'subfolders', id] as const,
    tree: (rootId?: string) => [...folderKeys.all, 'tree', rootId] as const,
};

// ============= Types =============

export interface ListFoldersParams {
    parentId?: string;
    search?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface CreateFolderData {
    name: string;
    parentId?: string | null;
    metadata?: Record<string, unknown>;
}

export interface UpdateFolderData {
    name?: string;
    metadata?: Record<string, unknown>;
}

// ============= Folder API Functions =============

/**
 * List folders with optional filters
 */
export async function listFolders(params: ListFoldersParams = {}): Promise<FolderListResponse> {
    const searchParams = new URLSearchParams();
    
    // Only include parentId if it's a valid ID (omit for root)
    if (params.parentId) {
        searchParams.set('parentId', params.parentId);
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
    const url = `/api/v1/folders${query ? `?${query}` : ''}`;
    
    const response = await apiClient<ApiResponse<FolderListResponse>>(url);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch folders');
    }
    
    return response.data;
}

/**
 * Get a single folder by ID
 */
export async function getFolder(id: string, includeCounts = false): Promise<Folder | FolderWithCounts> {
    const url = includeCounts ? `/api/v1/folders/${id}?includeCounts=true` : `/api/v1/folders/${id}`;
    const response = await apiClient<ApiResponse<Folder | FolderWithCounts>>(url);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch folder');
    }
    
    return response.data;
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderData): Promise<Folder> {
    const response = await apiClient<ApiResponse<Folder>>('/api/v1/folders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to create folder');
    }
    
    return response.data;
}

/**
 * Update folder
 */
export async function updateFolder(id: string, data: UpdateFolderData): Promise<Folder> {
    const response = await apiClient<ApiResponse<Folder>>(`/api/v1/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to update folder');
    }
    
    return response.data;
}

/**
 * Delete folder permanently (documents inside are soft-deleted)
 * Returns stats about deleted folders and soft-deleted documents
 */
export async function deleteFolder(id: string): Promise<{ foldersDeleted: number; documentsSoftDeleted: number }> {
    const response = await apiClient<ApiResponse<{ foldersDeleted: number; documentsSoftDeleted: number }>>(
        `/api/v1/folders/${id}`,
        { method: 'DELETE' }
    );
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to delete folder');
    }
    
    return response.data;
}

/**
 * Move folder to different parent
 */
export async function moveFolder(id: string, parentId: string | null): Promise<Folder> {
    const response = await apiClient<ApiResponse<Folder>>(`/api/v1/folders/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ parentId }),
    });
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to move folder');
    }
    
    return response.data;
}

/**
 * Get folder breadcrumbs
 */
export async function getFolderBreadcrumbs(id: string): Promise<Breadcrumb[]> {
    const response = await apiClient<ApiResponse<Breadcrumb[]>>(`/api/v1/folders/${id}/breadcrumbs`);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch breadcrumbs');
    }
    
    return response.data;
}

/**
 * Get subfolders of a folder
 */
export async function getSubfolders(id: string): Promise<Folder[]> {
    const response = await apiClient<ApiResponse<Folder[]>>(`/api/v1/folders/${id}/subfolders`);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch subfolders');
    }
    
    return response.data;
}

/**
 * Get root folders
 */
export async function getRootFolders(): Promise<Folder[]> {
    const response = await apiClient<ApiResponse<Folder[]>>('/api/v1/folders/root');
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch root folders');
    }
    
    return response.data;
}

/**
 * Get folder tree
 */
export async function getFolderTree(rootId?: string): Promise<Folder[]> {
    const url = rootId ? `/api/v1/folders/tree?rootId=${rootId}` : '/api/v1/folders/tree';
    const response = await apiClient<ApiResponse<Folder[]>>(url);
    
    if (!response.success) {
        throw new Error('error' in response ? response.error.message : 'Failed to fetch folder tree');
    }
    
    return response.data;
}

// ============= React Query Hooks =============

/**
 * Hook to list folders
 */
export function useFolders(params: ListFoldersParams = {}) {
    return useQuery({
        queryKey: folderKeys.list(params),
        queryFn: () => listFolders(params),
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to get a single folder
 */
export function useFolder(id: string, includeCounts = false) {
    return useQuery({
        queryKey: folderKeys.detail(id),
        queryFn: () => getFolder(id, includeCounts),
        enabled: !!id,
    });
}

/**
 * Hook to get folder breadcrumbs
 */
export function useFolderBreadcrumbs(id: string | undefined) {
    return useQuery({
        queryKey: folderKeys.breadcrumbs(id || ''),
        queryFn: () => getFolderBreadcrumbs(id!),
        enabled: !!id,
    });
}

/**
 * Hook to get root folders (for home/root level)
 */
export function useRootFolders() {
    return useQuery({
        queryKey: [...folderKeys.all, 'root'] as const,
        queryFn: getRootFolders,
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to create a folder
 */
export function useCreateFolder(options?: { onSuccess?: (folder: Folder) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: createFolder,
        onSuccess: (folder) => {
            queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
            options?.onSuccess?.(folder);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to delete a folder (permanent deletion - documents are soft-deleted)
 */
export function useDeleteFolder(options?: { 
    onSuccess?: (result: { foldersDeleted: number; documentsSoftDeleted: number }) => void; 
    onError?: (error: Error) => void 
}) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteFolder,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folderKeys.all });
            // Also invalidate documents since they may have been soft-deleted
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            // Update storage info since folder deletion affects storage
            queryClient.invalidateQueries({ queryKey: userKeys.storage() });
            options?.onSuccess?.(result);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to update a folder
 */
export function useUpdateFolder(options?: { onSuccess?: (folder: Folder) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateFolderData }) => updateFolder(id, data),
        onSuccess: (folder) => {
            queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folderKeys.detail(folder.id) });
            options?.onSuccess?.(folder);
        },
        onError: options?.onError,
    });
}

/**
 * Hook to move a folder
 */
export function useMoveFolder(options?: { onSuccess?: (folder: Folder) => void; onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) => moveFolder(id, parentId),
        onSuccess: (folder) => {
            queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folderKeys.detail(folder.id) });
            options?.onSuccess?.(folder);
        },
        onError: options?.onError,
    });
}
