import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { documentKeys } from './documents';
import { folderKeys } from './folders';
import type { ApiResponse } from '@/types/api';
import type { 
    PdfInfo, 
    SplitPdfBody, 
    SplitPdfResponse, 
    PdfJobInfo 
} from '../validations/pdf';

// ============= Query Keys =============

export const pdfKeys = {
    all: ['pdf'] as const,
    info: (id: string) => [...pdfKeys.all, 'info', id] as const,
    jobs: () => [...pdfKeys.all, 'jobs'] as const,
    job: (jobId: string) => [...pdfKeys.all, 'job', jobId] as const,
    queuedJobs: () => [...pdfKeys.all, 'jobs', 'queued'] as const,
    workerStats: () => [...pdfKeys.all, 'workers', 'stats'] as const,
};

// ============= PDF API Functions =============

/**
 * Get PDF information (page count, metadata)
 */
export async function getPdfInfo(documentId: string): Promise<PdfInfo> {
    const response = await apiClient<ApiResponse<PdfInfo>>(`/api/v1/pdf/${documentId}/info`, {
        method: 'GET',
    });
    
    if (!response.success || !response.data) {
        throw new Error('Failed to get PDF info');
    }
    
    return response.data;
}

/**
 * Split a PDF document
 */
export async function splitPdf(
    documentId: string, 
    body: SplitPdfBody
): Promise<SplitPdfResponse> {
    const response = await apiClient<ApiResponse<SplitPdfResponse>>(`/api/v1/pdf/${documentId}/split`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    
    if (!response.success || !response.data) {
        throw new Error('Failed to split PDF');
    }
    
    return response.data;
}

/**
 * Get all jobs for the current user
 */
export async function getPdfJobs(): Promise<PdfJobInfo[]> {
    const response = await apiClient<ApiResponse<PdfJobInfo[]>>('/api/v1/pdf/jobs', {
        method: 'GET',
    });
    
    if (!response.success || !response.data) {
        throw new Error('Failed to get PDF jobs');
    }
    
    return response.data;
}

/**
 * Get queued jobs for the current user
 */
export async function getQueuedPdfJobs(): Promise<PdfJobInfo[]> {
    const response = await apiClient<ApiResponse<PdfJobInfo[]>>('/api/v1/pdf/jobs/queued', {
        method: 'GET',
    });
    
    if (!response.success || !response.data) {
        throw new Error('Failed to get queued PDF jobs');
    }
    
    return response.data;
}

/**
 * Get a specific job
 */
export async function getPdfJob(jobId: string): Promise<PdfJobInfo> {
    const response = await apiClient<ApiResponse<PdfJobInfo>>(`/api/v1/pdf/jobs/${jobId}`, {
        method: 'GET',
    });
    
    if (!response.success || !response.data) {
        throw new Error('Failed to get PDF job');
    }
    
    return response.data;
}

/**
 * Cancel a job
 */
export async function cancelPdfJob(jobId: string): Promise<{ cancelled: boolean; wasProcessing: boolean }> {
    const response = await apiClient<ApiResponse<{ cancelled: boolean; wasProcessing: boolean }>>(
        `/api/v1/pdf/jobs/${jobId}/cancel`,
        { method: 'POST' }
    );
    
    if (!response.success || !response.data) {
        throw new Error('Failed to cancel PDF job');
    }
    
    return response.data;
}

/**
 * Get worker pool statistics
 */
export async function getWorkerStats(): Promise<{ total: number; busy: number; queued: number }> {
    const response = await apiClient<ApiResponse<{ total: number; busy: number; queued: number }>>(
        '/api/v1/pdf/workers/stats',
        { method: 'GET' }
    );
    
    if (!response.success || !response.data) {
        throw new Error('Failed to get worker stats');
    }
    
    return response.data;
}

// ============= React Query Hooks =============

/**
 * Hook to get PDF information
 */
export function usePdfInfo(documentId: string | undefined) {
    return useQuery({
        queryKey: pdfKeys.info(documentId || ''),
        queryFn: () => getPdfInfo(documentId!),
        enabled: !!documentId,
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to split a PDF
 */
export function useSplitPdf(options?: {
    onSuccess?: (data: SplitPdfResponse) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ documentId, body }: { documentId: string; body: SplitPdfBody }) => 
            splitPdf(documentId, body),
        onSuccess: async (data) => {
            // Invalidate document lists to show new split files
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: documentKeys.all }),
                queryClient.invalidateQueries({ queryKey: folderKeys.all }),
            ]);
            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            options?.onError?.(error);
        },
    });
}

/**
 * Hook to get all PDF jobs
 */
export function usePdfJobs() {
    return useQuery({
        queryKey: pdfKeys.jobs(),
        queryFn: getPdfJobs,
        staleTime: 0,
        gcTime: 0,
    });
}

/**
 * Hook to get queued PDF jobs
 */
export function useQueuedPdfJobs() {
    return useQuery({
        queryKey: pdfKeys.queuedJobs(),
        queryFn: getQueuedPdfJobs,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 5000, // Poll every 5 seconds
    });
}

/**
 * Hook to get a specific PDF job
 */
export function usePdfJob(jobId: string | undefined, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: pdfKeys.job(jobId || ''),
        queryFn: () => getPdfJob(jobId!),
        enabled: !!jobId,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: options?.refetchInterval,
    });
}

/**
 * Hook to cancel a PDF job
 */
export function useCancelPdfJob(options?: {
    onSuccess?: (data: { cancelled: boolean; wasProcessing: boolean }) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId: string) => cancelPdfJob(jobId),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: pdfKeys.jobs() });
            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            options?.onError?.(error);
        },
    });
}

/**
 * Hook to get worker statistics
 */
export function useWorkerStats() {
    return useQuery({
        queryKey: pdfKeys.workerStats(),
        queryFn: getWorkerStats,
        staleTime: 5000,
        gcTime: 10000,
        refetchInterval: 10000,
    });
}
