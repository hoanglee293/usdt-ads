'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useSubmitKyc, useRetryKyc, useKycStatus } from '@/hooks/useKyc'
import { useLang } from '@/lang/useLang'
import toast from 'react-hot-toast'

// UI status type (mapped from API status)
type KycStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'retry'

// Map API status to UI status
const mapApiStatusToUiStatus = (apiStatus: "verify" | "retry" | "pending" | "not-verified" | null): KycStatus => {
    switch (apiStatus) {
        case 'verify':
            return 'approved'
        case 'retry':
            return 'retry'
        case 'pending':
            return 'pending'
        case 'not-verified':
            return 'none'
        default:
            return 'none'
    }
}

export default function KycPage() {
    const { t } = useLang()
    const { status: apiStatus, isLoading: isLoadingStatus, refetch: refetchKycStatus } = useKycStatus()
    const [kycStatus, setKycStatus] = useState<KycStatus>('none')
    const [idCardNumber, setIdCardNumber] = useState('')
    const [frontImage, setFrontImage] = useState<File | null>(null)
    const [backImage, setBackImage] = useState<File | null>(null)
    const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
    const [backImagePreview, setBackImagePreview] = useState<string | null>(null)

    const frontImageInputRef = useRef<HTMLInputElement>(null)
    const backImageInputRef = useRef<HTMLInputElement>(null)

    const { submitKyc, isLoading: isSubmitting } = useSubmitKyc()
    const { retryKyc, isLoading: isRetrying } = useRetryKyc()

    const isLoading = isSubmitting || isRetrying || isLoadingStatus

    // Update UI status when API status changes
    useEffect(() => {
        if (apiStatus !== null) {
            setKycStatus(mapApiStatusToUiStatus(apiStatus))
        }
    }, [apiStatus])

    // Handle front image upload
    const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(t('kyc.pleaseSelectImage'))
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('kyc.fileSizeExceeded'))
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
                toast.error(t('kyc.pleaseSelectImage'))
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('kyc.fileSizeExceeded'))
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
            toast.error(t('kyc.idCardNumberRequired'))
            return
        }

        if (!frontImage || !backImage) {
            toast.error(t('kyc.pleaseUploadBothImages'))
            return
        }

        try {
            if (kycStatus === 'retry' || kycStatus === 'rejected') {
                // Retry KYC
                await retryKyc({
                    id_card_number: idCardNumber.trim(),
                    images: [frontImage, backImage],
                })
                toast.success(t('kyc.retrySuccess'))
            } else {
                // Submit new KYC
                await submitKyc({
                    id_card_number: idCardNumber.trim(),
                    images: [frontImage, backImage],
                })
                toast.success(t('kyc.submitSuccess'))
            }

            // Refetch KYC status to update UI
            await refetchKycStatus()

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
                t('kyc.submitError')
            toast.error(errorMessage)
        }
    }

    // Render status badge
    const renderStatusBadge = () => {
        switch (kycStatus) {
            case 'pending':
                return (
                    <div className='flex items-center gap-1.5 sm:gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full'>
                        <Clock size={18} className='sm:w-5 sm:h-5' />
                        <span className='font-semibold text-sm sm:text-base'>{t('kyc.status.pending')}</span>
                    </div>
                )
            case 'approved':
                return (
                    <div className='flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full'>
                        <CheckCircle size={18} className='sm:w-5 sm:h-5' />
                        <span className='font-semibold text-sm sm:text-base'>{t('kyc.status.approved')}</span>
                    </div>
                )
            case 'rejected':
            case 'retry':
                return (
                    <div className='flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full'>
                        <XCircle size={18} className='sm:w-5 sm:h-5' />
                        <span className='font-semibold text-sm sm:text-base'>{t('kyc.status.rejected')}</span>
                    </div>
                )
            default:
                return null
        }
    }

    // If KYC is approved, show success message
    if (kycStatus === 'approved') {
        return (
            <div className='w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 pb-4'>
                    <div className='flex justify-center items-center bg-green-100 dark:bg-green-900/30 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20'>
                        <CheckCircle size={32} className='sm:w-10 sm:h-10 text-green-600 dark:text-green-400' />
                    </div>
                    <h1 className='text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200'>{t('kyc.approved.title')}</h1>
                    <img src='/kyc.png' alt='KYC Pending' className='w-full h-auto max-w-[280px] sm:max-w-[320px] md:max-w-96 mx-auto' />
                    <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>{t('kyc.approved.message')}</p>
                </div>
            </div>
        )
    }

    // If KYC is pending, show pending message
    if (kycStatus === 'pending') {
        return (
            <div className='w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 pb-4'>
                    <div className='flex justify-center items-center bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20'>
                        <Clock size={32} className='sm:w-10 sm:h-10 text-yellow-600 dark:text-yellow-400' />
                    </div>
                    <h1 className='text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200'>{t('kyc.pending.title')}</h1>
                    <img src='/kyc.png' alt='KYC Pending' className='w-full h-auto max-w-[280px] sm:max-w-[320px] md:max-w-96 mx-auto' />
                    <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>{t('kyc.pending.message')}</p>
                    {renderStatusBadge()}
                </div>
            </div>
        )
    }

    // Show loading state while fetching KYC status
    if (isLoadingStatus) {
        return (
            <div className='w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4'>
                    <div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 dark:border-purple-400'></div>
                    <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>{t('kyc.loadingKycInfo')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full'>
            <div className='text-center'>
                <p className='text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4'>{t('kyc.subtitle')}</p>
                {renderStatusBadge()}
            </div>

            <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
                {/* ID Card Number */}
                <div className='space-y-2'>
                    <label htmlFor='id_card_number' className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('kyc.idCardNumber')} <span className='text-red-500 dark:text-red-400'>{t('kyc.required')}</span>
                    </label>
                    <input
                        id='id_card_number'
                        type='text'
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder={t('kyc.idCardNumberPlaceholder')}
                        disabled={isLoading}
                        className='w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
                        required
                    />
                </div>

        <div className='flex flex-col sm:flex-row gap-4'>
                    {/* Front Image Upload */}
                    <div className='space-y-2 flex-1'>
                        <label className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
                            {t('kyc.frontImage')} <span className='text-red-500 dark:text-red-400'>{t('kyc.required')}</span>
                        </label>
                        {frontImagePreview ? (
                            <div className='relative'>
                                <img
                                    src={frontImagePreview}
                                    alt='Front ID Card'
                                    className='w-full h-40 sm:h-48 md:h-52 object-contain border border-theme-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800'
                                />
                                <button
                                    type='button'
                                    onClick={removeFrontImage}
                                    disabled={isLoading}
                                    className='absolute border-none outline-none top-[-15px] right-[-15px] sm:right-[-5px] bg-red-500 dark:bg-red-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-600 dark:hover:bg-red-700 transition-all disabled:opacity-50 w-7 h-7 flex items-center justify-center'
                                >
                                    <X size={14} className='sm:w-4 sm:h-4' />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => frontImageInputRef.current?.click()}
                                className='border-2 border-dashed min-h-40 sm:min-h-48 md:min-h-52 flex flex-col justify-center items-center border-theme-gray-100 dark:border-gray-700 rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-white dark:bg-gray-800'
                            >
                                <Upload size={24} className='sm:w-8 sm:h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2' />
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>{t('kyc.clickToUploadFront')}</p>
                                <p className='text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1'>{t('kyc.fileFormat')}</p>
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
                    <div className='space-y-2 flex-1'>
                        <label className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
                            {t('kyc.backImage')} <span className='text-red-500 dark:text-red-400'>{t('kyc.required')}</span>
                        </label>
                        {backImagePreview ? (
                            <div className='relative'>
                                <img
                                    src={backImagePreview}
                                    alt='Back ID Card'
                                    className='w-full h-40 sm:h-48 md:h-52 object-contain border border-theme-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800'
                                />
                                <button
                                    type='button'
                                    onClick={removeBackImage}
                                    disabled={isLoading}
                                    className='absolute top-[-15px] right-[-5px] border-none outline-none bg-red-500 dark:bg-red-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-600 dark:hover:bg-red-700 transition-all disabled:opacity-50 w-7 h-7 flex items-center justify-center'
                                >
                                    <X size={14} className='sm:w-4 sm:h-4' />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => backImageInputRef.current?.click()}
                                className='border-2 border-dashed min-h-40 sm:min-h-48 md:min-h-52 flex flex-col justify-center items-center border-theme-gray-100 dark:border-gray-700 rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-white dark:bg-gray-800'
                            >
                                <Upload size={24} className='sm:w-8 sm:h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2' />
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>{t('kyc.clickToUploadBack')}</p>
                                <p className='text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1'>{t('kyc.fileFormat')}</p>
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
                <div className='bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3'>
                    <AlertCircle className='text-blue-600 dark:text-blue-400 flex-shrink-0 self-start sm:mt-0.5' size={18} />
                    <div className='text-xs sm:text-sm text-blue-800 dark:text-blue-300'>
                        <ul className='list-disc list-inside space-y-1'>
                            <li>{t('kyc.info.item1')}</li>
                            <li>{t('kyc.info.item2')}</li>
                            <li>{t('kyc.info.item3')}</li>
                        </ul>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type='submit'
                    disabled={isLoading || !idCardNumber.trim() || !frontImage || !backImage}
                    className='w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 dark:from-fuchsia-500 dark:via-rose-400 dark:to-indigo-400 border-none outline-none text-white py-3 sm:py-3 px-6 rounded-full text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                    {isLoading ? (
                        <>
                            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                            <span>{t('kyc.processing')}</span>
                        </>
                    ) : kycStatus === 'retry' || kycStatus === 'rejected' ? (
                        t('kyc.retryKyc')
                    ) : (
                        t('kyc.submitKyc')
                    )}
                </button>
            </form>
        </div>
    )
}