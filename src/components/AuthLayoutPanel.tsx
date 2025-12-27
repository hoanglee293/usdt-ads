'use client'
import { useRouter } from 'next/navigation'
import React from 'react'

interface AuthLayoutPanelProps {
    variant?: 'login' | 'register' | 'default'
    title?: string
    description1?: string
    description2?: string
    headingText?: string
    showLogo?: boolean
    showHeading?: boolean
    borderColor?: string
}

const AuthLayoutPanel: React.FC<AuthLayoutPanelProps> = ({
    variant = 'default',
    title,
    description1,
    description2,
    headingText,
    showLogo = false,
    showHeading = false,
    borderColor
}) => {
    const router = useRouter()
    // Determine border color based on variant if not provided
    const getBorderColor = () => {
        if (borderColor) return borderColor
        return '#5f90fe' // Use login border color for all variants
    }

    // Get title text
    const getTitle = () => {
        if (title) return title
        return 'USDT ADS'
    }

    // Get title styling - use login style for all variants
    const getTitleClassName = () => {
        return 'tracking-[-0.02em] leading-[150%] inline-block   dark:text-white text-black-100 font-bold text-3xl flex-shrink-0'
    }

    // Get content container class - use login style for all variants
    const getContentContainerClass = () => {
        return 'flex justify-center mb-[10vh] items-center flex-col gap-[1vh] w-full px-4 min-w-0 relative z-10 bg-white/70 dark:bg-black/70 py-6'
    }

    return (
        <div 
            className='w-full h-full hidden md:flex justify-end items-center flex-col flex-1 radial-gradient rounded-3xl py-6 border-none dark:border dark:border-solid border-transparent overflow-hidden relative'
            style={{ borderColor: getBorderColor() }}
        >
            <img 
                src="/636.png" 
                alt="background" 
                className='absolute inset-0 w-full h-full object-contain z-0' 
            />
            <div className={getContentContainerClass()}>
                
                <span className={getTitleClassName()}>
                    {getTitle()}
                </span>
                {showHeading && headingText && (
                    <h2 className='text-[2rem] font-bold text-center text-black-100 dark:text-white my-4'>
                        {headingText}
                    </h2>
                )}
                {description1 && (
                    <p className='xl:text-lg text-sm text-center text-theme-black-100 dark:text-gray-300 font-medium flex-shrink-0'>
                        {description1}
                    </p>
                )}
                {description2 && (
                    <p className='xl:text-lg text-sm text-center text-theme-black-100 dark:text-gray-300 font-medium flex-shrink-0'>
                        {description2}
                    </p>
                )}
            </div>
        </div>
    )
}

export default AuthLayoutPanel

