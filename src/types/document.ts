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

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}
