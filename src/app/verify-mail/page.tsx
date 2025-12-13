'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { verifyEmail, generateCodeVerifyEmail } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'

const page = () => {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resendCountdown, setResendCountdown] = useState(0)
    const [resendLoading, setResendLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
    const isMobile = useIsMobile()
    const { t } = useLang()
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, value: string) => {
        // Chỉ chấp nhận 1 ký tự (chữ hoặc số, không phân biệt hoa thường)
        const sanitizedValue = value.slice(-1).toUpperCase()
        
        if (/^[A-Z0-9]$/.test(sanitizedValue) || sanitizedValue === '') {
            const newCode = [...code]
            newCode[index] = sanitizedValue
            setCode(newCode)

            // Tự động chuyển sang ô tiếp theo nếu có giá trị
            if (sanitizedValue && index < 5) {
                inputRefs.current[index + 1]?.focus()
            }
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6).toUpperCase()
        const newCode = [...code]
        
        for (let i = 0; i < 6; i++) {
            if (pastedData[i] && /^[A-Z0-9]$/.test(pastedData[i])) {
                newCode[i] = pastedData[i]
            } else if (i < pastedData.length) {
                newCode[i] = ''
            }
        }
        
        setCode(newCode)
        const lastFilledIndex = Math.min(pastedData.length - 1, 5)
        inputRefs.current[lastFilledIndex]?.focus()
    }

    const handleResendCode = async () => {
        if (resendCountdown > 0 || resendLoading) return

        setResendLoading(true)
        try {
            await generateCodeVerifyEmail()
            setResendCountdown(60)
            toast.success(t('verifyMail.resendCodeSuccess'))
        } catch (err: any) {
            console.error('Error resending code:', err)
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                t('verifyMail.resendCodeError')
            
            // Handle specific error messages
            if (errorMessage.includes('Email is already activated')) {
                toast.error(t('verifyMail.generateCodeEmailAlreadyActivated'))
                setResendLoading(false)
                return
            }
            if (errorMessage.includes('JWT token missing/invalid') || 
                errorMessage.includes('JWT token') ||
                errorMessage.includes('token missing') ||
                errorMessage.includes('token invalid')) {
                toast.error(t('verifyMail.generateCodeJwtTokenMissingOrInvalid'))
                setResendLoading(false)
                return
            }
            
            // Default error message
            toast.error(errorMessage)
        } finally {
            setResendLoading(false)
        }
    }

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => {
                setResendCountdown(resendCountdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCountdown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const codeString = code.join('')
        if (codeString.length !== 6) {
            toast.error(t('verifyMail.pleaseEnterFullCode'))
            setLoading(false)
            return
        }

        try {
            const response = await verifyEmail({ code: codeString })
            console.log(response)
            toast.success(t('verifyMail.verifySuccess'))
            setLoading(false)
            setTimeout(() => {
                router.push('/login')
            }, 1000)
        } catch (err: any) {
            console.log(err)
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                t('verifyMail.invalidCode')
            
            // Handle specific error messages
            if(errorMessage.includes('Email is already activated')) {
                toast.error(t('verifyMail.emailAlreadyActivated'))
                setLoading(false)
                return
            }
            if(errorMessage.includes('Invalid code, expired code, email already activated') || 
               errorMessage.includes('Invalid code') || 
               errorMessage.includes('expired code') ||
               errorMessage.includes('email already activated')) {
                toast.error(t('verifyMail.invalidOrExpiredCode'))
                setLoading(false)
                return
            }
            if(errorMessage.includes('JWT token missing/invalid') || 
               errorMessage.includes('JWT token') ||
               errorMessage.includes('token missing') ||
               errorMessage.includes('token invalid')) {
                toast.error(t('verifyMail.jwtTokenMissingOrInvalid'))
                setLoading(false)
                return
            }
            if(errorMessage.includes('Email not activated, account blocked') ||
               errorMessage.includes('Email not activated') ||
               errorMessage.includes('account blocked')) {
                toast.error(t('verifyMail.emailNotActivatedOrAccountBlocked'))
                setLoading(false)
                return
            }
            
            // Default error message
            toast.error(errorMessage)
            setLoading(false)
        }
    }

    useEffect(() => {
      handleResendCode()
    }, [])

    return (
        <div className='w-full h-svh flex justify-center items-center md:p-6 bg-theme-white-100 dark:bg-black'>
            <div className='w-full h-full hidden md:flex justify-center items-center flex-col flex-1 radial-gradient rounded-3xl p-6 border-none dark:border dark:border-solid border-transparent dark:border-[#fe645f]'>
                <div className='flex justify-center items-center flex-col mt-[30%] gap-[1vh]'>
                    <img src="/logo.png" alt="logo" className='w-24 h-24 object-contain' />
                    <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-base'>USDT ADS</span>
                    <h2 className='text-[2rem] font-bold text-center text-black-100 dark:text-white my-4'>{t('verifyMail.getStarted')}</h2>
                    <p className='text-lg text-center text-theme-black-100 dark:text-gray-300 font-medium'>{t('verifyMail.description1')}</p>
                    <p className='text-lg text-center text-theme-black-100 dark:text-gray-300 font-medium'>{t('verifyMail.description2')}</p>
                </div>
            </div>
            <div className={`w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-transparent ${isMobile ? 'radial-gradient pb-[20vh]' : ''}`}>
                <div className='w-full max-w-md flex flex-col items-center'>
                    <img src="/logo.png" alt="logo" className='w-20 h-20 object-contain mb-6' />
                    <h2 className='text-2xl font-semibold text-white md:text-gray-800 dark:md:text-white mb-2'>{t('verifyMail.title')}</h2>
                    
                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6'>

                        <div className='space-y-1'>
                            <label htmlFor="code" className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                                {t('verifyMail.code')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                            </label>
                            <div className='flex gap-2 justify-center'>
                                {code.map((char, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="text"
                                        maxLength={1}
                                        value={char}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className='w-12 h-12 text-center text-xl font-semibold border border-solid focus:border-purple-500 dark:focus:border-purple-400 border-theme-gray-100 dark:border-gray-700 rounded-lg outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className='flex justify-start items-center gap-2'>
                                {resendCountdown > 0 ? (
                                    <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                                        {t('verifyMail.resendAfter', { seconds: resendCountdown })}
                                    </span>
                                ) : (
                                    <span 
                                        className={`text-xs font-medium ${
                                            resendLoading 
                                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                                                : 'text-theme-black-100 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer'
                                        } transition-colors`}
                                        onClick={handleResendCode}
                                    >
                                        {resendLoading ? t('verifyMail.sending') : t('verifyMail.resendCode')}
                                    </span>
                                )}
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
                                    {t('verifyMail.verifying')}
                                </>
                            ) : (
                                t('verifyMail.verify')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page