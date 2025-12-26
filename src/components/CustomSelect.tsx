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
                    /* Base option styles - Professional & Mobile optimized */
                    select#${id} option {
                        padding: 14px 20px;
                        background-color: #ffffff;
                        color: #1f2937;
                        font-size: 15px;
                        font-weight: 500;
                        line-height: 1.6;
                        letter-spacing: 0.01em;
                        min-height: 48px;
                        border: none;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: pointer;
                    }
                    
                    /* Dark mode option styles */
                    .dark select#${id} option {
                        background-color: #111827;
                        color: #f3f4f6;
                    }
                    
                    /* Hover states - Subtle and professional */
                    select#${id} option:hover {
                        background: linear-gradient(to right, #f9fafb 0%, #f3f4f6 100%);
                        color: #111827;
                        font-weight: 600;
                        transform: translateX(2px);
                    }
                    .dark select#${id} option:hover {
                        background: linear-gradient(to right, #1f2937 0%, #374151 100%);
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    /* Selected/Focused states - Premium accent styling */
                    select#${id} option:checked,
                    select#${id} option:focus {
                        background: linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%);
                        color: #dc2626;
                        font-weight: 600;
                        position: relative;
                        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
                    }
                    .dark select#${id} option:checked,
                    .dark select#${id} option:focus {
                        background: linear-gradient(135deg, rgba(254, 100, 95, 0.2) 0%, rgba(254, 100, 95, 0.1) 100%);
                        color: #FE645F;
                        font-weight: 600;
                        box-shadow: 0 2px 12px rgba(254, 100, 95, 0.25);
                    }
                    
                    /* Active state for better feedback */
                    select#${id} option:active {
                        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                        transform: scale(0.98);
                    }
                    .dark select#${id} option:active {
                        background: linear-gradient(135deg, rgba(254, 100, 95, 0.3) 0%, rgba(254, 100, 95, 0.2) 100%);
                    }
                    
                    /* Disabled states - Professional muted appearance */
                    select#${id} option:disabled {
                        background-color: #f9fafb;
                        color: #9ca3af;
                        font-weight: 400;
                        opacity: 0.6;
                        cursor: not-allowed;
                        font-style: normal;
                    }
                    .dark select#${id} option:disabled {
                        background-color: #1f2937;
                        color: #6b7280;
                        opacity: 0.5;
                    }
                    
                    /* Placeholder option styling */
                    select#${id} option[value=""][disabled] {
                        color: #9ca3af;
                        font-weight: 400;
                        font-style: italic;
                        background-color: #ffffff;
                    }
                    .dark select#${id} option[value=""][disabled] {
                        color: #6b7280;
                        background-color: #111827;
                    }
                    
                    /* Desktop - Refined spacing and typography */
                    @media (min-width: 640px) {
                        select#${id} option {
                            padding: 12px 18px;
                            font-size: 14px;
                            min-height: 42px;
                            letter-spacing: 0.005em;
                        }
                    }
                    
                    /* Large screens - Premium spacing */
                    @media (min-width: 1024px) {
                        select#${id} option {
                            padding: 13px 20px;
                            font-size: 14.5px;
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

