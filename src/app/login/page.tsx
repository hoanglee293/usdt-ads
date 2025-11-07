'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loginPassword } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const page = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!username.trim() || !password.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin')
            setLoading(false)
            return
        }

        try {
            const response = await loginPassword(username, password)
            if (response && response.statusCode === 200) {
                toast.success('Đăng nhập thành công!')
                login(response.user)
                router.push('/')
            }
        } catch (err: any) {
            // Handle API error response (statusCode: 400 | 401 | 403)
            const errorMessage = err?.message || 
                err?.response?.data?.message || 
                'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
            toast.error(errorMessage)
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
                    <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Sign in Account</h2>
                    
                    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4 mt-6'>
                        <div className='space-y-1'>
                            <label htmlFor="username" className='block text-sm font-semibold text-gray-700'>
                                Username <span className='text-theme-red'>*</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder='Nhập username của bạn'
                                className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all'
                                disabled={loading}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700'>
                                Password <span className='text-theme-red'>*</span>
                            </label>
                            <div className='relative'>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder='Nhập mật khẩu của bạn'
                                    className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all pr-12'
                                    disabled={loading}
                                />
                                {password.length > 0 && (
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='absolute !bg-white right-3 top-[51%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                                    >
                                        {showPassword ? <EyeOff size={16} className='text-gray-500' /> : <Eye size={16} className='text-gray-500' />}
                                    </div>
                                )}
                              
                            </div>
                        </div>

                        <div className='flex justify-between items-center'>
                            <div onClick={() => router.push('/forgot-password')} className='text-sm text-theme-black-100 hover:text-theme-black-100 font-medium cursor-pointer'>Forgot password?</div>
                            <div onClick={() => router.push('/register')} className='text-sm text-theme-red hover:text-theme-red-100 font-medium cursor-pointer'>Register</div>
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
                                    Đang đăng nhập...
                                </>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page