'use client'
import React, { useState } from 'react'
import { resetPasswordRequest } from '@/services/AuthService'
import { useRouter } from 'next/navigation'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Handle email submission
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!email.trim()) {
            setError('Vui lòng nhập email')
            setLoading(false)
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            setError('Email không hợp lệ')
            setLoading(false)
            return
        }

        try {
            const response = await resetPasswordRequest(email.trim())
            if (response && response.statusCode === 200) {
                setSuccess('Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và click vào link để đặt lại mật khẩu.')
            }
        } catch (err: any) {
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                'Không thể gửi yêu cầu reset mật khẩu. Vui lòng thử lại sau.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

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
                    <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
                        Quên mật khẩu
                    </h2>
                    
                    {error && (
                        <div className='w-full mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className='w-full mt-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm'>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleEmailSubmit} className='w-full flex flex-col gap-4 mt-6'>
                        <div className='space-y-1'>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700'>
                                Email <span className='text-theme-red'>*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Nhập email của bạn'
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all'
                                disabled={loading}
                            />
                        </div>

                        <div className='flex justify-start items-center gap-2'>
                            <span 
                                className='text-sm text-theme-black-100 hover:text-purple-600 font-medium cursor-pointer'
                                onClick={() => router.push('/login')}
                            >
                                Quay lại đăng nhập
                            </span>
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
                                    Đang gửi...
                                </>
                            ) : (
                                'Gửi link reset'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
