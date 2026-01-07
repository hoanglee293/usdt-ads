'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loginPassword } from '@/services/AuthService'
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
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
        <div className='w-full md:h-svh h-screen flex justify-center items-center md:p-6 bg-theme-white-100 dark:bg-black'>
            <AuthLayoutPanel
                variant="login"
                description1={t('login.description1')}
                description2={t('login.description2')}
            />
            <div className={`px-6 w-full h-full flex gap-3 relative justify-center items-center flex-col flex-1 bg-transparent ${isMobile ? 'radial-gradient' : ''}`}>
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
                        className="pb-1.5 pt-[7px] px-2.5 sm:px-2.5 sm:pt-2.5 sm:pb-2 cursor-pointer rounded-full bg-gray-100 dark:bg-theme-gray-200/90 hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation shadow-lg backdrop-blur-md"
                        aria-label="Toggle dark mode"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" />
                        ) : (
                            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                        )}
                    </button>
                </div>
                <div className='w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl flex flex-col items-center mt-[10vh] md:mt-0 z-20 shadow-lg md:shadow-none dark:bg-[#aa5ffebd] sm:dark:bg-transparent bg-white/90 md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none'>
                    <img src="/logo.png" alt="logo" className='w-24 h-24 object-contain hidden md:block' />
                    <h2 className='text-3xl font-semibold dark:text-white text-gray-800 dark:md:text-white mb-2 mt-6'>{t('login.signIn')}</h2>
                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6 px-0'>
                        <div className='space-y-1'>
                            <label htmlFor="username" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                {t('login.username')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('login.usernamePlaceholder')}
                                className='w-full pr-4 py-4 pl-5 border-transparent border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600  dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                disabled={loading}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label htmlFor="password" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                {t('login.password')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                            </label>
                            <div className='relative'>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('login.passwordPlaceholder')}
                                    className='w-full pr-4 py-4 pl-5 border-transparent border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600  dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
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
                            <div onClick={() => router.push('/forgot-password')} className='text-sm text-theme-black-100 dark:text-white hover:text-theme-black-100 dark:hover:text-gray-200 font-semibold cursor-pointer'>{t('login.forgotPassword')}</div>
                            <div onClick={() => router.push('/register')} className='text-sm text-theme-red-200 hover:text-theme-red-100 dark:hover:text-theme-red-200/80 font-semibold cursor-pointer'>{t('login.register')}</div>
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
                <img src="/636.png" alt="logo" className='w-full h-[70%] top-[10vh] object-cover absolute opacity-60 block md:hidden z-10' />
            </div>
        </div>
    )
}

export default page