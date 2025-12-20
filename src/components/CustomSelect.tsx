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
                    select#${id} option {
                        padding: 12px 16px;
                        background-color: white;
                        color: #374151;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    .dark select#${id} option {
                        background-color: #1f2937;
                        color: #e5e7eb;
                    }
                    select#${id} option:hover {
                        background-color: #f3f4f6;
                    }
                    .dark select#${id} option:hover {
                        background-color: #374151;
                    }
                    select#${id} option:checked,
                    select#${id} option:focus {
                        background-color: #fef3f2;
                        color: #ec4899;
                        font-weight: 500;
                    }
                    .dark select#${id} option:checked,
                    .dark select#${id} option:focus {
                        background-color: #831843;
                        color: #f9a8d4;
                    }
                    select#${id} option:disabled {
                        color: #9ca3af;
                        font-style: italic;
                        opacity: 0.5;
                    }
                    .dark select#${id} option:disabled {
                        color: #6b7280;
                        opacity: 0.5;
                    }
                `
            }} />
            <div className='relative'>
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={cn(
                        "flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 pr-10",
                        "text-sm font-medium ring-offset-background",
                        "appearance-none cursor-pointer",
                        "outline-none transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        !value && placeholder 
                            ? "text-muted-foreground" 
                            : "text-foreground",
                        className
                    )}
                >
                    {placeholder && (
                        <option value="" disabled className="text-muted-foreground">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option 
                            key={option.value} 
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                    <ChevronDown 
                        size={20} 
                        className={cn(
                            "text-muted-foreground transition-transform",
                            disabled && "opacity-50"
                        )}
                    />
                </div>
            </div>
        </>
    )
}

export default CustomSelect

