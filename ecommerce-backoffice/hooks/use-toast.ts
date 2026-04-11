"use client";

import { useState, useCallback } from "react";

interface ToastProps {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
        // For now, simple console and alert to avoid complex UI implementation
        // unless the project already has a Toast component
        console.log(`Toast: ${title} - ${description} (${variant})`);

        // Fallback to alert for visibility if it's destructive
        if (variant === "destructive") {
            alert(`${title}: ${description}`);
        }
    }, []);

    return { toast, toasts };
}
