'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loginPassword } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import AuthLayoutPanel from '@/components/AuthLayoutPanel'

const page = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
    const isMobile = useIsMobile()
    const { t } = useLang()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!username.trim() || !password.trim()) {
            toast.error(t('login.pleaseEnterAllInfo'))
            setLoading(false)
            return
        }

        try {
            const response = await loginPassword(username, password)
            if (response && response.statusCode === 200) {
                toast.success(t('login.loginSuccess'))
                login(response.user)
                router.push('/')
            }
        } catch (err: any) {
            // Handle API error response (statusCode: 400 | 401 | 403)
            const errorMessage = err?.message ||
                err?.response?.data?.message ||
                t('login.loginFailed')
            
            // Handle specific error messages
            if (errorMessage.includes('Invalid email or password')) {
                toast.error(t('login.invalidEmailOrPassword'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('User not found')) {
                toast.error(t('login.userNotFound'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Your account has been blocked') || errorMessage.includes('account has been blocked')) {
                toast.error(t('login.accountBlocked'))
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
                variant="login"
                description1={t('login.description1')}
                description2={t('login.description2')}
            />
            <div className={`w-full h-full flex gap-3 justify-end md:justify-center items-center flex-col flex-1 bg-transparent ${isMobile ? 'radial-gradient' : ''}`}>
                <div className='w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl px-8 flex flex-col items-center mt-[10vh] md:mt-0'>
                    <img src="/logo.png" alt="logo" className='w-24 h-24 object-contain' />
                    <h2 className='text-3xl font-semibold text-white md:text-gray-800 dark:md:text-white mb-2 mt-6'>{t('login.signIn')}</h2>
                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6 px-8 md:px-0'>
                        <div className='space-y-1'>
                            <label htmlFor="username" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('login.username')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('login.usernamePlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('login.password')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                            </label>
                            <div className='relative'>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('login.passwordPlaceholder')}
                                    className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                    disabled={loading}
                                />
                                {password.length > 0 && (
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='absolute bg-transparent right-3 top-[51%] transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer'
                                    >
                                        {showPassword ? <EyeOff size={16} className='text-gray-500 dark:text-gray-400' /> : <Eye size={16} className='text-gray-500 dark:text-gray-400' />}
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className='flex justify-between items-center'>
                            <div onClick={() => router.push('/forgot-password')} className='text-sm text-theme-black-100 dark:text-gray-300 hover:text-theme-black-100 dark:hover:text-gray-200 font-medium cursor-pointer'>{t('login.forgotPassword')}</div>
                            <div onClick={() => router.push('/register')} className='text-sm text-theme-red dark:text-theme-red-200 hover:text-theme-red-100 dark:hover:text-theme-red-200/80 font-medium cursor-pointer'>{t('login.register')}</div>
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
                                    {t('login.loggingIn')}
                                </>
                            ) : (
                                t('login.login')
                            )}
                        </button>
                    </form>
                </div>
                <img src="/636.png" alt="logo" className='w-full h-auto object-contain opacity-60 block md:hidden' />
            </div>
        </div>
    )
}

export default page