'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { verifyEmail, generateCodeVerifyEmail } from '@/services/AuthService'
import { useRouter } from 'next/navigation'

const page = () => {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendCountdown, setResendCountdown] = useState(0)
    const [resendLoading, setResendLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
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
        } catch (err: any) {
            console.error('Error resending code:', err)
            setError('Không thể gửi lại mã. Vui lòng thử lại sau.')
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
        setError('')
        setLoading(true)

        const codeString = code.join('')
        if (codeString.length !== 6) {
            setError('Vui lòng nhập đầy đủ 6 ký tự')
            setLoading(false)
            return
        }

        try {
            const response = await verifyEmail({ code: codeString })
            console.log(response)
            setLoading(false)
        } catch (err: any) {
            console.log(err)
            setLoading(false)
        }
    }

    useEffect(() => {
      handleResendCode()
    }, [])

    return (
        <div className='w-full h-svh flex justify-center items-center p-6'>
            <div className='w-full h-full flex justify-center items-center flex-col flex-1 radial-gradient rounded-3xl p-6'>
                <div className='flex justify-center items-center flex-col mt-[30%]'>
                    <img src="/logo.png" alt="logo" className='w-24 h-24 object-contain' />
                    <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-base'>USDT ADS</span>
                    <h2 className='text-[2rem] font-bold text-center text-black-100 my-4'>Get Started With Us</h2>
                    <p className='text-lg text-center text-theme-black-100 font-medium'>USDT Ads giúp bạn kiếm tiền online chỉ với vài phút mỗi ngày.</p>
                    <p className='text-lg text-center text-theme-black-100 font-medium'>Tham gia staking và nhiệm vụ để tăng thu nhập của bạn lên gấp nhiều lần..</p>
                </div>
            </div>
            <div className='w-full h-full flex justify-center items-center flex-col flex-1 px-8 bg-theme-white-100'>
                <div className='w-full max-w-md flex flex-col items-center'>
                    <img src="/logo.png" alt="logo" className='w-20 h-20 object-contain mb-6' />
                    <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Verify Email</h2>
                    
                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6'>

                        <div className='space-y-1'>
                            <label htmlFor="code" className='block text-sm font-semibold text-gray-700'>
                                Code <span className='text-theme-red'>*</span>
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
                                        className='w-12 h-12 text-center text-xl font-semibold border border-solid focus:border-purple-500 border-theme-gray-100 rounded-lg outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className='flex justify-start items-center gap-2'>
                                {resendCountdown > 0 ? (
                                    <span className='text-xs text-gray-500 font-medium'>
                                        Gửi lại mã sau {resendCountdown}s
                                    </span>
                                ) : (
                                    <span 
                                        className={`text-xs font-medium ${
                                            resendLoading 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-theme-black-100 hover:text-purple-600 cursor-pointer'
                                        } transition-colors`}
                                        onClick={handleResendCode}
                                    >
                                        {resendLoading ? 'Đang gửi...' : 'Resend code'}
                                    </span>
                                )}
                            </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full outline-none border-none cursor-pointer py-3 px-4 mt-6 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base uppercase'
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xác thực...
                                </>
                            ) : (
                                'Xác thực'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page