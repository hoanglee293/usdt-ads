'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'

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
                    select#${id} option:checked {
                        background-color: #fef3f2;
                        color: #ec4899;
                        font-weight: 500;
                    }
                    .dark select#${id} option:checked {
                        background-color: #831843;
                        color: #f9a8d4;
                    }
                    select#${id} option:disabled {
                        color: #9ca3af;
                        font-style: italic;
                    }
                    .dark select#${id} option:disabled {
                        color: #6b7280;
                    }
                `
            }} />
            <div className='relative'>
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-2 pr-10 
                        border border-solid 
                        focus:border-gray-300 dark:focus:border-gray-600
                        border-theme-gray-100 dark:border-gray-700
                        rounded-full 
                        outline-none 
                        transition-all 
                        bg-gray-50 dark:bg-gray-800
                        appearance-none
                        cursor-pointer
                        disabled:cursor-not-allowed
                        text-sm
                        font-medium
                        ${!value && placeholder ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}
                        ${className}
                    `}
                >
                    {placeholder && (
                        <option value="" disabled className="text-gray-400">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option 
                            key={option.value} 
                            value={option.value}
                            className="py-2 px-3"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                    <ChevronDown 
                        size={20} 
                        className={`text-gray-400 dark:text-gray-500 transition-transform ${disabled ? 'opacity-50' : ''}`}
                    />
                </div>
            </div>
        </>
    )
}

export default CustomSelect

