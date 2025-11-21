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
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
    id,
    value,
    onChange,
    disabled = false,
    className = '',
    placeholder
}) => {
    return (
        <div className='relative'>
            <input
                id={id}
                type="date"
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`
                    w-full px-4 py-3 pr-10
                    border border-solid 
                    focus:border-gray-300 
                    border-theme-gray-100 
                    rounded-full 
                    outline-none 
                    transition-all
                    bg-gray-50
                    disabled:cursor-not-allowed
                    ${className}
                `}
            />
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                <Calendar 
                    size={18} 
                    className={`text-gray-400 ${disabled ? 'opacity-50' : ''}`}
                />
            </div>
        </div>
    )
}

export default CustomDateInput

