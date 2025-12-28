'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
    maxWidth?: string
    showCloseButton?: boolean
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    maxWidth = 'max-w-[500px]',
    showCloseButton = true,
}: ModalProps) {
    const [isAnimating, setIsAnimating] = useState(false)

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
            // Trigger animation
            setTimeout(() => setIsAnimating(true), 10)
        } else {
            document.body.style.overflow = 'unset'
            setIsAnimating(false)
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 !mt-0",
                "transition-opacity duration-300",
                isAnimating ? "opacity-100" : "opacity-0"
            )}
            // onClick={onClose}
        >
            {/* Overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/80 backdrop-blur-sm",
                    "transition-opacity duration-300",
                    isAnimating ? "opacity-100" : "opacity-0"
                )}
                // onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    'relative z-50 w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl',
                    'transform transition-all duration-300',
                    maxWidth,
                    isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4',
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 cursor-pointer rounded-sm opacity-70 hover:opacity-100 transition-opacity border-none bg-transparent focus:ring-gray-400 z-10 p-1 group"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5 text-white group-hover:text-gray-300" />
                    </button>
                )}

                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pt-4 border-b border-gray-200 dark:border-theme-gray-100">
                        {title && (
                            <h2 className="text-2xl font-bold text-theme-red-200 dark:text-theme-red-200 pr-8">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-sm text-theme-red-200 dark:text-theme-red-200">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

