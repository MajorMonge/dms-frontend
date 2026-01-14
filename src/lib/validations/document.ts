import { z } from 'zod';

// ============= Constants =============

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
export const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB) || 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Default allowed file extensions (without dots)
const DEFAULT_ALLOWED_EXTENSIONS = [
    // Documents
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md',
    // Spreadsheets
    'xls', 'xlsx', 'csv', 'ods',
    // Presentations
    'ppt', 'pptx', 'odp',
    // Data/Config
    'json', 'xml', 'yaml', 'yml',
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
    // Web
    'html', 'htm',
];

// Parse allowed extensions from env var (comma-separated) or use defaults
// Example: NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,xlsx,jpg,png
const parseAllowedExtensions = (): string[] => {
    const envValue = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES;
    if (!envValue) return DEFAULT_ALLOWED_EXTENSIONS;
    
    return envValue
        .split(',')
        .map(ext => ext.trim().toLowerCase().replace(/^\./, '')) // Remove leading dots, trim, lowercase
        .filter(ext => ext.length > 0);
};

export const ALLOWED_FILE_EXTENSIONS = parseAllowedExtensions();

// MIME type mapping for the accept attribute
export const ALLOWED_MIME_TYPES: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    rtf: 'application/rtf',
    odt: 'application/vnd.oasis.opendocument.text',
    md: 'text/markdown',
    // Spreadsheets
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    // Presentations
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odp: 'application/vnd.oasis.opendocument.presentation',
    // Data/Config
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/x-yaml',
    yml: 'application/x-yaml',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    // Web
    html: 'text/html',
    htm: 'text/html',
};

// Generate accept string for file input (e.g., ".pdf,.doc,.docx,...")
export const FILE_INPUT_ACCEPT = ALLOWED_FILE_EXTENSIONS.map(ext => `.${ext}`).join(',');

// ============= Base Schemas =============

export const objectIdSchema = z.string().regex(OBJECT_ID_REGEX, 'Invalid ID format');

// ============= Document Schemas =============

export const createDocumentBodySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateDocumentBodySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const idParamsSchema = z.object({
    id: objectIdSchema,
});

export const deleteDocumentQuerySchema = z.object({
    permanent: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

export const listDocumentsQuerySchema = z.object({
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional().transform(val =>
        val ? (Array.isArray(val) ? val : val.split(',')) : undefined
    ),
    search: z.string().max(100).optional(),
    includeDeleted: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 20),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const presignedUploadBodySchema = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    size: z.number().min(1).max(MAX_FILE_SIZE_MB * 1024 * 1024),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
});

export const confirmUploadBodySchema = z.object({
    key: z.string().min(1),
    name: z.string().min(1).max(255).optional(),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const moveDocumentBodySchema = z.object({
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable(),
});

export const copyDocumentBodySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
});

export const searchDocumentsQuerySchema = z.object({
    query: z.string().max(200).optional(),
    name: z.string().max(100).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional().transform(val =>
        val ? (Array.isArray(val) ? val : val.split(',')) : undefined
    ),
    extension: z.string().max(10).optional(),
    mimeType: z.string().max(100).optional(),
    minSize: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    maxSize: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    folderId: z.string().regex(OBJECT_ID_REGEX, 'Invalid folder ID').nullable().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 20),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'relevance']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============= Type Exports =============

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type IdParams = z.infer<typeof idParamsSchema>;
export type DeleteDocumentQuery = z.infer<typeof deleteDocumentQuerySchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type PresignedUploadBody = z.infer<typeof presignedUploadBodySchema>;
export type ConfirmUploadBody = z.infer<typeof confirmUploadBodySchema>;
export type MoveDocumentBody = z.infer<typeof moveDocumentBodySchema>;
export type CopyDocumentBody = z.infer<typeof copyDocumentBodySchema>;
export type SearchDocumentsQuery = z.infer<typeof searchDocumentsQuerySchema>;
