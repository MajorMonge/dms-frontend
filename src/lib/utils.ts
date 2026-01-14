export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function getFileIcon(type: string): string {
    const iconMap: Record<string, string> = {
        pdf: "📄",
        doc: "📝",
        docx: "📝",
        xls: "📊",
        xlsx: "📊",
        ppt: "📽️",
        pptx: "📽️",
        jpg: "🖼️",
        jpeg: "🖼️",
        png: "🖼️",
        gif: "🖼️",
        mp4: "🎬",
        mp3: "🎵",
        zip: "📦",
        default: "📁",
    };

    return iconMap[type.toLowerCase()] || iconMap.default;
}
