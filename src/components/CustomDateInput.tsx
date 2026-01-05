'use client'
import React from 'react'
import { Calendar } from 'lucide-react'

interface CustomDateInputProps {
    id: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    disabled?: boolean
    className?: string
    placeholder?: string
    disableFuture?: boolean
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
    id,
    value,
    onChange,
    disabled = false,
    className = '',
    placeholder,
    disableFuture = false
}) => {
    // Get today's date in YYYY-MM-DD format for max attribute
    const today = new Date().toISOString().split('T')[0]
    
    return (
        <div className='relative'>
            <input
                id={id}
                type="date"
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                max={disableFuture ? today : undefined}
                className={`
                    w-full px-4 py-3 pr-10
                    border border-solid 
                    focus:border-gray-300 dark:focus:border-gray-600
                    border-theme-gray-100 dark:border-gray-700
                    rounded-full 
                    outline-none 
                    transition-all
                    bg-gray-50 dark:bg-gray-800
                    text-gray-900 dark:text-gray-200
                    disabled:cursor-not-allowed
                    ${className}
                `}
            />
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                <Calendar 
                    size={18} 
                    className={`text-gray-400 dark:text-gray-500 ${disabled ? 'opacity-50' : ''}`}
                />
            </div>
        </div>
    )
}

export default CustomDateInput

