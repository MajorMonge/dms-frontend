"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateDocument } from "@/lib/api/documents";
import toast from "react-hot-toast";

const renameDocumentSchema = z.object({
    name: z
        .string()
        .min(1, "Document name is required")
        .max(255, "Document name must be less than 255 characters")
        .refine((val) => !val.includes("/"), {
            message: "Document name cannot contain forward slashes",
        }),
});

type RenameDocumentForm = z.infer<typeof renameDocumentSchema>;

interface RenameDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    currentName: string;
    onSuccess?: () => void;
}

export default function RenameDocumentModal({
    isOpen,
    onClose,
    documentId,
    currentName,
    onSuccess,
}: RenameDocumentModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors, isSubmitting },
    } = useForm<RenameDocumentForm>({
        resolver: zodResolver(renameDocumentSchema),
        defaultValues: {
            name: currentName,
        },
    });

    const updateDocument = useUpdateDocument({
        onSuccess: () => {
            toast.success("Document renamed successfully");
            reset();
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to rename document");
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset({ name: currentName });
            setTimeout(() => {
                setFocus("name");
            }, 100);
        }
    }, [isOpen, currentName, reset, setFocus]);

    const onSubmit = (data: RenameDocumentForm) => {
        if (data.name === currentName) {
            onClose();
            return;
        }
        updateDocument.mutate({ id: documentId, data: { name: data.name } });
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen && !updateDocument.isPending) {
            onClose();
        }
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
                        onClick={() => !updateDocument.isPending && onClose()}
                        onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler}
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
                                    <h3 className="text-lg font-semibold">Rename Document</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    disabled={updateDocument.isPending}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text">Document name</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter document name"
                                        className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
                                        {...register("name")}
                                        disabled={updateDocument.isPending}
                                    />
                                    {errors.name && (
                                        <label className="label">
                                            <span className="label-text-alt text-error">
                                                {errors.name.message}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={onClose}
                                        disabled={updateDocument.isPending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={updateDocument.isPending}
                                    >
                                        {updateDocument.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Renaming...
                                            </>
                                        ) : (
                                            "Rename"
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
