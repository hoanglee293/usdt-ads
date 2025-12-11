'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { registerPassword, RegisterData } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'

const page = () => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [refCode, setRefCode] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
    const isMobile = useIsMobile()
    const { t } = useLang()

    // Load referral code from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRefCode = localStorage.getItem('refCode')
            if (savedRefCode) {
                setRefCode(savedRefCode)
            }
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation các trường bắt buộc
        if (!username.trim() || !email.trim() || !password.trim() || !fullName.trim() || !refCode.trim()) {
            toast.error(t('register.pleaseEnterAllRequiredInfo'))
            setLoading(false)
            return
        }

        // if (password !== confirmPassword) {
        //     toast.error('Mật khẩu xác nhận không khớp')
        //     setLoading(false)
        //     return
        // }

        if (password.length < 6) {
            toast.error(t('register.passwordMinLength'))
            setLoading(false)
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error(t('register.invalidEmail'))
            setLoading(false)
            return
        }

        try {
            const registerData: RegisterData = {
                uname: username.trim(),
                email: email.trim(),
                password,
                display_name: fullName.trim(),
                ref_code: refCode.trim(),
            }

            const response = await registerPassword(registerData)
            console.log("response", response)
            if (response) {
                toast.success(t('register.registerSuccess'))
                router.push('/verify-mail')
            }
        } catch (err: any) {
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                t('register.registerFailed')
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full h-svh flex justify-center items-center md:p-6 bg-theme-white-100 dark:bg-black'>
            <div className='w-full h-full hidden md:flex justify-center items-center flex-col flex-1 radial-gradient rounded-3xl p-6 border-none dark:border dark:border-solid border-transparent dark:border-[#fe645f]'>
                <div className='flex justify-center items-center flex-col mt-[30%] gap-[1vh]'>
                    <img src="/logo.png" alt="logo" className='w-24 h-24 object-contain' />
                    <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-base'>USDT ADS</span>
                    <h2 className='text-[2rem] font-bold text-center text-black-100 dark:text-white my-4'>{t('register.getStarted')}</h2>
                    <p className='text-lg text-center text-theme-black-100 dark:text-gray-300 font-medium'>{t('register.description1')}</p>
                    <p className='text-lg text-center text-theme-black-100 dark:text-gray-300 font-medium'>{t('register.description2')}</p>
                </div>
            </div>
            <div className={`w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-transparent ${isMobile ? 'radial-gradient pb-[20vh]' : ''}`}>
                <div className='w-full max-w-md flex flex-col items-center'>
                    <img src="/logo.png" alt="logo" className='w-20 h-20 object-contain mb-6' />
                    <h2 className='text-3xl font-semibold text-white md:text-gray-800 dark:md:text-white mb-2'>{t('register.createAccount')}</h2>

                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6'>
                        <div className='space-y-1'>
                            <label htmlFor="username" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('register.username')} <span className='text-theme-red dark:text-theme-red-200'>{t('register.required')}</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('register.usernamePlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>
                        <div className='space-y-1'>
                            <label htmlFor="fullName" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('register.fullName')} <span className='text-theme-red dark:text-theme-red-200'>{t('register.required')}</span>
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder={t('register.fullNamePlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('register.email')} <span className='text-theme-red dark:text-theme-red-200'>{t('register.required')}</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('register.emailPlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('register.password')} <span className='text-theme-red dark:text-theme-red-200'>{t('register.required')}</span>
                            </label>
                            <div className='relative'>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('register.passwordPlaceholder')}
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
                            <label htmlFor="refCode" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('register.referralCode')} <span className='text-theme-red dark:text-theme-red-200'>{t('register.required')}</span>
                            </label>
                            <input
                                id="refCode"
                                type="text"
                                value={refCode}
                                onChange={(e) => setRefCode(e.target.value)}
                                placeholder={t('register.referralCodePlaceholder')}
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>
                        <div className='flex justify-center items-center'>
                            <div className='text-sm text-theme-black-100 dark:text-gray-300 hover:text-theme-black-100 dark:hover:text-gray-200 font-medium'>
                                {t('register.alreadyHaveAccount')} <span className='text-theme-red dark:text-theme-red-200 hover:text-theme-red-100 dark:hover:text-theme-red-200/80 font-medium cursor-pointer' onClick={() => router.push('/login')}>{t('register.signIn')}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full outline-none border-none cursor-pointer py-3 px-4 mt-4 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base uppercase'
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('register.registering')}
                                </>
                            ) : (
                                t('register.register')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page
