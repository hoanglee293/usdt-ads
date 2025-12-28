'use client'
import React, { useMemo, useState } from 'react'
import { Copy, Play, Link2 } from 'lucide-react'
import { Button } from '@/ui/button'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMemberRefInfo, createMemberRefWithdraw } from '@/services/RefService'
import { registerKol, checkKolStatus, KolRegisterRequest } from '@/services/AuthService'
import { useProfile } from '@/hooks/useProfile'
import { useLang } from '@/lang/useLang'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'

interface MilestoneItem {
    milestone: number
    reward: number
    is_claimed: boolean
    reward_id: string | null
}

interface MilestoneDefinition {
    count: number
    reward: number
    is_claimed: boolean
    reward_id: string | null
    achieved?: boolean
    showLink?: boolean
}

export default function SmartRefPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { profile, loading: profileLoading } = useProfile()
    const { t } = useLang()
    const [showKolModal, setShowKolModal] = useState(false)

    // KOL Registration Form State
    const [kolFormData, setKolFormData] = useState<KolRegisterRequest>({
        name: '',
        facebook_url: '',
        x_url: '',
        group_telegram_url: '',
        youtube_url: '',
        website_url: '',
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})


    // Check KOL Status (only if user is not KOL)
    const { data: kolStatus, isLoading: kolStatusLoading } = useQuery({
        queryKey: ['kolStatus'],
        queryFn: checkKolStatus,
        enabled: !profileLoading && profile !== null && !profile.kol,
        retry: false,
    })

    // Fetch Member Ref Info - enable for both success status and when showing milestones
    const { data: memberRefInfo = {} as any, isLoading: isLoadingInfo } = useQuery({
        queryKey: ['memberRefInfo'],
        queryFn: getMemberRefInfo,
        enabled: !profileLoading && profile !== null && (profile.kol || kolStatus?.status === 'success' || kolStatus?.status === 'not-register'),
    })

    const memberRefData = memberRefInfo?.data || {}
    const currentReferrals = memberRefData.total_members || 0
    const currentMilestone = memberRefData.current_milestone || null
    const totalRewards = memberRefData.total_rewards || 0
    const totalCanWithdraw = memberRefData.total_can_withdraw || 0
    const rewardMilestones = memberRefData.reward_milestone || []

    // Transform API milestone data to match component structure
    const milestoneDefinitions = useMemo(() => {
        return rewardMilestones.map((item: MilestoneItem): MilestoneDefinition => ({
            count: item.milestone,
            reward: item.reward,
            is_claimed: item.is_claimed,
            reward_id: item.reward_id,
        }))
    }, [rewardMilestones])

    // Find next milestone for progress bar
    const nextMilestone = useMemo(() => {
        if (milestoneDefinitions.length === 0) return null
        return milestoneDefinitions.find((m: MilestoneDefinition) => m.count > currentReferrals) || milestoneDefinitions[milestoneDefinitions.length - 1]
    }, [currentReferrals, milestoneDefinitions])

    // Get max milestone count for progress display
    const maxMilestoneCount = useMemo(() => {
        if (milestoneDefinitions.length === 0) return 100
        return milestoneDefinitions[milestoneDefinitions.length - 1]?.count || 100
    }, [milestoneDefinitions])

    // Calculate milestones based on current milestone
    const milestones = useMemo(() => {
        return milestoneDefinitions.map((milestone: MilestoneDefinition) => ({
            ...milestone,
            achieved: currentReferrals >= milestone.count,
            showLink: nextMilestone?.count === milestone.count,
        }))
    }, [currentReferrals, nextMilestone, milestoneDefinitions])

    // Calculate total rewards from all milestones
    const totalRewardsFromMilestones = useMemo(() => {
        return milestoneDefinitions.reduce((sum: number, milestone: MilestoneDefinition) => sum + (milestone.reward || 0), 0)
    }, [milestoneDefinitions])

    const progressPercentage = nextMilestone
        ? Math.min((currentReferrals / nextMilestone.count) * 100, 100)
        : 100

    // Generate referral link
    const referralLink = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/?ref=${profile?.ref || ''}`

    // Withdraw mutation
    const withdrawMutation = useMutation({
        mutationFn: createMemberRefWithdraw,
        onSuccess: (data) => {
            toast.success(t('smartRef.withdrawSuccess'))
            queryClient.invalidateQueries({ queryKey: ['memberRefInfo'] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('smartRef.withdrawError')
            toast.error(message)
        },
    })

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            toast.success(t('smartRef.linkCopied'))
        } catch (err) {
            toast.error(t('smartRef.copyFailed'))
        }
    }

    const handleClaimReward = () => {
        if (totalCanWithdraw < 10) {
            toast.error(t('smartRef.minimumWithdrawError', { amount: totalCanWithdraw.toFixed(2) }))
            return
        }

        if (withdrawMutation.isPending) {
            return
        }

        withdrawMutation.mutate()
    }

    // KOL Registration Mutation
    const kolRegisterMutation = useMutation({
        mutationFn: registerKol,
        onSuccess: (data) => {
            toast.success(t('kol.registerSuccess'))
            queryClient.invalidateQueries({ queryKey: ['kolStatus'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
        },
        onError: (error: any) => {
            const message = error?.message || error?.response?.data?.message || t('kol.registerError')
            toast.error(message)
        },
    })

    // Validate KOL Form
    const validateKolForm = (): boolean => {
        const errors: Record<string, string> = {}

        if (!kolFormData.name || kolFormData.name.trim().length === 0) {
            errors.name = t('kol.nameRequired')
        }

        const urls = [
            kolFormData.facebook_url,
            kolFormData.x_url,
            kolFormData.group_telegram_url,
            kolFormData.youtube_url,
            kolFormData.website_url,
        ].filter(url => url && url.trim().length > 0)

        if (urls.length === 0) {
            errors.urls = t('kol.atLeastOneUrlRequired')
        }

        // Validate URL format
        const urlPattern = /^https?:\/\/.+/i
        urls.forEach(url => {
            if (url && !urlPattern.test(url)) {
                errors.urls = t('kol.invalidUrlFormat')
            }
        })

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Handle KOL Form Submit
    const handleKolFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateKolForm()) {
            return
        }

        // Clean up empty URLs
        const cleanedData: KolRegisterRequest = {
            name: kolFormData.name.trim(),
        }

        if (kolFormData.facebook_url?.trim()) cleanedData.facebook_url = kolFormData.facebook_url.trim()
        if (kolFormData.x_url?.trim()) cleanedData.x_url = kolFormData.x_url.trim()
        if (kolFormData.group_telegram_url?.trim()) cleanedData.group_telegram_url = kolFormData.group_telegram_url.trim()
        if (kolFormData.youtube_url?.trim()) cleanedData.youtube_url = kolFormData.youtube_url.trim()
        if (kolFormData.website_url?.trim()) cleanedData.website_url = kolFormData.website_url.trim()

        kolRegisterMutation.mutate(cleanedData, {
            onSuccess: () => {
                setShowKolModal(false)
                setKolFormData({
                    name: '',
                    facebook_url: '',
                    x_url: '',
                    group_telegram_url: '',
                    youtube_url: '',
                    website_url: '',
                })
                setFormErrors({})
            }
        })
    }

    // Show loading state while profile is loading
    if (profileLoading || (profile && !profile.kol && kolStatusLoading)) {
        return (
            <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE645F] mx-auto'></div>
                    <p className='mt-4 text-gray-600 dark:text-gray-400'>{t('common.loading')}</p>
                </div>
            </div>
        )
    }


    // Show pending message if KOL registration is pending
    if (!profileLoading && profile && !profile.kol && kolStatus?.status === 'pending') {
        return (
            <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='text-center max-w-2xl mx-auto'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-lg p-6 sm:p-8'>
                        <h2 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4'>
                            {t('kol.pendingTitle')}
                        </h2>
                        <p className='text-gray-600 dark:text-gray-300 mb-6'>
                            {t('kol.pendingMessage')}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Show Smart Ref page if user is KOL or status is success or not-register
    if (!profileLoading && profile && (profile.kol || kolStatus?.status === 'success' || kolStatus?.status === 'not-register')) {
        const isSuccess = profile.kol || kolStatus?.status === 'success'
        const isNotRegister = !profile.kol && kolStatus?.status === 'not-register'

        // Smart Ref page content
        return (
            <div className='w-full min-h-svh flex pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='w-full max-w-7xl space-y-6'>
                    {/* Title Section */}
                    <div className='flex items-center justify-center gap-3 sm:gap-4 mb-6'>
                        <h1 className='text-2xl md:text-4xl font-bold text-center text-gradient-primary-2 '>
                            {t('smartRef.title')}
                        </h1>
                    </div>

                    {/* Show referral link only if status is success */}
                    {isSuccess && (
                        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-solid border-gray-200 dark:border-[#FE645F] shadow-sm p-4 sm:px-6 sm:py-4">
                            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('ref.yourReferralLink') || 'Your Referral Link'}
                            </label>
                            <div className="flex items-center gap-2 relative">
                                <input
                                    type="text"
                                    value={`https://usda-demo.vercel.app/?ref=${profile?.ref || ''}`}
                                    readOnly
                                    className="flex-1 bg-gray-50 dark:bg-gray-900/50 text-sm sm:text-base px-3 py-2 rounded-md border border-theme-gray-100 dark:border-gray-700 border-solid text-gray-500 dark:text-gray-400"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-none absolute right-2 top-1/2 transform -translate-y-1/2 rounded-md p-2 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Show register button if status is not-register */}
                    {isNotRegister && (
                        <div className="max-w-3xl mx-auto flex justify-center">
                            <Button
                                onClick={() => setShowKolModal(true)}
                                className='mb-10 outline-none border-none cursor-pointer hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4'
                                size='lg'
                            >
                                {t('kol.registerButton') || 'Đăng ký KOL'}
                            </Button>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isSuccess && (
                        <div className='bg-transparent rounded-lg border border-gray-200 dark:border-[#FE645F] p-4 sm:p-6 md:max-w-xl mx-auto'>
                            {isLoadingInfo ? (
                                <div className='w-full max-w-[20vw] mx-auto bg-gradient-to-br from-[#FE645F] to-[#C68AFE] rounded-full h-8 sm:h-10 animate-pulse' />
                            ) : (
                                <div className='xl:w-[20vw] w-full mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-8 sm:h-10 overflow-hidden relative'>
                                    <div
                                        className='absolute inset-0 bg-gradient-to-br from-[#FE645F] to-[#C68AFE] rounded-full transition-all duration-300'
                                        style={{ width: '100%' }}
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center'>
                                        <span className='text-xs sm:text-sm font-semibold px-2 whitespace-nowrap z-10'>
                                            <span className='text-white drop-shadow-md'>
                                                {t('smartRef.progressText', {
                                                    current: currentReferrals,
                                                    total: nextMilestone?.count || maxMilestoneCount
                                                })}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className='flex items-center justify-center gap-3 sm:gap-4 mb-6 bg-gradient-primary  md:px-10 px-6 !mt-0 py-2 md:py-3 md:!w-fit mx-auto rounded-full'>
                        <h2 className='text-sm sm:text-2xl md:text-3xl font-bold text-center text-white uppercase '>
                            {t('smartRef.totalRewardsUpTo', { total: totalRewardsFromMilestones })}
                        </h2>
                    </div>

                    {/* SVG Gradient Definition for custom icon */}
                    <svg width='0' height='0' className='absolute'>
                        <defs>
                            <linearGradient id='paint0_linear_245_326' x1='49.9999' y1='-0.000366211' x2='49.9999' y2='100' gradientUnits='userSpaceOnUse'>
                                <stop stopColor='#EB2FBB' />
                                <stop offset='0.504808' stopColor='#E73A64' />
                                <stop offset='1' stopColor='#8252DD' />
                            </linearGradient>
                            <clipPath id='clip0_245_326'>
                                <rect width='100' height='100' fill='white' />
                            </clipPath>
                        </defs>
                    </svg>

                    {/* Milestone Columns */}
                    <div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 '>
                        {milestones.map((milestone: MilestoneDefinition, index: number) => (
                            <div
                                key={index}
                                className='flex flex-col items-center space-y-2 sm:space-y-3 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] hover:shadow-md p-3 sm:p-4'
                            >
                                {/* Milestone Label */}
                                <div className='text-center'>
                                    <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1'>{t('smartRef.milestoneLabel')}</p>
                                    <p className='text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200'>
                                        {t('smartRef.peopleCount', { count: milestone.count })}
                                    </p>
                                </div>

                                {/* Custom Icon */}
                                <div className='flex items-center justify-center'>
                                    {milestone.achieved ? (
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20'
                                            viewBox='0 0 100 100'
                                            fill='none'
                                        >
                                            <g clipPath='url(#clip0_245_326)'>
                                                <path
                                                    d='M77.4646 37.9541C77.1949 37.6162 76.868 37.6826 76.6967 37.7516C76.5531 37.8098 76.2242 37.9957 76.2697 38.4617C76.3244 39.0213 76.3551 39.5918 76.3609 40.1576C76.3853 42.5049 75.4437 44.8045 73.7777 46.4668C72.1223 48.1184 69.9449 49.0082 67.6266 48.9824C64.4598 48.942 61.8332 47.2903 60.0307 44.2057C58.5402 41.6551 59.1953 38.3655 59.8889 34.8824C60.2947 32.8438 60.7145 30.7356 60.7145 28.7291C60.7145 13.1063 50.2117 4.09299 43.9512 0.110767C43.8217 0.02854 43.6984 -0.000366211 43.5893 -0.000366211C43.4117 -0.000366211 43.2711 0.0761963 43.2018 0.123071C43.0674 0.214087 42.8523 0.421509 42.9215 0.788696C45.3145 13.4961 38.177 21.1389 30.6203 29.2303C22.8313 37.5707 14.0029 47.024 14.0029 64.0733C14.0029 83.8834 30.1195 100 49.9297 100C66.2406 100 80.6217 88.6282 84.9014 72.3457C87.8197 61.2436 84.7615 47.1014 77.4646 37.9541ZM50.826 92.3315C45.8654 92.5576 41.1479 90.7785 37.5445 87.3332C33.9799 83.9246 31.9354 79.1678 31.9354 74.2823C31.9354 65.1141 35.4408 58.3836 44.8693 49.4485C45.0236 49.3022 45.1816 49.2559 45.3193 49.2559C45.4441 49.2559 45.5523 49.294 45.6268 49.3297C45.7836 49.4053 46.0414 49.5924 46.0066 49.9971C45.6695 53.9199 45.6754 57.176 46.0238 59.6752C46.9145 66.059 51.5877 70.3483 57.6531 70.3483C60.6269 70.3483 63.4596 69.2291 65.6293 67.1969C65.8811 66.961 66.1623 66.991 66.2701 67.0139C66.4129 67.0448 66.6041 67.1323 66.7043 67.3739C67.6039 69.5459 68.0637 71.8516 68.0707 74.2264C68.0994 83.7821 60.3635 91.9041 50.826 92.3315Z'
                                                    fill='url(#paint0_linear_245_326)'
                                                />
                                            </g>
                                            <defs>
                                                <linearGradient
                                                    id='paint0_linear_245_326'
                                                    x1='49.9999'
                                                    y1='-0.000366211'
                                                    x2='49.9999'
                                                    y2='100'
                                                    gradientUnits='userSpaceOnUse'
                                                >
                                                    <stop stopColor='#EB2FBB' />
                                                    <stop offset='0.504808' stopColor='#E73A64' />
                                                    <stop offset='1' stopColor='#8252DD' />
                                                </linearGradient>
                                                <clipPath id='clip0_245_326'>
                                                    <rect width='100' height='100' fill='white' />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-40'
                                            viewBox='0 0 100 100'
                                            fill='none'
                                        >
                                            <g clipPath='url(#clip0_245_326_inactive)'>
                                                <path
                                                    d='M77.4646 37.9541C77.1949 37.6162 76.868 37.6826 76.6967 37.7516C76.5531 37.8098 76.2242 37.9957 76.2697 38.4617C76.3244 39.0213 76.3551 39.5918 76.3609 40.1576C76.3853 42.5049 75.4437 44.8045 73.7777 46.4668C72.1223 48.1184 69.9449 49.0082 67.6266 48.9824C64.4598 48.942 61.8332 47.2903 60.0307 44.2057C58.5402 41.6551 59.1953 38.3655 59.8889 34.8824C60.2947 32.8438 60.7145 30.7356 60.7145 28.7291C60.7145 13.1063 50.2117 4.09299 43.9512 0.110767C43.8217 0.02854 43.6984 -0.000366211 43.5893 -0.000366211C43.4117 -0.000366211 43.2711 0.0761963 43.2018 0.123071C43.0674 0.214087 42.8523 0.421509 42.9215 0.788696C45.3145 13.4961 38.177 21.1389 30.6203 29.2303C22.8313 37.5707 14.0029 47.024 14.0029 64.0733C14.0029 83.8834 30.1195 100 49.9297 100C66.2406 100 80.6217 88.6282 84.9014 72.3457C87.8197 61.2436 84.7615 47.1014 77.4646 37.9541ZM50.826 92.3315C45.8654 92.5576 41.1479 90.7785 37.5445 87.3332C33.9799 83.9246 31.9354 79.1678 31.9354 74.2823C31.9354 65.1141 35.4408 58.3836 44.8693 49.4485C45.0236 49.3022 45.1816 49.2559 45.3193 49.2559C45.4441 49.2559 45.5523 49.294 45.6268 49.3297C45.7836 49.4053 46.0414 49.5924 46.0066 49.9971C45.6695 53.9199 45.6754 57.176 46.0238 59.6752C46.9145 66.059 51.5877 70.3483 57.6531 70.3483C60.6269 70.3483 63.4596 69.2291 65.6293 67.1969C65.8811 66.961 66.1623 66.991 66.2701 67.0139C66.4129 67.0448 66.6041 67.1323 66.7043 67.3739C67.6039 69.5459 68.0637 71.8516 68.0707 74.2264C68.0994 83.7821 60.3635 91.9041 50.826 92.3315Z'
                                                    fill='#9CA3AF'
                                                />
                                            </g>
                                            <defs>
                                                <clipPath id='clip0_245_326_inactive'>
                                                    <rect width='100' height='100' fill='white' />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    )}
                                </div>

                                {/* Reward Amount */}
                                <p className='text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200'>
                                    {milestone.reward} $
                                </p>

                                {/* Reward Label */}
                                <p className='text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400'>{t('smartRef.rewardLabel')}</p>

                                {/* Referral Link Button (only for 20 people milestone) */}
                                {/* {milestone.showLink && (
                                <button
                                    onClick={() => router.push('/referral/direct')}
                                    className='mt-2 w-full hidden sm:block bg-gradient-to-r from-pink-500 to-red-500 text-white border-none hover:opacity-90 text-xs sm:text-sm font-medium rounded-lg hover:bg-gradient-to-r hover:from-pink-600 hover:to-red-600 cursor-pointer'
                                >
                                    <Link2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                                    {t('smartRef.referralLinkButton')}
                                </button>
                            )} */}
                            </div>
                        ))}
                    </div>

                    {/* Claim Reward Button - only show if status is success */}
                    {isSuccess && (
                        <>
                            <div className='flex flex-col items-center gap-4 mt-4'>
                                {totalCanWithdraw > 0 && (
                                    <div className='text-center'>
                                        <p className='text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-1'>
                                            {t('smartRef.withdrawableAmount', { amount: totalCanWithdraw.toFixed(2) })}
                                        </p>
                                        {totalCanWithdraw < 10 && (
                                            <p className='text-xs text-orange-600 dark:text-orange-400'>
                                                {t('smartRef.minimumWithdrawNotice')}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <Button
                                    onClick={handleClaimReward}
                                    disabled={withdrawMutation.isPending || totalCanWithdraw < 10}
                                    className='bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-bold px-8 sm:px-12 py-3 sm:py-4 rounded-full shadow-lg cursor-pointer'
                                    size='lg'
                                >
                                    {withdrawMutation.isPending ? t('smartRef.processing') : t('smartRef.claimReward')}
                                </Button>
                            </div>

                            {/* Disclaimer */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-sm p-4 sm:p-6 max-w-2xl mx-auto'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed italic'>
                                    {t('smartRef.disclaimer')}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* KOL Registration Modal */}
                <Modal
                    isOpen={showKolModal}
                    onClose={() => {
                        setShowKolModal(false)
                        setFormErrors({})
                    }}
                    maxWidth="max-w-3xl"
                >
                    <div className='w-full'>
                        <h2 className='text-3xl font-semibold dark:text-white text-gray-800 dark:md:text-white mb-2'>
                            {t('kol.registerTitle')}
                        </h2>
                        <p className='text-yellow-600 italic mb-6 text-sm'>
                            {t('kol.registerDescription')}
                        </p>

                        <form onSubmit={handleKolFormSubmit} className='w-full flex flex-col gap-4 mt-6 px-0'>
                            {/* Name Field */}
                            <div className='space-y-1'>
                                <label htmlFor="kol-name" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                    {t('kol.name')} <span className='text-theme-red dark:text-theme-red-200'>{t('login.required')}</span>
                                </label>
                                <input
                                    id="kol-name"
                                    type="text"
                                    value={kolFormData.name}
                                    onChange={(e) => setKolFormData({ ...kolFormData, name: e.target.value })}
                                    placeholder={t('kol.namePlaceholder')}
                                    className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                    disabled={kolRegisterMutation.isPending}
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            {/* URL Fields Grid - 2 columns on desktop */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {/* Facebook URL */}
                                <div className='space-y-1'>
                                    <label htmlFor="kol-facebook" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                        {t('kol.facebookUrl')}
                                    </label>
                                    <input
                                        id="kol-facebook"
                                        type="url"
                                        value={kolFormData.facebook_url || ''}
                                        onChange={(e) => setKolFormData({ ...kolFormData, facebook_url: e.target.value })}
                                        placeholder={t('kol.urlPlaceholder')}
                                        className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={kolRegisterMutation.isPending}
                                    />
                                </div>

                                {/* X (Twitter) URL */}
                                <div className='space-y-1'>
                                    <label htmlFor="kol-x" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                        {t('kol.xUrl')}
                                    </label>
                                    <input
                                        id="kol-x"
                                        type="url"
                                        value={kolFormData.x_url || ''}
                                        onChange={(e) => setKolFormData({ ...kolFormData, x_url: e.target.value })}
                                        placeholder={t('kol.urlPlaceholder')}
                                        className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={kolRegisterMutation.isPending}
                                    />
                                </div>

                                {/* Telegram Group URL */}
                                <div className='space-y-1'>
                                    <label htmlFor="kol-telegram" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                        {t('kol.telegramUrl')}
                                    </label>
                                    <input
                                        id="kol-telegram"
                                        type="url"
                                        value={kolFormData.group_telegram_url || ''}
                                        onChange={(e) => setKolFormData({ ...kolFormData, group_telegram_url: e.target.value })}
                                        placeholder={t('kol.urlPlaceholder')}
                                        className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={kolRegisterMutation.isPending}
                                    />
                                </div>

                                {/* YouTube URL */}
                                <div className='space-y-1'>
                                    <label htmlFor="kol-youtube" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                        {t('kol.youtubeUrl')}
                                    </label>
                                    <input
                                        id="kol-youtube"
                                        type="url"
                                        value={kolFormData.youtube_url || ''}
                                        onChange={(e) => setKolFormData({ ...kolFormData, youtube_url: e.target.value })}
                                        placeholder={t('kol.urlPlaceholder')}
                                        className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={kolRegisterMutation.isPending}
                                    />
                                </div>

                                {/* Website URL */}
                                <div className='space-y-1'>
                                    <label htmlFor="kol-website" className='block text-sm font-bold text-gray-700 dark:text-white'>
                                        {t('kol.websiteUrl')}
                                    </label>
                                    <input
                                        id="kol-website"
                                        type="url"
                                        value={kolFormData.website_url || ''}
                                        onChange={(e) => setKolFormData({ ...kolFormData, website_url: e.target.value })}
                                        placeholder={t('kol.urlPlaceholder')}
                                        className='w-full pr-4 py-2.5 pl-4 border border-solid border-gray-400 focus:border-solid focus:border-gray-300 dark:focus:border-gray-600 dark:border-gray-700 rounded-full outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400'
                                        disabled={kolRegisterMutation.isPending}
                                    />
                                </div>
                            </div>

                            {formErrors.urls && (
                                <p className="text-red-500 text-sm">{formErrors.urls}</p>
                            )}

                            <button
                                type="submit"
                                disabled={kolRegisterMutation.isPending}
                                className='w-fix mx-auto outline-none border-none cursor-pointer py-2 px-6 mt-6 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base uppercase'
                            >
                                {kolRegisterMutation.isPending ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('kol.submitting')}
                                    </>
                                ) : (
                                    t('kol.submit')
                                )}
                            </button>
                        </form>
                    </div>
                </Modal>
            </div>
        )
    }

    // Fallback: Show loading or empty state
    return (
        <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
            <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE645F] mx-auto'></div>
                <p className='mt-4 text-gray-600 dark:text-gray-400'>{t('common.loading')}</p>
            </div>
        </div>
    )
}