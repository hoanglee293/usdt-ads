'use client'
import React, { useState, useRef } from 'react'
import { User2, Upload, X, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useSubmitKyc, useRetryKyc } from '@/hooks/useKyc'
import toast from 'react-hot-toast'

// Mock KYC status - In production, this should come from API
// For now, we'll assume user can submit KYC
type KycStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'retry'

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<KycStatus>('none') // In production, fetch from API
    const [idCardNumber, setIdCardNumber] = useState('')
    const [frontImage, setFrontImage] = useState<File | null>(null)
    const [backImage, setBackImage] = useState<File | null>(null)
    const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
    const [backImagePreview, setBackImagePreview] = useState<string | null>(null)

    const frontImageInputRef = useRef<HTMLInputElement>(null)
    const backImageInputRef = useRef<HTMLInputElement>(null)

    const { submitKyc, isLoading: isSubmitting } = useSubmitKyc()
    const { retryKyc, isLoading: isRetrying } = useRetryKyc()

    const isLoading = isSubmitting || isRetrying

    // Handle front image upload
    const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh')
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB')
                return
            }
            setFrontImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setFrontImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Handle back image upload
    const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh')
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB')
                return
            }
            setBackImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setBackImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Remove front image
    const removeFrontImage = () => {
        setFrontImage(null)
        setFrontImagePreview(null)
        if (frontImageInputRef.current) {
            frontImageInputRef.current.value = ''
        }
    }

    // Remove back image
    const removeBackImage = () => {
        setBackImage(null)
        setBackImagePreview(null)
        if (backImageInputRef.current) {
            backImageInputRef.current.value = ''
        }
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!idCardNumber.trim()) {
            toast.error('Vui lòng nhập số CMND/CCCD')
            return
        }

        if (!frontImage || !backImage) {
            toast.error('Vui lòng upload đầy đủ ảnh mặt trước và mặt sau')
            return
        }

        try {
            if (kycStatus === 'retry' || kycStatus === 'rejected') {
                // Retry KYC
                await retryKyc({
                    id_card_number: idCardNumber.trim(),
                    images: [frontImage, backImage],
                })
                toast.success('Gửi lại yêu cầu KYC thành công!')
                setKycStatus('pending')
            } else {
                // Submit new KYC
                await submitKyc({
                    id_card_number: idCardNumber.trim(),
                    images: [frontImage, backImage],
                })
                toast.success('Gửi yêu cầu KYC thành công!')
                setKycStatus('pending')
            }

            // Reset form
            setIdCardNumber('')
            setFrontImage(null)
            setBackImage(null)
            setFrontImagePreview(null)
            setBackImagePreview(null)
            if (frontImageInputRef.current) frontImageInputRef.current.value = ''
            if (backImageInputRef.current) backImageInputRef.current.value = ''
        } catch (error: any) {
            const errorMessage =
                error?.message ||
                error?.response?.data?.message ||
                'Không thể gửi yêu cầu KYC. Vui lòng thử lại.'
            toast.error(errorMessage)
        }
    }

    // Render status badge
    const renderStatusBadge = () => {
        switch (kycStatus) {
            case 'pending':
                return (
                    <div className='flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full'>
                        <Clock size={20} />
                        <span className='font-semibold'>Đang chờ duyệt</span>
                    </div>
                )
            case 'approved':
                return (
                    <div className='flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full'>
                        <CheckCircle size={20} />
                        <span className='font-semibold'>Đã được duyệt</span>
                    </div>
                )
            case 'rejected':
            case 'retry':
                return (
                    <div className='flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full'>
                        <XCircle size={20} />
                        <span className='font-semibold'>Bị từ chối - Vui lòng gửi lại</span>
                    </div>
                )
            default:
                return null
        }
    }

    // If KYC is approved, show success message
    if (kycStatus === 'approved') {
        return (
            <div className='w-full max-w-2xl mx-auto p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-4'>
                    <div className='flex justify-center items-center bg-green-100 rounded-full p-4 w-20 h-20'>
                        <CheckCircle size={40} className='text-green-600' />
                    </div>
                    <h1 className='text-2xl font-semibold text-gray-800'>KYC Đã Được Xác Thực</h1>
                    <p className='text-gray-600'>Tài khoản của bạn đã được xác thực thành công.</p>
                </div>
            </div>
        )
    }

    // If KYC is pending, show pending message
    if (kycStatus === 'pending') {
        return (
            <div className='w-full max-w-2xl mx-auto p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-4'>
                    <div className='flex justify-center items-center bg-yellow-100 rounded-full p-4 w-20 h-20'>
                        <Clock size={40} className='text-yellow-600' />
                    </div>
                    <h1 className='text-2xl font-semibold text-gray-800'>Đang Chờ Duyệt KYC</h1>
                    <p className='text-gray-600'>Yêu cầu KYC của bạn đang được xử lý. Vui lòng chờ phản hồi từ hệ thống.</p>
                    {renderStatusBadge()}
                </div>
            </div>
        )
    }

    return (
        <div className='w-full'>
            <div className='text-center'>
                <p className='text-gray-600 mb-4'>Vui lòng cung cấp thông tin CMND/CCCD để xác thực danh tính</p>
                {renderStatusBadge()}
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
                {/* ID Card Number */}
                <div className='space-y-2'>
                    <label htmlFor='id_card_number' className='block text-sm font-semibold text-gray-700'>
                        Số CMND/CCCD <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='id_card_number'
                        type='text'
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder='Nhập số CMND/CCCD'
                        disabled={isLoading}
                        className='w-full px-4 py-3 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        required
                    />
                </div>

        <div className='flex gap-4'>
                    {/* Front Image Upload */}
                    <div className='space-y-2'>
                        <label className='block text-sm font-semibold text-gray-700'>
                            Ảnh mặt trước CMND/CCCD <span className='text-red-500'>*</span>
                        </label>
                        {frontImagePreview ? (
                            <div className='relative'>
                                <img
                                    src={frontImagePreview}
                                    alt='Front ID Card'
                                    className='w-full h-52 object-contain border border-theme-gray-100 rounded-lg'
                                />
                                <button
                                    type='button'
                                    onClick={removeFrontImage}
                                    disabled={isLoading}
                                    className='absolute border-none outline-none top-[-5px] right-[-5px] bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all disabled:opacity-50 w-7 h-7 flex items-center justify-center'
                                >
                                    <X size={16} className='w-4 h-4' />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => frontImageInputRef.current?.click()}
                                className='border-2 border-dashed min-h-52  flex flex-col justify-center items-center  border-theme-gray-100 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-all'
                            >
                                <Upload size={32} className='mx-auto text-gray-400 mb-2' />
                                <p className='text-gray-600'>Click để upload ảnh mặt trước</p>
                                <p className='text-sm text-gray-400 mt-1'>JPG, PNG (tối đa 5MB)</p>
                            </div>
                        )}
                        <input
                            ref={frontImageInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleFrontImageChange}
                            disabled={isLoading}
                            className='hidden'
                        />
                    </div>

                    {/* Back Image Upload */}
                    <div className='space-y-2'>
                        <label className='block text-sm font-semibold text-gray-700'>
                            Ảnh mặt sau CMND/CCCD <span className='text-red-500'>*</span>
                        </label>
                        {backImagePreview ? (
                            <div className='relative'>
                                <img
                                    src={backImagePreview}
                                    alt='Back ID Card'
                                    className='w-full h-52 object-contain border border-theme-gray-100 rounded-lg'
                                />
                                <button
                                    type='button'
                                    onClick={removeBackImage}
                                    disabled={isLoading}
                                    className='absolute top-[-5px] right-[-5px] border-none outline-none bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all disabled:opacity-50 w-7 h-7 flex items-center justify-center'
                                >
                                    <X size={16} className='w-4 h-4' />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => backImageInputRef.current?.click()}
                                className='border-2 border-dashed min-h-52 flex flex-col justify-center items-center border-theme-gray-100 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-all'
                            >
                                <Upload size={32} className='mx-auto text-gray-400 mb-2' />
                                <p className='text-gray-600'>Click để upload ảnh mặt sau</p>
                                <p className='text-sm text-gray-400 mt-1'>JPG, PNG (tối đa 5MB)</p>
                            </div>
                        )}
                        <input
                            ref={backImageInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleBackImageChange}
                            disabled={isLoading}
                            className='hidden'
                        />
                    </div>
                </div>

                {/* Info Alert */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
                    <AlertCircle className='text-blue-600 flex-shrink-0 mt-0.5' size={20} />
                    <div className='text-sm text-blue-800'>
                        <ul className='list-disc list-inside space-y-1'>
                            <li>Ảnh phải rõ ràng, đầy đủ thông tin</li>
                            <li>Đảm bảo ảnh không bị mờ, không bị che khuất</li>
                            <li>Kích thước file không quá 5MB</li>
                        </ul>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type='submit'
                    disabled={isLoading || !idCardNumber.trim() || !frontImage || !backImage}
                    className='w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 border-none outline-none text-white py-3 px-6 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                    {isLoading ? (
                        <>
                            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                            <span>Đang xử lý...</span>
                        </>
                    ) : kycStatus === 'retry' || kycStatus === 'rejected' ? (
                        'Gửi Lại Yêu Cầu KYC'
                    ) : (
                        'Gửi Yêu Cầu KYC'
                    )}
                </button>
            </form>
        </div>
    )
}