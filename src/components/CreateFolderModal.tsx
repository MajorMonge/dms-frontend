"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, FolderPlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateFolder } from "@/lib/api/folders";
import toast from "react-hot-toast";

const createFolderSchema = z.object({
    name: z
        .string()
        .min(1, "Folder name is required")
        .max(255, "Folder name must be less than 255 characters")
        .refine((val) => !val.includes("/"), {
            message: "Folder name cannot contain forward slashes",
        }),
});

type CreateFolderForm = z.infer<typeof createFolderSchema>;

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string;
    onSuccess?: () => void;
}

export default function CreateFolderModal({
    isOpen,
    onClose,
    parentId,
    onSuccess,
}: CreateFolderModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors, isSubmitting },
    } = useForm<CreateFolderForm>({
        resolver: zodResolver(createFolderSchema),
        defaultValues: {
            name: "",
        },
    });

    const createFolder = useCreateFolder({
        onSuccess: () => {
            toast.success("Folder created successfully");
            reset();
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create folder");
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset();
            // Focus the input after a short delay to ensure modal is rendered
            setTimeout(() => setFocus("name"), 100);
        }
    }, [isOpen, reset, setFocus]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const onSubmit = (data: CreateFolderForm) => {
        createFolder.mutate({
            name: data.name.trim(),
            parentId: parentId || undefined,
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
                                        <FolderPlus className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Create New Folder</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={isSubmitting || createFolder.isPending}
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
                                            disabled={isSubmitting || createFolder.isPending}
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
                                        disabled={isSubmitting || createFolder.isPending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting || createFolder.isPending}
                                    >
                                        {(isSubmitting || createFolder.isPending) ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <FolderPlus className="h-4 w-4" />
                                                Create Folder
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
