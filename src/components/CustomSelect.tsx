'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CustomSelectProps {
    id: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    id,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    className = ''
}) => {
    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Base option styles - Mobile optimized */
                    select#${id} option {
                        padding: 16px 20px;
                        background-color: white;
                        color: #374151;
                        font-size: 16px;
                        line-height: 1.5;
                        min-height: 44px;
                    }
                    
                    /* Dark mode option styles */
                    .dark select#${id} option {
                        background-color: #1f2937;
                        color: #e5e7eb;
                    }
                    
                    /* Hover states */
                    select#${id} option:hover {
                        background-color: #f3f4f6;
                    }
                    .dark select#${id} option:hover {
                        background-color: #374151;
                    }
                    
                    /* Selected/Focused states - Using app's red accent color */
                    select#${id} option:checked,
                    select#${id} option:focus {
                        background-color: #fef3f2;
                        color: #ec4899;
                        font-weight: 600;
                    }
                    .dark select#${id} option:checked,
                    .dark select#${id} option:focus {
                        background-color: rgba(254, 100, 95, 0.15);
                        color: #FE645F;
                        font-weight: 600;
                    }
                    
                    /* Disabled states */
                    select#${id} option:disabled {
                        color: #9ca3af;
                        font-style: italic;
                        opacity: 0.5;
                    }
                    .dark select#${id} option:disabled {
                        color: #6b7280;
                        opacity: 0.5;
                    }
                    
                    /* Desktop - smaller padding and font */
                    @media (min-width: 640px) {
                        select#${id} option {
                            padding: 12px 16px;
                            font-size: 14px;
                            min-height: auto;
                        }
                    }
                `
            }} />
            <div className='relative w-fit'>
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={cn(
                        // Base styles
                        "flex w-full rounded-full border border-input bg-background",
                        "text-sm sm:text-base font-medium ring-offset-background",
                        "appearance-none cursor-pointer",
                        "outline-none transition-all duration-200",
                        
                        // Mobile optimized - larger touch targets
                        "h-11 px-4 py-3 pr-11 sm:h-10 sm:px-4 sm:py-2 sm:pr-10",
                        
                        // Dark mode border and background
                        "dark:border-gray-600 dark:bg-gray-800",
                        "hover:border-gray-400 dark:hover:border-gray-500",
                        
                        // Focus states
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "focus-visible:border-ring",
                        "dark:focus-visible:ring-[#FE645F]/50",
                        
                        // Active states
                        "active:bg-gray-50 dark:active:bg-gray-700",
                        
                        // Disabled states
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "disabled:hover:border-input dark:disabled:hover:border-gray-600",
                        
                        // Text colors
                        !value && placeholder 
                            ? "text-muted-foreground dark:text-gray-400" 
                            : "text-foreground dark:text-gray-100",
                        
                        className
                    )}
                >
                    {placeholder && (
                        <option value="" disabled className="text-muted-foreground dark:text-gray-400">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option 
                            key={option.value} 
                            value={option.value}
                            className="dark:bg-gray-800 dark:text-gray-100"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className={cn(
                    'absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none',
                    'transition-transform duration-200'
                )}>
                    <ChevronDown 
                        size={20}
                        className={cn(
                            "text-muted-foreground dark:text-gray-400 transition-all",
                            disabled && "opacity-50",
                            // Mobile slightly larger
                            "sm:w-5 sm:h-5"
                        )}
                    />
                </div>
            </div>
        </>
    )
}

export default CustomSelect

