'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import html2canvas from 'html2canvas'
import { Loader2, ChevronLeft, ChevronRight, Download, Share2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import {
    getStakingHistoryMissions,
    type StakingLockWithMissionsResponse,
    type Mission,
    type StakingLockDetail,
} from '@/services/StakingService'
import { useQuery } from '@tanstack/react-query'

export default function StakingHistoryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const calendarRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()
    const { t } = useLang()
    const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0)

    const stakingId = params?.id ? Number(params.id) : null

    // Get staking history missions
    const { data, isLoading, error, isError } = useQuery<StakingLockWithMissionsResponse>({
        queryKey: ['staking-history-missions', stakingId],
        queryFn: () => getStakingHistoryMissions(stakingId!),
        enabled: !!stakingId && stakingId > 0,
        retry: false,
        staleTime: 2 * 60 * 1000, // Cache 2 phút
        refetchOnWindowFocus: false,
    })

    const stakingLock = data?.data?.staking_lock
    const missions = useMemo(() => {
        const missionsList = data?.data?.missions || []
        // Sort by date descending (newest first)
        return [...missionsList].sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateB - dateA
        })
    }, [data])

    // Reset currentMonthIndex when stakingLock changes
    useEffect(() => {
        setCurrentMonthIndex(0)
    }, [stakingLock?.id])

    // Handle errors
    useEffect(() => {
        if (isError && error) {
            const errorObj: any = error
            if (errorObj?.response?.status === 404) {
                toast.error(t('makeMoney.errors.stakingNotFound') || 'Không tìm thấy gói staking')
                router.push('/make-money')
                return
            }
            if (errorObj?.response?.status === 400) {
                toast.error(t('makeMoney.errors.invalidStakingId') || 'ID gói staking không hợp lệ')
                router.push('/make-money')
                return
            }
            const message = errorObj?.response?.data?.message || t('makeMoney.errors.loadMissionError')
            toast.error(message)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isError, error, router])

    // Format date (date only, no time)
    const formatDateOnly = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    // Format number
    const formatNumber = (num: number): string => {
        const rounded = parseFloat(num.toFixed(2))
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(rounded)
    }

    // Get type label for display (duration format)
    const getTypeDurationLabel = (type: string): string => {
        switch (type) {
            case 'base':
                return t('makeMoney.oneDay')
            case '1d':
                return t('makeMoney.oneDay')
            case '7d':
                return t('makeMoney.sevenDays')
            case '30d':
                return t('makeMoney.oneMonth')
            default:
                return type
        }
    }

    // Get status text
    const getStatusText = (status: string): string => {
        switch (status) {
            case 'running':
                return t('makeMoney.statusNotCompleted')
            case 'pending-claim':
                return t('makeMoney.statusPendingClaim')
            case 'ended':
                return t('makeMoney.statusCompleted')
            default:
                return status
        }
    }

    // Capture calendar as image and download
    const handleDownloadCalendar = async () => {
        if (!calendarRef.current) {
            toast.error(t('makeMoney.calendarCaptureError') || 'Không thể chụp ảnh lịch')
            return
        }

        try {
            const isDarkMode = document.documentElement.classList.contains('dark')
            const backgroundColor = isDarkMode ? '#1f2937' : '#ffffff'

            const canvas = await html2canvas(calendarRef.current, {
                backgroundColor: backgroundColor,
                scale: 2,
                logging: false,
                useCORS: true,
            })

            const imageUrl = canvas.toDataURL('image/png')
            const date = new Date()
            const dateStr = date.toISOString().split('T')[0]
            const filename = `staking-calendar-${dateStr}.png`

            const link = document.createElement('a')
            link.download = filename
            link.href = imageUrl
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success(t('makeMoney.calendarDownloaded') || 'Đã tải xuống hình ảnh lịch')
        } catch (error) {
            console.error('Error capturing calendar:', error)
            toast.error(t('makeMoney.calendarCaptureError') || 'Có lỗi xảy ra khi chụp ảnh')
        }
    }

    // Share calendar image
    const handleShareCalendar = async () => {
        if (!calendarRef.current) {
            toast.error(t('makeMoney.calendarCaptureError') || 'Không thể chụp ảnh lịch')
            return
        }

        try {
            const isDarkMode = document.documentElement.classList.contains('dark')
            const backgroundColor = isDarkMode ? '#1f2937' : '#ffffff'

            const canvas = await html2canvas(calendarRef.current, {
                backgroundColor: backgroundColor,
                scale: 2,
                logging: false,
                useCORS: true,
            })

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error(t('makeMoney.calendarCaptureError') || 'Có lỗi xảy ra khi chụp ảnh')
                    return
                }

                const file = new File([blob], 'staking-calendar.png', { type: 'image/png' })

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: t('makeMoney.shareCalendarTitle') || 'Staking Calendar',
                            text: t('makeMoney.shareCalendarText') || 'Lịch staking của tôi',
                        })
                        toast.success(t('makeMoney.calendarShared') || 'Đã chia sẻ hình ảnh')
                    } catch (shareError: any) {
                        if (shareError.name !== 'AbortError') {
                            console.error('Share error:', shareError)
                            handleDownloadCalendar()
                        }
                    }
                } else {
                    handleDownloadCalendar()
                }
            }, 'image/png')
        } catch (error) {
            console.error('Error sharing calendar:', error)
            toast.error(t('makeMoney.calendarCaptureError') || 'Có lỗi xảy ra khi chia sẻ')
        }
    }

    // Table styles
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase bg-transparent "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 dark:text-gray-300 bg-transparent border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    if (isLoading) {
        return (
            <div className='w-full min-h-svh flex py-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='w-full max-w-7xl'>
                    <Skeleton className="h-64 w-full rounded-lg mb-6" />
                    <Skeleton className="h-96 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    if (!stakingLock) {
        return (
            <div className='w-full min-h-svh flex py-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
                <div className='w-full max-w-7xl'>
                    <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
                        <p className='text-sm sm:text-base'>{t('makeMoney.errors.stakingNotFound') || 'Không tìm thấy gói staking'}</p>
                        <Button
                            onClick={() => router.push('/make-money')}
                            className='mt-4 bg-theme-red-200 text-white rounded-full'
                        >
                            {t('makeMoney.backToMakeMoney') || 'Quay lại'}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full min-h-svh flex py-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
            <div className='w-full max-w-5xl'>
                {/* Back Button */}
                {/* Header Section */}
                <div className='flex flex-col items-center justify-center mb-4 sm:mb-6 relative'>
                    <div className='flex items-end justify-center mb-2 sm:mb-4 gap-2 sm:gap-4'>
                        <div className='flex flex-col items-center mx-2 sm:mx-4'>
                            <h1 className='text-2xl md:text-3xl font-semibold text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]'>
                                {stakingLock.amount > 10 ? t('makeMoney.stakingTitle') : t('makeMoney.baseTitle')}
                            </h1>
                        </div>
                    </div>
                    <div className='absolute left-0 top-0'>
                        <Button
                            onClick={() => router.push('/make-money')}
                            variant="outline"
                            className='flex items-center border-none cursor-pointer hover:!text-theme-red-200 gap-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full '
                        >
                            <ArrowLeft className='w-4 h-4' />
                            {t('makeMoney.backToMakeMoney') || 'Quay lại'}
                        </Button>
                    </div>
                </div>

                {/* Staking Info Section */}
                <div className='mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#FE645F] bg-transparent'>
                    <div className='grid grid-cols-2 w-full md:max-w-3xl mx-auto gap-3 sm:gap-y-4 sm:gap-x-10 mb-3 sm:mb-4'>
                        <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.stakingType')}:</p>
                            <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{getTypeDurationLabel(stakingLock.type)}</p>
                        </div>

                        <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.status')}:</p>
                            <p className='text-xs sm:text-sm font-medium text-red-600 dark:text-[#FE645F]'>{getStatusText(stakingLock.status)}</p>
                        </div>

                        <div className='p-2 col-span-2 md:col-span-1 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.time')}:</p>
                            <p className='text-xs sm:text-sm font-medium text-red-600 dark:text-[#FE645F]'>{formatDateOnly(stakingLock.date_start)} - {formatDateOnly(stakingLock.date_end)}</p>
                        </div>

                        <div className='p-2 col-span-2 md:col-span-1 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.amount')}:</p>
                            <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{stakingLock.amount} USDT</p>
                        </div>

                        <div className='p-2 col-span-2 md:col-span-1 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md flex-wrap'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.estimatedReward')}:</p>
                            <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{stakingLock.estimated_reward} USDT</p>
                            </div>
                        </div>

                        <div className='p-2 col-span-2 md:col-span-1 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md flex-wrap'>
                            <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.earnedAmount')}:</p>
                            <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{formatNumber(stakingLock.real_reward || 0)} USDT</p>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className='mb-6 sm:mb-8'>
                        <div ref={calendarRef} className='max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-4 sm:p-6 shadow-md'>
                            {(() => {
                                const startDate = new Date(stakingLock.date_start)
                                const endDate = new Date(stakingLock.date_end)

                                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

                                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                                const monthNames = [
                                    t('makeMoney.months.1'), t('makeMoney.months.2'), t('makeMoney.months.3'), t('makeMoney.months.4'),
                                    t('makeMoney.months.5'), t('makeMoney.months.6'), t('makeMoney.months.7'), t('makeMoney.months.8'),
                                    t('makeMoney.months.9'), t('makeMoney.months.10'), t('makeMoney.months.11'), t('makeMoney.months.12')
                                ]

                                const missionsList = missions || []

                                const formatDateString = (y: number, m: number, d: number): string => {
                                    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                }

                                const displayDate = new Date(startDateOnly)
                                displayDate.setMonth(displayDate.getMonth() + currentMonthIndex)

                                const year = displayDate.getFullYear()
                                const month = displayDate.getMonth()

                                const isDateInRange = (day: number): boolean => {
                                    const currentDate = new Date(year, month, day)
                                    return currentDate >= startDateOnly && currentDate <= endDateOnly
                                }

                                const firstDay = new Date(year, month, 1)
                                const lastDay = new Date(year, month + 1, 0)
                                const daysInMonth = lastDay.getDate()
                                const startingDayOfWeek = firstDay.getDay()

                                const findMissionByDate = (day: number): Mission | undefined => {
                                    const dateString = formatDateString(year, month, day)
                                    return missionsList.find(mission => mission.date === dateString)
                                }

                                const isStartDate = (day: number): boolean => {
                                    return year === startDateOnly.getFullYear() &&
                                        month === startDateOnly.getMonth() &&
                                        day === startDateOnly.getDate()
                                }

                                const isEndDate = (day: number): boolean => {
                                    return year === endDateOnly.getFullYear() &&
                                        month === endDateOnly.getMonth() &&
                                        day === endDateOnly.getDate()
                                }

                                const calendarDays: (number | null)[] = []
                                for (let i = 0; i < startingDayOfWeek; i++) {
                                    calendarDays.push(null)
                                }
                                for (let day = 1; day <= daysInMonth; day++) {
                                    calendarDays.push(day)
                                }

                                return (
                                    <div>
                                        <div className='p-2 sm:px-3 sm:py-2 bg-theme-red-200 rounded-full flex items-center gap-2 sm:gap-3 md:justify-center w-fit mx-auto mb-4 justify-start shadow-md flex-wrap'>
                                            <p className='text-xs sm:text-sm text-white pl-1'>{t('makeMoney.earnedAmount')}:</p>
                                            <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                                <p className='text-xs sm:text-sm font-semibold text-white'>{formatNumber(stakingLock.real_reward || 0)} USDT</p>
                                            </div>
                                        </div>

                                        {/* Month Navigation */}
                                        <div className='flex items-center justify-between mb-4'>
                                            <button
                                                onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
                                                className='flex items-center outline-none border-none justify-center w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
                                            >
                                                <ChevronLeft className='w-5 h-5' />
                                            </button>
                                            <h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200'>
                                                {monthNames[month]} {year}
                                            </h3>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
                                                    className='flex items-center justify-center outline-none border-none w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
                                                >
                                                    <ChevronRight className='w-5 h-5' />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Calendar */}
                                        <div className='overflow-x-auto'>
                                            <table className='w-full border-collapse'>
                                                <thead>
                                                    <tr>
                                                        {dayNames.map((day, index) => (
                                                            <th
                                                                key={index}
                                                                className='px-1 py-2 sm:px-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                                                            >
                                                                {day}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
                                                        <tr key={weekIndex}>
                                                            {Array.from({ length: 7 }, (_, dayIndex) => {
                                                                const day = calendarDays[weekIndex * 7 + dayIndex]
                                                                const mission = day !== null ? findMissionByDate(day) : undefined
                                                                const isStart = day !== null && isStartDate(day)
                                                                const isEnd = day !== null && isEndDate(day)
                                                                const inRange = day !== null && isDateInRange(day)

                                                                const getBackgroundColor = () => {
                                                                    if (day === null) return 'bg-gray-50 dark:bg-gray-800/30'
                                                                    if (isStart || isEnd) return 'bg-gray-400 dark:bg-gray-500'
                                                                    if (inRange) {
                                                                        return 'bg-gray-400 dark:bg-gray-500'
                                                                    }
                                                                    return 'bg-white dark:bg-gray-800'
                                                                }

                                                                const bgColor = getBackgroundColor()
                                                                const hasMission = mission !== undefined
                                                                const isSuccess = mission?.status === 'success'
                                                                const isOut = mission?.status === 'out'

                                                                const getTextColor = () => {
                                                                    if (isStart || isEnd) return 'dark:text-white text-theme-black-100'
                                                                    if (hasMission) {
                                                                        return isSuccess
                                                                            ? 'text-green-700 dark:text-green-300'
                                                                            : 'text-orange-700 dark:text-orange-300'
                                                                    }
                                                                    if (inRange) return 'dark:text-white text-theme-black-100'
                                                                    return 'text-gray-700 dark:text-gray-300'
                                                                }

                                                                const textColor = getTextColor()

                                                                return (
                                                                    <td
                                                                        key={dayIndex}
                                                                        className={`px-[1px] py-1 sm:px-2 h-12 text-center border align-top`}
                                                                    >
                                                                        {day !== null ? (
                                                                            <div className={`flex py-1 flex-col h-full justify-center items-center gap-0.5 sm:gap-1 ${bgColor} ${mission?.status === 'success'
                                                                                ? 'border-green-500 border-solid'
                                                                                : mission?.status === 'out'
                                                                                    ? 'border-red-500 border-solid'
                                                                                    : ''} rounded-lg`}>
                                                                                <span className={`text-xs sm:text-sm font-semibold ${textColor}`}>
                                                                                    {day}
                                                                                </span>
                                                                                {mission && (
                                                                                    <div className='text-[9px] sm:text-[10px] leading-tight'>
                                                                                        {mission.reward != null && (
                                                                                            <div className={`mt-0.5 font-semibold ${isSuccess
                                                                                                ? 'text-green-600 dark:text-green-400'
                                                                                                : 'text-orange-600 dark:text-orange-400'
                                                                                                }`}>
                                                                                                +${mission.reward.toFixed(2)}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            ''
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Legend */}
                                        <div className='mt-4 flex flex-wrap gap-3 sm:gap-4 justify-center text-xs sm:text-sm'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded'></div>
                                                <span className='text-gray-700 dark:text-gray-300'>{t('makeMoney.stakingPeriod')}</span>
                                            </div>
                                            {missionsList.length > 0 && (
                                                <>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-4 h-4 bg-green-500 rounded'></div>
                                                        <span className='text-gray-700 dark:text-gray-300'>{t('makeMoney.completed')}</span>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-4 h-4 bg-red-500 dark:bg-red-500 rounded'></div>
                                                        <span className='text-gray-700 dark:text-gray-300'>{t('makeMoney.notCompleted')}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                        <div className='flex items-center gap-2 justify-end mt-3 max-w-3xl mx-auto'>
                            <button
                            onClick={handleDownloadCalendar}
                            className='flex items-center justify-center outline-none border-none w-10 h-10 rounded-lg transition-colors bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 cursor-pointer'
                            title={t('makeMoney.downloadCalendar') || 'Tải xuống'}
                        >
                            <Download className='w-5 h-5' />
                        </button>
                            <button
                                onClick={handleShareCalendar}
                                className='flex items-center justify-center outline-none border-none w-10 h-10 rounded-lg transition-colors bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/70 text-green-700 dark:text-green-300 cursor-pointer'
                                title={t('makeMoney.shareCalendar') || 'Chia sẻ'}
                            >
                                <Share2 className='w-5 h-5' />
                            </button></div>
                    </div>

                    {/* Missions History Table */}
                    {missions.length > 0 && (
                        <div className='w-full md:max-w-3xl mx-auto mb-3 sm:my-8'>
                            <h3 className='text-lg sm:text-xl font-bold text-theme-red-100 dark:text-[#FE645F] mb-3 sm:mb-4 mt-6 sm:mt-8'>
                                {t('makeMoney.missionsHistory')}
                            </h3>

                            {/* Mobile Card Layout */}
                            <div className="block sm:hidden space-y-3">
                                {missions.map((mission, index) => (
                                    <div
                                        key={mission.id}
                                        className={`bg-white dark:bg-gray-800 rounded-lg border ${mission.status === 'success'
                                            ? 'border-green-200 dark:border-green-700'
                                            : 'border-orange-200 dark:border-orange-700'
                                            } p-3 shadow-sm`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                {t('wallet.tableHeaders.stt')} {index + 1}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${mission.status === 'success'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-orange-500 text-white'
                                                }`}>
                                                {mission.status === 'success'
                                                    ? t('makeMoney.completed')
                                                    : t('makeMoney.notCompleted')}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                                    {t('makeMoney.date')}:</span>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {formatDateOnly(mission.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                                    {t('makeMoney.videosWatched')}:</span>
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                    {mission.turn} / {stakingLock.turn_setting || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table Layout */}
                            <div className="hidden sm:block overflow-hidden rounded-md bg-transparent border border-none">
                                <div className="overflow-hidden rounded-t-md">
                                    <table className={tableStyles}>
                                        <thead>
                                            <tr>
                                                <th className={`${tableHeaderStyles} w-[15%] text-left rounded-l-lg`}>
                                                    {t('wallet.tableHeaders.stt')}
                                                </th>
                                                <th className={`${tableHeaderStyles} w-[30%]`}>
                                                    {t('makeMoney.date')}
                                                </th>
                                                <th className={`${tableHeaderStyles} w-[35%]`}>
                                                    {t('makeMoney.videosWatched')}
                                                </th>
                                                <th className={`${tableHeaderStyles} w-[37%] text-right rounded-r-lg`}>
                                                    {t('makeMoney.statusColumn')}
                                                </th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>

                                <div className={tableContainerStyles}>
                                    <table className={tableStyles}>
                                        <tbody>
                                            {missions.map((mission, index) => (
                                                <tr key={mission.id} className="group transition-colors">
                                                    <td className={`${tableCellStyles} w-[15%] text-left !pl-4 rounded-l-lg border-l border-r-0 border-theme-gray-100 border-solid`}>
                                                        {index + 1}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[30%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {formatDateOnly(mission.date)}
                                                        </span>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[35%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                            {mission.turn} / {stakingLock.turn_setting || 0}
                                                        </span>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[37%] border-x-0 border-r text-right rounded-r-lg border-theme-gray-100 border-solid`}>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${mission.status === 'success'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-orange-500 text-white'
                                                                }`}>
                                                                {mission.status === 'success'
                                                                    ? t('makeMoney.completed')
                                                                    : t('makeMoney.notCompleted')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

