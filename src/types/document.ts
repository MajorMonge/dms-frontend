/**
 * @deprecated Use Document and Folder types from @/types/api instead
 * These types are kept for backward compatibility
 */

export interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
    url: string;
    folderId?: string;
}

export interface Folder {
    id: string;
    name: string;
    parentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * @deprecated Use User type from @/types/api instead
 */
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}
