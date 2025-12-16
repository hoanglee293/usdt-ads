'use client'
import React, { useState } from 'react'
import { resetPasswordRequest } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import AuthLayoutPanel from '@/components/AuthLayoutPanel'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const isMobile = useIsMobile()
    const { t } = useLang()

    // Handle email submission
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!email.trim()) {
            toast.error(t('forgotPassword.pleaseEnterEmail'))
            setLoading(false)
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            toast.error(t('forgotPassword.invalidEmail'))
            setLoading(false)
            return
        }

        try {
            const response = await resetPasswordRequest(email.trim())
            if (response && response.statusCode === 200) {
                toast.success(t('forgotPassword.resetPasswordSuccess'))
            }
        } catch (err: any) {
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                t('auth.resetPasswordError')
            if(errorMessage.includes('Email is required')) {
                toast.error(t('forgotPassword.emailRequired'))
                setLoading(false)
                return
            }
            if(errorMessage.includes('Invalid email')) {
                toast.error(t('forgotPassword.invalidEmail'))
                setLoading(false)
                return
            }
            if(errorMessage.includes('A password reset token already exists and is still valid. Please check your email or wait until the token expires.')) {
                toast.error(t('forgotPassword.tokenAlreadyExists'))
                setLoading(false)
                return
            }
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full h-svh flex justify-center items-center md:p-6 bg-theme-white-100 dark:bg-black'>
            <AuthLayoutPanel
                variant="default"
                showLogo={true}
                showHeading={true}
                headingText={t('forgotPassword.getStarted')}
                description1={t('forgotPassword.description1')}
                description2={t('forgotPassword.description2')}
            />
            <div className={`w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-transparent ${isMobile ? 'radial-gradient pb-[20vh]' : ''}`}>
                <div className='w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl px-8 flex flex-col items-center mt-[10vh] md:mt-0'>
                    <img src="/logo.png" alt="logo" className='w-28 h-28 object-contain mb-6' />
                    <h2 className='text-3xl font-semibold text-white md:text-gray-800 dark:md:text-white mb-2'>
                        {t('forgotPassword.title')}
                    </h2>

                    <form onSubmit={handleEmailSubmit} className='w-full flex flex-col gap-4 mt-6'>
                        <div className='space-y-1'>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('forgotPassword.email')} <span className='text-theme-red dark:text-theme-red-200'>{t('forgotPassword.required')}</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('forgotPassword.emailPlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>

                        <div className='flex justify-start items-center gap-2'>
                            <span 
                                className='text-sm text-theme-black-100 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium cursor-pointer'
                                onClick={() => router.push('/login')}
                            >
                                {t('forgotPassword.backToLogin')}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full outline-none border-none cursor-pointer py-3 px-4 mt-6 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base uppercase'
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('forgotPassword.sending')}
                                </>
                            ) : (
                                t('forgotPassword.sendResetLink')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
