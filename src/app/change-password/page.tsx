'use client'
import React, { useState, useEffect, Suspense, useRef } from 'react'
import { setNewPassword } from '@/services/AuthService'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import AuthLayoutPanel from '@/components/AuthLayoutPanel'

const ChangePasswordContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const isMobile = useIsMobile()
    const { t } = useLang()
    const hasShownTokenError = useRef(false)

    // Check if token exists
    useEffect(() => {
        if (!token && !hasShownTokenError.current) {
            hasShownTokenError.current = true
            toast.error(t('changePassword.invalidTokenError'))
        }
    }, [token, t])

    // Handle password submission
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!token) {
            toast.error(t('changePassword.invalidToken'))
            return
        }

        setLoading(true)

        // Validation
        if (!password.trim()) {
            toast.error(t('changePassword.pleaseEnterNewPassword'))
            setLoading(false)
            return
        }

        if (password.length < 6) {
            toast.error(t('changePassword.passwordMinLength'))
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            toast.error(t('changePassword.passwordMismatch'))
            setLoading(false)
            return
        }

        try {
            // Sử dụng token như code trong API
            const response = await setNewPassword(token, password)
            if (response && response.statusCode === 200) {
                toast.success(t('changePassword.resetPasswordSuccess'))
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err: any) {
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                t('auth.resetPasswordTokenError')
            
            // Handle specific error messages
            if (errorMessage.includes('Code is required')) {
                toast.error(t('changePassword.codeRequired'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Password is required')) {
                toast.error(t('changePassword.passwordRequired'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Password must be at least 6 characters long')) {
                toast.error(t('changePassword.passwordMinLength'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Reset password code has expired') || errorMessage.includes('code has expired')) {
                toast.error(t('changePassword.codeExpired'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Invalid code') && (errorMessage.includes('not found') || errorMessage.includes('does not belong') || errorMessage.includes('not a reset-password code') || errorMessage.includes('already been used'))) {
                toast.error(t('changePassword.invalidCode'))
                setLoading(false)
                return
            }
            
            // Default error message
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full h-svh flex justify-center items-center md:p-6 bg-theme-white-100 dark:bg-black'>
             <AuthLayoutPanel
                variant="register"
                showLogo={true}
                description1={t('register.description1')}
                description2={t('register.description2')}
            />
            <div className={`w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-transparent ${isMobile ? 'radial-gradient pb-[20vh]' : ''}`}>
                <div className='w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl flex flex-col items-center mt-[10vh] md:mt-0'>
                    <img src="/logo.png" alt="logo" className='w-28 h-28 object-contain mb-6' />
                    <h2 className='text-3xl font-semibold text-white md:text-gray-800 dark:md:text-white mb-2'>
                        {t('changePassword.title')}
                    </h2>

                    {!token ? (
                        <div className='w-full mt-6'>
                            <div className='w-full p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm mb-4'>
                                {t('changePassword.invalidTokenError')}
                            </div>
                            <button
                                onClick={() => router.push('/forgot-password')}
                                className='w-full outline-none border-none cursor-pointer py-3 px-4 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all'
                            >
                                {t('changePassword.backToForgotPassword')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className='w-full flex flex-col gap-4 mt-6'>
                            <div className='space-y-1'>
                                <label htmlFor="password" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                    {t('changePassword.newPassword')} <span className='text-theme-red dark:text-theme-red-200'>{t('changePassword.required')}</span>
                                </label>
                                <div className='relative'>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        minLength={6}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('changePassword.newPasswordPlaceholder')}
                                        className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={loading}
                                    />
                                    {password.length > 0 && (
                                        <div
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute !bg-white dark:!bg-gray-800 right-3 top-[51%] transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer'
                                        >
                                            {showPassword ? <EyeOff size={16} className='text-gray-500 dark:text-gray-400' /> : <Eye size={16} className='text-gray-500 dark:text-gray-400' />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className='space-y-1'>
                                <label htmlFor="confirmPassword" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                    {t('changePassword.confirmPassword')} <span className='text-theme-red dark:text-theme-red-200'>{t('changePassword.required')}</span>
                                </label>
                                <div className='relative'>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        minLength={6}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t('changePassword.confirmPasswordPlaceholder')}
                                        className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={loading}
                                    />
                                    {confirmPassword.length > 0 && (
                                        <div
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className='absolute !bg-white dark:!bg-gray-800 right-3 top-[51%] transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer'
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} className='text-gray-500 dark:text-gray-400' /> : <Eye size={16} className='text-gray-500 dark:text-gray-400' />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className='flex justify-start items-center gap-2'>
                                <span 
                                    className='text-sm text-theme-red-200 hover:text-purple-600 dark:hover:text-purple-400 font-medium cursor-pointer'
                                    onClick={() => router.push('/login')}
                                >
                                    {t('changePassword.backToLogin')}
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
                                        {t('changePassword.resetting')}
                                    </>
                                ) : (
                                    t('changePassword.resetPassword')
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

const ChangePasswordPage = () => {
    const { t } = useLang()
    return (
        <Suspense fallback={
            <div className='w-full h-svh flex justify-center items-center'>
                <div className='text-center'>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className='mt-4 text-gray-600'>{t('common.loading')}</p>
                </div>
            </div>
        }>
            <ChangePasswordContent />
        </Suspense>
    )
}

export default ChangePasswordPage