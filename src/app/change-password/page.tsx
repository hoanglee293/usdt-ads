'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { setNewPassword } from '@/services/AuthService'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const ChangePasswordContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setError('Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại.')
        }
    }, [token])

    // Handle password submission
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!token) {
            setError('Token không hợp lệ. Vui lòng yêu cầu reset mật khẩu lại.')
            return
        }

        setError('')
        setSuccess('')
        setLoading(true)

        // Validation
        if (!password.trim()) {
            setError('Vui lòng nhập mật khẩu mới')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            setLoading(false)
            return
        }

        try {
            // Sử dụng token như code trong API
            const response = await setNewPassword(token, password)
            if (response && response.statusCode === 200) {
                setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...')
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err: any) {
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                'Không thể đặt lại mật khẩu. Token có thể đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại.'
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
                        Đặt lại mật khẩu
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

                    {!token ? (
                        <div className='w-full mt-6'>
                            <div className='w-full p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm mb-4'>
                                Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại.
                            </div>
                            <button
                                onClick={() => router.push('/forgot-password')}
                                className='w-full outline-none border-none cursor-pointer py-3 px-4 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all'
                            >
                                Quay lại quên mật khẩu
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className='w-full flex flex-col gap-4 mt-6'>
                            <div className='space-y-1'>
                                <label htmlFor="password" className='block text-sm font-semibold text-gray-700'>
                                    Mật khẩu mới <span className='text-theme-red'>*</span>
                                </label>
                                <div className='relative'>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder='Nhập mật khẩu mới (ít nhất 6 ký tự)'
                                        className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all pr-12'
                                        disabled={loading}
                                    />
                                    {password.length > 0 && (
                                        <div
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute !bg-white right-3 top-[51%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer'
                                        >
                                            {showPassword ? <EyeOff size={16} className='text-gray-500' /> : <Eye size={16} className='text-gray-500' />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className='space-y-1'>
                                <label htmlFor="confirmPassword" className='block text-sm font-semibold text-gray-700'>
                                    Xác nhận mật khẩu <span className='text-theme-red'>*</span>
                                </label>
                                <div className='relative'>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder='Nhập lại mật khẩu mới'
                                        className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all pr-12'
                                        disabled={loading}
                                    />
                                    {confirmPassword.length > 0 && (
                                        <div
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className='absolute !bg-white right-3 top-[51%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer'
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} className='text-gray-500' /> : <Eye size={16} className='text-gray-500' />}
                                        </div>
                                    )}
                                </div>
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
                                        Đang đặt lại mật khẩu...
                                    </>
                                ) : (
                                    'Đặt lại mật khẩu'
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
    return (
        <Suspense fallback={
            <div className='w-full h-svh flex justify-center items-center'>
                <div className='text-center'>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className='mt-4 text-gray-600'>Đang tải...</p>
                </div>
            </div>
        }>
            <ChangePasswordContent />
        </Suspense>
    )
}

export default ChangePasswordPage