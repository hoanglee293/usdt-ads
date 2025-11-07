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
        <div className='relative'>
            <select
                id={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`
                    w-full px-4 py-3 pr-10 
                    border border-solid 
                    focus:border-gray-300 
                    border-theme-gray-100 
                    rounded-full 
                    outline-none 
                    transition-all 
                    bg-gray-50
                    appearance-none
                    cursor-pointer
                    disabled:cursor-not-allowed
                    ${!value && placeholder ? 'text-gray-400' : ''}
                    ${className}
                `}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform ${disabled ? 'opacity-50' : ''}`}
                />
            </div>
        </div>
    )
}

export default CustomSelect

