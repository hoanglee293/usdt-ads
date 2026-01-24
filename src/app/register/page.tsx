'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { registerPassword, RegisterData } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import { useTheme } from '@/theme/useTheme'
import { langConfig } from '@/lang/index'
import AuthLayoutPanel from '@/components/AuthLayoutPanel'

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
    const { t, lang, setLang } = useLang()
    const { theme, toggleTheme } = useTheme()
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)

    // Language flags mapping
    const langFlags: Record<string, string> = {
        'kr': '🇰🇷',
        'en': '🇺🇸',
        'vi': '🇻🇳',
        'ja': '🇯🇵',
        'zh': '🇨🇳',
    }

    // Load referral code from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRefCode = localStorage.getItem('refCode')
            if (savedRefCode) {
                setRefCode(savedRefCode)
            }
        }
    }, [])

    // Handle click outside to close language menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false)
            }
        }

        if (isLangMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isLangMenuOpen])

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
            if (response) {
                toast.success(t('register.registerSuccess'))
                router.push('/verify-mail')
            }
        } catch (err: any) {
            const errorMessage = err?.message ||
                err?.response?.data?.message ||
                t('register.registerFailed')

            // Handle specific error messages
            if (errorMessage.includes('Referral code is invalid') || errorMessage.includes('Invalid referral code')) {
                toast.error(t('register.referralCodeInvalid'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Referral code (ref_code) is required')) {
                toast.error(t('register.referralCodeRequired'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Invalid referral code. Referral code does not exist') || errorMessage.includes('Referral code does not exist')) {
                toast.error(t('register.referralCodeNotExist'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('User already exists with this information')) {
                toast.error(t('register.userAlreadyExists'))
                setLoading(false)
                return
            }
            if (errorMessage.includes('Data already exists')) {
                toast.error(t('register.dataAlreadyExists'))
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
            <div className={`w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-transparent relative ${isMobile ? 'radial-gradient pb-[10vh]' : ''}`}>
                <div className="absolute top-4 right-4 sm:top-6 sm:right-16 flex items-center gap-3 sm:gap-4 z-50">
                    {/* Language Switcher */}
                    <div className="relative" ref={langMenuRef}>
                        <button
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer rounded-full bg-gray-100 dark:bg-theme-gray-200/90 hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation shadow-lg backdrop-blur-md"
                            aria-label="Language"
                        >
                            <span className="text-base sm:text-lg dark:text-white text-black">{langFlags[lang] || '🌐'}</span>
                            <span className="text-xs sm:text-sm font-inter font-medium text-pink-500 dark:text-pink-400 uppercase">
                                {lang}
                            </span>
                        </button>
                        {isLangMenuOpen && (
                            <div className="absolute right-0 top-[100%] mt-2 w-48 sm:w-52 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 overflow-hidden z-50 animate-fade-in-down">
                                <div className="py-1">
                                    {langConfig.listLangs.map((langOption) => (
                                        <button
                                            key={langOption.code}
                                            onClick={() => {
                                                setLang(langOption.code)
                                                setIsLangMenuOpen(false)
                                            }}
                                            className={`w-full px-4 py-2.5 sm:py-3 cursor-pointer border-none text-sm sm:text-base font-inter font-medium text-left hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 transition-colors flex items-center gap-3 ${lang === langOption.code
                                                ? 'text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-theme-gray-100/30'
                                                : 'text-theme-black-100 dark:text-theme-gray-100 bg-white dark:bg-theme-gray-200'
                                                }`}
                                        >
                                            <span className="text-lg sm:text-xl">{langFlags[langOption.code] || '🌐'}</span>
                                            <span className="flex-1">{t(`languages.${langOption.code}`)}</span>
                                            {lang === langOption.code && (
                                                <span className="text-pink-500 dark:text-pink-400 text-xs">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="pb-1.5 pt-[7px] px-2 sm:px-2.5 sm:pt-2.5 sm:pb-2 cursor-pointer rounded-full bg-gray-100 dark:bg-theme-gray-200/90 hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation shadow-lg backdrop-blur-md"
                        aria-label="Toggle dark mode"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" />
                        ) : (
                            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                        )}
                    </button>
                </div>
                <div className='w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl flex flex-col items-center mt-[10vh] md:mt-0'>
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
                                    minLength={6}
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
                        <span className='text-xs text-yellow-500 italic'>{t('register.referralCodeNotice')}</span>
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
