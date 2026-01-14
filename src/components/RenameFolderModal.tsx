"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateFolder } from "@/lib/api/folders";
import toast from "react-hot-toast";

const renameFolderSchema = z.object({
    name: z
        .string()
        .min(1, "Folder name is required")
        .max(255, "Folder name must be less than 255 characters")
        .refine((val) => !val.includes("/"), {
            message: "Folder name cannot contain forward slashes",
        }),
});

type RenameFolderForm = z.infer<typeof renameFolderSchema>;

interface RenameFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    currentName: string;
    onSuccess?: () => void;
}

export default function RenameFolderModal({
    isOpen,
    onClose,
    folderId,
    currentName,
    onSuccess,
}: RenameFolderModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors, isSubmitting },
    } = useForm<RenameFolderForm>({
        resolver: zodResolver(renameFolderSchema),
        defaultValues: {
            name: currentName,
        },
    });

    const updateFolder = useUpdateFolder({
        onSuccess: () => {
            toast.success("Folder renamed successfully");
            reset();
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to rename folder");
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset({ name: currentName });
            setTimeout(() => {
                setFocus("name");
            }, 100);
        }
    }, [isOpen, reset, setFocus, currentName]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const onSubmit = (data: RenameFolderForm) => {
        const trimmedName = data.name.trim();
        if (trimmedName === currentName) {
            onClose();
            return;
        }
        updateFolder.mutate({
            id: folderId,
            data: { name: trimmedName },
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-base-100 rounded-xl shadow-xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-base-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Pencil className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Rename Folder</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={isSubmitting || updateFolder.isPending}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="p-4">
                                    <label className="form-control w-full">
                                        <div className="label">
                                            <span className="label-text font-medium">Folder Name</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter folder name"
                                            className={`input input-bordered w-full ${
                                                errors.name ? "input-error" : ""
                                            }`}
                                            {...register("name")}
                                            disabled={isSubmitting || updateFolder.isPending}
                                        />
                                        {errors.name && (
                                            <div className="label">
                                                <span className="label-text-alt text-error">
                                                    {errors.name.message}
                                                </span>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end gap-2 p-4 border-t border-base-200">
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={onClose}
                                        disabled={isSubmitting || updateFolder.isPending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting || updateFolder.isPending}
                                    >
                                        {(isSubmitting || updateFolder.isPending) ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Renaming...
                                            </>
                                        ) : (
                                            <>
                                                <Pencil className="h-4 w-4" />
                                                Rename
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
