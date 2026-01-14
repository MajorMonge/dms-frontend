import { z } from 'zod';

// ============= Constants =============

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// ============= Page Range Schema =============

const pageRangeSchema = z.object({
    start: z.number().int().positive().optional(),
    end: z.number().int().positive().optional(),
    pages: z.array(z.number().int().positive()).optional(),
}).refine(
    (data) => data.start !== undefined || data.end !== undefined || data.pages !== undefined,
    { message: 'Page range must specify start, end, or pages' }
);

// ============= Split PDF Schema =============

/**
 * Schema for splitting a PDF
 */
export const splitPdfBodySchema = z.object({
    mode: z.enum(['all', 'ranges', 'chunks', 'extract'], {
        message: 'Mode must be one of: all, ranges, chunks, extract',
    }),
    ranges: z.array(pageRangeSchema).optional(),
    chunkSize: z.number().int().min(1).max(100).optional(),
    pages: z.array(z.number().int().positive()).min(1).optional(),
    folderId: z
        .string()
        .regex(OBJECT_ID_REGEX, 'Invalid folder ID format')
        .nullable()
        .optional(),
    namePrefix: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
}).refine(
    (data) => {
        // Validate required fields based on mode
        if (data.mode === 'ranges' && (!data.ranges || data.ranges.length === 0)) {
            return false;
        }
        if (data.mode === 'chunks' && !data.chunkSize) {
            return false;
        }
        if (data.mode === 'extract' && (!data.pages || data.pages.length === 0)) {
            return false;
        }
        return true;
    },
    {
        message: 'Missing required field for the selected mode: ranges for "ranges", chunkSize for "chunks", pages for "extract"',
    }
);

/**
 * Schema for document ID in params
 */
export const pdfIdParamsSchema = z.object({
    id: z.string().regex(OBJECT_ID_REGEX, 'Invalid document ID format'),
});

// ============= Types =============

export type SplitPdfBody = z.infer<typeof splitPdfBodySchema>;
export type SplitMode = SplitPdfBody['mode'];
export type PageRange = z.infer<typeof pageRangeSchema>;

export interface PdfInfo {
    pageCount: number;
    title?: string | null;
    author?: string | null;
    subject?: string | null;
    creator?: string | null;
    producer?: string | null;
    creationDate?: string | null;
    modificationDate?: string | null;
    isEncrypted: boolean;
}

export interface SplitResultItem {
    documentId: string;
    name: string;
    pageCount: number;
    size: number;
    pages: number[];
}

export interface SplitPdfResponse {
    originalDocumentId: string;
    originalPageCount: number;
    outputDocuments: SplitResultItem[];
    totalOutputSize: number;
}

export interface PdfJobInfo {
    jobId: string;
    taskId: string;
    type: 'split' | 'getInfo';
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    documentId: string;
    ownerId: string;
    createdAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    error?: string | null;
}
