'use client'
import React, { useMemo, useState } from 'react'
import { Copy, Play, Link2 } from 'lucide-react'
import { Button } from '@/ui/button'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMemberRefInfo, createMemberRefWithdraw } from '@/services/RefService'
import { useProfile } from '@/hooks/useProfile'
import { useLang } from '@/lang/useLang'
import { useRouter } from 'next/navigation'

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
    const [showKolModal, setShowKolModal] = useState(true)


    // Fetch Member Ref Info
    const { data: memberRefInfo = {} as any, isLoading: isLoadingInfo } = useQuery({
        queryKey: ['memberRefInfo'],
        queryFn: getMemberRefInfo,
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

    // Show loading state while profile is loading
    if (profileLoading) {
        return (
            <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE645F] mx-auto'></div>
                    <p className='mt-4 text-gray-600 dark:text-gray-400'>{t('common.loading')}</p>
                </div>
            </div>
        )
    }
    console.log(profile)

    // Show modal and message if user doesn't have KOL permission
    if (!profileLoading && profile && !profile.kol) {
        return (
            <>
                <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                    <div className='text-center max-w-2xl mx-auto'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-lg p-6 sm:p-8'>
                            <h2 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4'>
                                {t('smartRef.kolPermissionTitle')}
                            </h2>
                            <p className='text-gray-600 dark:text-gray-300 mb-6'>
                                {t('smartRef.kolPermissionMessage')}
                            </p>
                            <Button
                                onClick={() => setShowKolModal(true)}
                                className="bg-gradient-to-r from-[#FE645F] to-[#C68AFE] text-white border-none hover:opacity-90"
                            >
                                {t('smartRef.kolPermissionTitle')}
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
            <div className='w-full max-w-7xl space-y-6'>
                {/* Title Section */}
                <div className='flex items-center justify-center gap-3 sm:gap-4 mb-6'>
                    <h1 className='text-xl sm:text-3xl md:text-4xl font-bold text-center text-gradient-secondary '>
                        {t('smartRef.title')}
                    </h1>
                </div>

                {/* Progress Bar */}
                <div className='bg-transparent rounded-lg border border-gray-200 dark:border-[#FE645F] p-4 sm:p-6'>
                    {isLoadingInfo ? (
                        <div className='w-full max-w-[20vw] mx-auto bg-gradient-to-br from-[#FE645F] to-[#C68AFE] rounded-full h-8 sm:h-10 animate-pulse' />
                    ) : (
                        <div className='w-[20vw] mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-8 sm:h-10 overflow-hidden relative'>
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

                <div className='flex items-center justify-center gap-3 sm:gap-4 mb-6 bg-theme-pink-100 px-8 py-4 !w-fit mx-auto rounded-full'>
                    <h2 className='text-xl sm:text-3xl md:text-4xl font-bold text-center text-gradient-secondary '>
                        {t('smartRef.totalRewardsUpTo')}
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
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 '>
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
                            {milestone.showLink && (
                                <Button
                                    onClick={() => router.push('/referral/direct')}
                                    className='mt-2 w-full bg-gradient-to-r from-pink-500 to-red-500 text-white border-none hover:opacity-90 text-xs sm:text-sm font-medium rounded-lg hover:bg-gradient-to-r hover:from-pink-600 hover:to-red-600 cursor-pointer'
                                    size='sm'
                                >
                                    <Link2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                                    {t('smartRef.referralLinkButton')}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Claim Reward Button */}
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
            </div>
        </div>
    )
}