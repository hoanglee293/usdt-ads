'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Loader2, Calendar, DollarSign, Target, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import CustomSelect from '@/components/CustomSelect'
import { Skeleton } from '@/ui/skeleton'
import { Progress } from '@/ui/progress'
import Modal from '@/components/Modal'
import { useIsMobile } from '@/ui/use-mobile'
import {
    getListCoins,
    getBalance,
    type Coin,
    type ListCoinsResponse,
    type BalanceResponse,
} from '@/services/WalletService'
import {
    joinBasePackage,
    joinStakingPackage,
    getCurrentStaking,
    getStakingHistories,
    claimMissionReward,
    getMissionNow,
    type StakingPackage,
    type JoinStakingRequest,
    type CurrentStakingResponse,
    type StakingHistoriesResponse,
    type MissionClaimResponse,
    type MissionNowResponse,
} from '@/services/StakingService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function MakeMoneyPage() {
    const queryClient = useQueryClient()
    const tableRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()

    // Form state
    const [stakingType, setStakingType] = useState<'1d' | '7d' | '30d'>('1d')
    const [stakingAmount, setStakingAmount] = useState<string>('')
    const [usdtCoinId, setUsdtCoinId] = useState<string>('')
    const [isStakingModalOpen, setIsStakingModalOpen] = useState<boolean>(false)
    const [isBaseConfirmModalOpen, setIsBaseConfirmModalOpen] = useState<boolean>(false)
    const [isStakingConfirmModalOpen, setIsStakingConfirmModalOpen] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<Date>(new Date())

    // ==================== React Query Hooks ====================

    // 1. Get Coins to find USDT
    const { data: coinsResponse, isLoading: isLoadingCoins } = useQuery<ListCoinsResponse>({
        queryKey: ['coins'],
        queryFn: async () => {
            const response = await getListCoins()
            return response
        },
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 5 * 60 * 1000, // Coins ít thay đổi, cache 5 phút
    })

    // 2. Get USDT Balance
    const { data: balanceResponse, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery<BalanceResponse>({
        queryKey: ['balance', usdtCoinId],
        queryFn: async () => {
            if (!usdtCoinId) return null as any
            const response = await getBalance(Number(usdtCoinId))
            return response
        },
        enabled: !!usdtCoinId && usdtCoinId !== '',
        refetchOnWindowFocus: false, // Tắt auto refetch khi focus, chỉ refetch khi cần (sau mutation)
        staleTime: 30 * 1000, // Cache 30 giây
    })

    // 3. Get Current Staking
    const { data: currentStakingResponse, isLoading: isLoadingCurrentStaking, refetch: refetchCurrentStaking } = useQuery<CurrentStakingResponse>({
        queryKey: ['current-staking'],
        queryFn: getCurrentStaking,
        retry: false, // Don't retry on 404
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 1 * 60 * 1000, // Cache 1 phút
    })

    // 4. Get Staking Histories
    const { data: historiesResponse, isLoading: isLoadingHistories, refetch: refetchHistories } = useQuery<StakingHistoriesResponse>({
        queryKey: ['staking-histories'],
        queryFn: getStakingHistories,
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 2 * 60 * 1000, // Cache 2 phút
    })

    // 5. Get Mission Progress
    const currentStaking = useMemo(() => {
        return currentStakingResponse?.data || null
    }, [currentStakingResponse])

    const { data: missionNowResponse, isLoading: isLoadingMission, refetch: refetchMissionNow } = useQuery<MissionNowResponse>({
        queryKey: ['mission-now'],
        queryFn: getMissionNow,
        enabled: !!currentStaking && currentStaking.status === 'running', // Chỉ query khi có staking running
        refetchInterval: 30000, // Refetch mỗi 30 giây để cập nhật countdown
        refetchOnWindowFocus: false,
        retry: false, // Không retry nếu 400 (không có staking)
    })

    // 6. Join Base Mutation
    const joinBaseMutation = useMutation({
        mutationFn: joinBasePackage,
        onSuccess: () => {
            toast.success('Tham gia gói Base thành công!')
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể tham gia gói Base'
            toast.error(message)
        }
    })

    // 7. Join Staking Mutation
    const joinStakingMutation = useMutation({
        mutationFn: (data: JoinStakingRequest) => joinStakingPackage(data),
        onSuccess: () => {
            toast.success('Tham gia gói Staking thành công!')
            setStakingAmount('')
            setIsStakingModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể tham gia gói Staking'
            toast.error(message)
        }
    })

    // 8. Claim Mission Reward Mutation
    const claimMissionMutation = useMutation({
        mutationFn: claimMissionReward,
        onSuccess: async (data: MissionClaimResponse) => {
            toast.success(`Claim thành công! Nhận được ${formatNumber(data.data.total_reward)} USDT`)
            // Invalidate tất cả các queries liên quan
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            queryClient.invalidateQueries({ queryKey: ['balance', usdtCoinId] })
            
            // Refetch trực tiếp tất cả các queries để đảm bảo dữ liệu được cập nhật ngay lập tức
            await Promise.all([
                refetchBalance(),
                refetchCurrentStaking(),
                refetchHistories(),
            ])
            
            // Refetch mission-now nếu staking vẫn đang running (sử dụng dữ liệu từ response)
            const updatedStaking = data.data.staking_lock
            if (updatedStaking && updatedStaking.status === 'running') {
                refetchMissionNow()
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể claim phần thưởng'
            toast.error(message)
        }
    })

    // ==================== Initialize USDT Coin ====================
    useEffect(() => {
        if (coinsResponse?.data && coinsResponse.data.length > 0 && !usdtCoinId) {
            // Find USDT coin
            const usdtCoin = coinsResponse.data.find(
                (coin: Coin) => coin.coin_symbol?.toUpperCase() === 'USDT'
            ) || coinsResponse.data[0] // Fallback to first coin if USDT not found

            if (usdtCoin?.coin_id) {
                setUsdtCoinId(usdtCoin.coin_id.toString())
            }
        }
    }, [coinsResponse, usdtCoinId])

    // Update current time every second to check claim availability
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000) // Update every second for accurate countdown

        return () => clearInterval(interval)
    }, [])

    // ==================== Computed Values ====================

    const usdtBalance = useMemo(() => {
        return balanceResponse?.data?.balance || 0
    }, [balanceResponse])

    // Disable conditions for buttons
    const isBaseDisabled = useMemo(() => {
        return usdtBalance >= 10 || !!currentStakingResponse?.data
    }, [usdtBalance, currentStakingResponse])

    const isStakingDisabled = useMemo(() => {
        return usdtBalance < 10 || !!currentStakingResponse?.data
    }, [usdtBalance, currentStakingResponse])

    // currentStaking đã được định nghĩa ở trên (sau query mission-now)

    const stakingHistories = useMemo(() => {
        return historiesResponse?.data || []
    }, [historiesResponse])

    // Mission progress computed values
    const missionProgress = useMemo(() => {
        if (!missionNowResponse?.data) return null;
        
        const { turn_setting, turn_day, time_watch_new, time_gap } = missionNowResponse.data;
        
        // Calculate next watch time
        let canWatchNext = true;
        let nextWatchTime: Date | null = null;
        let timeRemaining: number = 0;
        
        if (time_watch_new) {
            const lastWatchTime = new Date(time_watch_new);
            nextWatchTime = new Date(lastWatchTime.getTime() + time_gap * 60 * 1000);
            const now = currentTime.getTime();
            timeRemaining = Math.max(0, nextWatchTime.getTime() - now);
            canWatchNext = timeRemaining === 0;
        }
        
        return {
            completed: turn_day,
            total: turn_setting,
            progress: turn_setting > 0 ? Math.round((turn_day / turn_setting) * 100) : 0,
            canWatchNext,
            nextWatchTime,
            timeRemaining,
            isCompleted: turn_day >= turn_setting,
        };
    }, [missionNowResponse, currentTime]);

    // Combine current staking and histories for table display
    const allPackages = useMemo(() => {
        const packages: StakingPackage[] = []
        const packageIds = new Set<number>()
        
        // Add current staking if exists
        if (currentStaking) {
            packages.push(currentStaking)
            packageIds.add(currentStaking.id)
        }
        
        // Add all histories (excluding duplicates)
        if (stakingHistories.length > 0) {
            stakingHistories.forEach((history) => {
                if (!packageIds.has(history.id)) {
                    packages.push(history)
                    packageIds.add(history.id)
                }
            })
        }
        
        // Sort by date_start (newest first)
        return packages.sort((a, b) => {
            return new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
        })
    }, [currentStaking, stakingHistories])

    // Calculate progress percentage
    const calculateProgress = (staking: StakingPackage): number => {
        const start = new Date(staking.date_start).getTime()
        const end = new Date(staking.date_end).getTime()
        const now = new Date().getTime()

        if (now >= end) return 100
        if (now <= start) return 0

        return Math.round(((now - start) / (end - start)) * 100)
    }

    // Format dateP
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Format participation time (HH:mm:ss DD/MM/YYYY)
    const formatParticipationTime = (dateString: string): string => {
        const date = new Date(dateString)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`
    }

    // Format number
    const formatNumber = (num: number): string => {
        console.log(num)
        // Round to 2 decimal places using toFixed to avoid floating point issues
        const rounded = parseFloat(num.toFixed(2))
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(rounded)
    }

    // Get reward amount - ưu tiên real_reward, fallback về estimated_reward hoặc tính toán
    const getRewardAmount = (staking: StakingPackage): number => {
        if (staking.real_reward !== undefined && staking.real_reward !== null) {
            return staking.real_reward
        }
        if (staking.estimated_reward !== undefined && staking.estimated_reward !== null) {
            return staking.estimated_reward
        }
        // Fallback: tính toán 30% của amount
        return staking.amount * 0.3
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                        Đang chạy
                    </span>
                )
            case 'pending-claim':
                return (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium">
                        Chờ nhận thưởng
                    </span>
                )
            case 'ended':
                return (
                    <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">
                        Đã kết thúc
                    </span>
                )
            default:
                return (
                    <span className="px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-medium">
                        {status}
                    </span>
                )
        }
    }

    // Get type label
    const getTypeLabel = (type: string): string => {
        switch (type) {
            case 'base':
                return 'Gói Base'
            case '1d':
                return '1 Ngày'
            case '7d':
                return '7 Ngày'
            case '30d':
                return '30 Ngày'
            default:
                return type
        }
    }

    // Get type label for display (duration format)
    const getTypeDurationLabel = (type: string): string => {
        switch (type) {
            case 'base':
                return '1 ngày'
            case '1d':
                return '1 ngày'
            case '7d':
                return '7 ngày'
            case '30d':
                return '1 tháng'
            default:
                return type
        }
    }

    // Get status text
    const getStatusText = (status: string): string => {
        switch (status) {
            case 'running':
                return 'Chưa hoàn thành'
            case 'pending-claim':
                return 'Chờ nhận thưởng'
            case 'ended':
                return 'Hoàn thành'
            default:
                return status
        }
    }

    // Check if reward was claimed (assume ended status means claimed)
    const isRewardClaimed = (status: string): boolean => {
        return status === 'ended'
    }

    // Format date (date only, no time)
    const formatDateOnly = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    // Format time remaining for countdown
    const formatTimeRemaining = (milliseconds: number): string => {
        if (milliseconds <= 0) return 'Có thể xem ngay'
        
        const totalSeconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        
        if (minutes > 0) {
            return `${minutes} phút ${seconds} giây`
        }
        return `${seconds} giây`
    }

    // Check if claim is available based on end date
    // Can only claim after 00:05:00 UTC of the day after staking ends
    const canClaimReward = (staking: StakingPackage): boolean => {
        if (staking.status !== 'pending-claim') {
            return false
        }

        const endDate = new Date(staking.date_end)
        
        // Get UTC date components of end date
        const endYear = endDate.getUTCFullYear()
        const endMonth = endDate.getUTCMonth()
        const endDay = endDate.getUTCDate()
        
        // Create the claim available date: next day at 00:05:00 UTC
        const claimAvailableDate = new Date(Date.UTC(endYear, endMonth, endDay + 1, 0, 5, 0, 0))

        // Compare with current time (both in UTC)
        const now = currentTime.getTime()
        const claimTime = claimAvailableDate.getTime()
        
        return now >= claimTime
    }

    // ==================== Event Handlers ====================

    const handleJoinBase = () => {
        setIsBaseConfirmModalOpen(true)
    }

    const handleConfirmJoinBase = () => {
        setIsBaseConfirmModalOpen(false)
        joinBaseMutation.mutate()
    }

    const handleJoinStaking = () => {
        if (usdtBalance < 10) {
            toast.error('Số dư phải >= $10 để tham gia gói Staking')
            return
        }
        if (currentStaking) {
            toast.error('Bạn đang có gói staking đang chạy')
            return
        }

        const amount = parseFloat(stakingAmount)
        if (!amount || amount <= 0) {
            toast.error('Vui lòng nhập số tiền hợp lệ')
            return
        }
        if (amount > 3500) {
            toast.error('Số tiền không được vượt quá $3,500')
            return
        }
        if (amount > usdtBalance) {
            toast.error('Số dư không đủ')
            return
        }

        joinStakingMutation.mutate({
            type: stakingType,
            amount: amount
        })
    }

    const stakingTypeOptions = [
        { value: '1d', label: '1 Ngày' },
        { value: '7d', label: '7 Ngày' },
        { value: '30d', label: '30 Ngày' },
    ]

    // Table styles (matching wallet page)
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase bg-white"
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 bg-white border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    return (
        <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-7xl'>
                {/* Header Section */}
                {currentStaking && (
                    <div className='flex flex-col items-center justify-center'>
                        <div className='flex items-end justify-center mb-2 sm:mb-4 gap-2 sm:gap-4'>
                            <img src="/logo.png" alt="logo" className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover pt-1 sm:pt-2' />
                            <div className='flex flex-col items-center mx-2 sm:mx-4'>
                                <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]'>{currentStaking && currentStaking?.amount > 10 ? 'Staking' : 'Base'}</h1>
                            </div>
                            <img src="/logo.png" alt="logo" className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover pt-1 sm:pt-2' />
                        </div>
                    </div>
                )}

                {/* Current Staking Section */}
                {isLoadingCurrentStaking ? (
                    <div className='mb-6 sm:mb-8'>
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ) : currentStaking ? (
                    <div className='mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200'>
                        <div className='grid grid-cols-1 md:grid-cols-2 w-full md:max-w-[50vw] mx-auto gap-3 sm:gap-4 mb-3 sm:mb-4'>
                            {/* Right Column */}
                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Loại staking:</p>
                                <p className='text-base sm:text-lg font-semibold text-red-600'>{getTypeDurationLabel(currentStaking.type)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Trạng thái:</p>
                                <p className='text-xs sm:text-sm font-medium text-gray-900'>{getStatusText(currentStaking.status)}</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Thời gian:</p>
                                <p className='text-xs sm:text-sm font-medium text-red-600'>{formatDateOnly(currentStaking.date_start)} - {formatDateOnly(currentStaking.date_end)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Số tiền tham gia:</p>
                                <p className='text-base sm:text-lg font-semibold text-red-600'>{currentStaking.amount} USDT</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md flex-wrap'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Phần thưởng ước tính :</p>
                                <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                    <p className='text-base sm:text-lg font-semibold text-red-600'>{currentStaking.estimated_reward} USDT</p>
                                </div>
                            </div>

                            <div className='p-2 sm:p-3 bg-white rounded-full flex items-center gap-2 sm:gap-3 justify-start shadow-md flex-wrap'>
                                <p className='text-xs sm:text-sm text-gray-600 pl-1'>Số tiền đã kiếm được:</p>
                                <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                    <p className='text-base sm:text-lg font-semibold text-red-600'>{currentStaking.real_reward} USDT</p>
                                </div>
                            </div>

                            
                        </div>
                        {/* Tasks - Chỉ hiển thị khi có dữ liệu mission-now */}
                        {missionNowResponse?.data ? (
                            <div className='grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full md:max-w-[50vw] mx-auto'>
                                <div className='p-2 sm:p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200'>
                                    <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                        <p className='text-xs sm:text-sm text-blue-600 font-medium'>Lượt xem video</p>
                                        {missionProgress ? (
                                            <p className='text-xs sm:text-sm font-semibold text-blue-900'>
                                                {missionProgress.completed}/{missionProgress.total}
                                            </p>
                                        ) : (
                                            <p className='text-xs sm:text-sm font-semibold text-blue-900'>
                                                {missionNowResponse.data.turn_setting}
                                            </p>
                                        )}
                                    </div>
                                    {missionProgress ? (
                                        <>
                                            <p className='text-[10px] sm:text-xs text-blue-500'>
                                                {missionProgress.isCompleted ? '✅ Đã hoàn thành' : `Còn lại: ${missionProgress.total - missionProgress.completed} video`}
                                            </p>
                                            {!missionProgress.canWatchNext && missionProgress.timeRemaining > 0 && (
                                                <p className='text-[10px] sm:text-xs text-orange-600 mt-0.5 sm:mt-1'>
                                                    ⏱️ Có thể xem tiếp sau: {formatTimeRemaining(missionProgress.timeRemaining)}
                                                </p>
                                            )}
                                            {missionProgress.canWatchNext && !missionProgress.isCompleted && (
                                                <p className='text-[10px] sm:text-xs text-green-600 mt-0.5 sm:mt-1'>
                                                    ✅ Có thể xem video ngay
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Skeleton className='h-2 w-full' />
                                    )}
                                </div>
                                <div className='p-2 sm:p-3 md:p-4 bg-green-50 rounded-lg border border-green-200'>
                                    <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                        <p className='text-xs sm:text-sm text-green-600 font-medium'>Số thiết bị</p>
                                        <p className='text-xs sm:text-sm font-semibold text-green-900'>
                                            {missionNowResponse.data.devices}
                                        </p>
                                    </div>
                                    <p className='text-[10px] sm:text-xs text-green-500'>
                                        Số thiết bị cho phép xem video
                                    </p>
                                </div>
                            </div>
                        ) : isLoadingMission ? (
                            <div className='grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full md:max-w-[50vw] mx-auto'>
                                <Skeleton className='h-20 sm:h-24 w-full rounded-lg' />
                                <Skeleton className='h-20 sm:h-24 w-full rounded-lg' />
                            </div>
                        ) : null}
                        <div className='flex flex-col items-center mt-3 sm:mt-6 gap-2'>
                            <Button
                                onClick={() => claimMissionMutation.mutate()}
                                disabled={claimMissionMutation.isPending || !canClaimReward(currentStaking)}
                                className='w-full sm:w-[200px] text-center bg-theme-red-200 text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-9 sm:h-10 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
                            >
                                {claimMissionMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Claim'
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Join Package Section */
                    <div className='mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 bg-transparent rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 w-full md:w-[50vw] mx-auto'>
                        {/* Gói Base - Luôn hiển thị */}
                        <div className='py-3 sm:py-4 px-4 sm:px-6 md:px-8 bg-transparent border border-theme-gray-100 border-solid flex flex-col items-center justify-center flex-1 gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[230px] rounded-xl'>
                            <h3 className='text-2xl sm:text-3xl md:text-4xl font-semibold text-black mb-1 sm:mb-2 text-center'>Base</h3>
                            <span className='text-xs sm:text-sm text-yellow-800 mb-1 sm:mb-2'>1 Ngày</span>
                            <Button
                                onClick={handleJoinBase}
                                disabled={joinBaseMutation.isPending}
                                className='w-full bg-gray-100 cursor-pointer hover:bg-gray-200 text-theme-red-200 text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-10 sm:h-11 md:h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
                            >
                                {joinBaseMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tham gia ngay'
                                )}
                            </Button>
                        </div>

                        {/* Gói Staking - Luôn hiển thị */}
                        <div className='py-3 sm:py-4 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 border border-green-200 flex flex-col items-center justify-center flex-1 gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[230px] rounded-xl'>
                            <h3 className='text-2xl sm:text-3xl md:text-4xl text-center font-semibold text-white mb-1 sm:mb-2'> Staking</h3>
                            <span className='text-xs sm:text-sm text-white mb-1 sm:mb-2'>1 Ngày / 7 Ngày / 30 Ngày</span>
                            <Button
                                onClick={() => setIsStakingConfirmModalOpen(true)}
                                disabled={isStakingDisabled}
                                className='w-full bg-white cursor-pointer hover:bg-gray-100 text-theme-red-200 text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-10 sm:h-11 md:h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
                            >
                                Tham gia ngay
                            </Button>
                        </div>
                    </div>
                )}

                {/* Staking Modal */}
                <Modal
                    isOpen={isStakingModalOpen}
                    onClose={() => {
                        setIsStakingModalOpen(false)
                        setStakingAmount('')
                    }}
                    title="Tham gia gói Staking"
                    maxWidth="max-w-[500px]"
                >
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-theme-red-200 mb-2'>
                                Loại gói
                            </label>
                            <CustomSelect
                                id="staking-type-modal"
                                value={stakingType}
                                onChange={(e) => setStakingType(e.target.value as '1d' | '7d' | '30d')}
                                options={stakingTypeOptions}
                                placeholder="Chọn loại gói"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-theme-red-200 mb-2'>
                                Số tiền tham gia (USDT)
                            </label>
                            <Input
                                type="number"
                                value={stakingAmount}
                                onChange={(e) => setStakingAmount(e.target.value)}
                                placeholder="Nhập số tiền (tối đa 3500)"
                                min="0"
                                max="3500"
                                step="0.01"
                                className="w-full rounded-full"
                            />
                            <p className='text-xs text-gray-500 mt-1'>
                                Số dư khả dụng: <span className='font-bold text-theme-red-200'>{formatNumber(usdtBalance)} </span> USDT
                            </p>
                        </div>

                        <div className='flex gap-3 pt-4 border-t border-gray-200'>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsStakingModalOpen(false)
                                    setStakingAmount('')
                                }}
                                disabled={joinStakingMutation.isPending}
                                className='flex-1 bg-transparent border border-solid border-gray-300 text-gray-700 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleJoinStaking}
                                disabled={joinStakingMutation.isPending || !stakingAmount || parseFloat(stakingAmount || '0') <= 0}
                                className='flex-1 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {joinStakingMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận'
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Base Confirmation Modal */}
                <Modal
                    isOpen={isBaseConfirmModalOpen}
                    onClose={() => setIsBaseConfirmModalOpen(false)}
                    title="Xác nhận tham gia gói Base"
                    maxWidth="max-w-[500px]"
                >
                    <div className='space-y-4'>
                        <div className='text-center'>
                            <p className='text-base text-gray-700 mb-2'>
                                Bạn có chắc chắn muốn tham gia gói <span className='font-semibold text-theme-red-200'>Base</span>?
                            </p>
                            <p className='text-sm text-gray-500'>
                                Gói Base có thời hạn <span className='font-medium'>1 ngày</span> và yêu cầu số dư nhỏ hơn $10.
                            </p>
                        </div>
                        <div className='flex gap-3 pt-4 border-t border-gray-200'>
                            <Button
                                variant="outline"
                                onClick={() => setIsBaseConfirmModalOpen(false)}
                                disabled={joinBaseMutation.isPending}
                                className='flex-1 bg-transparent border border-solid border-gray-300 text-gray-700 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirmJoinBase}
                                disabled={joinBaseMutation.isPending}
                                className='flex-1 bg-gray-100 text-theme-red-200 cursor-pointer hover:bg-pink-100 rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {joinBaseMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận'
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Staking Confirmation Modal */}
                <Modal
                    isOpen={isStakingConfirmModalOpen}
                    onClose={() => setIsStakingConfirmModalOpen(false)}
                    title="Xác nhận tham gia gói Staking"
                    maxWidth="max-w-[500px]"
                >
                    <div className='space-y-4'>
                        <div className='text-center'>
                            <p className='text-base text-gray-700 mb-2'>
                                Bạn có chắc chắn muốn tham gia gói <span className='font-semibold text-theme-red-200'>Staking</span>?
                            </p>
                            <p className='text-sm text-gray-500'>
                                Gói Staking có các tùy chọn: <span className='font-medium'>1 ngày, 7 ngày, hoặc 30 ngày</span> và yêu cầu số dư tối thiểu $10.
                            </p>
                        </div>
                        <div className='flex gap-3 pt-4 border-t border-gray-200'>
                            <Button
                                variant="outline"
                                onClick={() => setIsStakingConfirmModalOpen(false)}
                                className='flex-1 bg-transparent border border-solid border-gray-300 text-gray-700 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsStakingConfirmModalOpen(false)
                                    setIsStakingModalOpen(true)
                                }}
                                className='flex-1 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Tiếp tục
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* All Packages Table Section */}
                <h2 className='text-lg sm:text-xl font-bold text-theme-red-100 mb-3 sm:mb-4 mt-6 sm:mt-8'>Bảng các gói đã và đang tham gia</h2>
                <div className=' border-none'>
                    {isLoadingCurrentStaking || isLoadingHistories ? (
                        <div className='space-y-2 sm:space-y-3'>
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                        </div>
                    ) : allPackages.length === 0 ? (
                        <div className='text-center py-6 sm:py-8 text-gray-500'>
                            <p className='text-sm sm:text-base'>Chưa có gói nào được tham gia</p>
                        </div>
                    ) : (
                        <>
                        {/* Mobile Card Layout */}
                        <div className="block sm:hidden space-y-3">
                            {allPackages.map((pkg, index) => (
                                <div key={pkg.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            pkg.status === 'running' 
                                                ? 'bg-gray-400 text-white' 
                                                : pkg.status === 'pending-claim'
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}>
                                            {getStatusText(pkg.status)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Gói staking:</span>
                                            <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                                                {getTypeDurationLabel(pkg.type)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Loại:</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                pkg.amount > 10 
                                                    ? 'bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white' 
                                                    : 'bg-gray-200 text-gray-800'
                                            }`}>
                                                {pkg.amount > 10 ? 'Staking' : 'Base'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Số tiền tham gia:</span>
                                            <span className="text-xs font-semibold text-red-600">{formatNumber(pkg.amount)} USDT</span>
                                        </div>
                                        
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs text-gray-600">Thời gian tham gia:</span>
                                            <span className="text-[10px] text-gray-700 text-right flex-1 ml-2">{formatParticipationTime(pkg.date_start)}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                            <span className="text-xs text-gray-600">Tổng phần thưởng:</span>
                                            {pkg.status === 'running' ? (
                                                <span className="text-xs text-gray-500">--</span>
                                            ) : (
                                                <span className="text-xs font-semibold text-green-600">{formatNumber(getRewardAmount(pkg))} USDT</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop Table Layout */}
                        <div className="hidden sm:block overflow-hidden rounded-md bg-transparent border border-none">
                            {/* Fixed Header */}
                            <div className="overflow-hidden rounded-t-md">
                                <table className={tableStyles}>
                                    <thead>
                                        <tr>
                                            <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>STT</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>GÓI STAKING</th>
                                            <th className={`${tableHeaderStyles} w-[10%]`}>LOẠI</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>SỐ TIỀN THAM GIA</th>
                                            <th className={`${tableHeaderStyles} w-[15%]`}>THỜI GIAN THAM GIA</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TỔNG PHẦN THƯỞNG</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TRẠNG THÁI</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Scrollable Body */}
                            <div className={tableContainerStyles} ref={tableRef}>
                                <table className={tableStyles}>
                                    <tbody>
                                        {allPackages.map((pkg, index) => (
                                            <tr key={pkg.id} className="group transition-colors">
                                                <td className={`${tableCellStyles} w-[5%] text-left !pl-4 rounded-l-lg border-l border-r-0 border-theme-gray-100 border-solid`}>
                                                    {index + 1}
                                                </td>
                                                <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                                        {getTypeDurationLabel(pkg.type)}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellStyles} w-[10%] border-x-0 border-theme-gray-100 border-solid`}>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        pkg.amount > 10 
                                                            ? 'bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white' 
                                                            : 'bg-gray-200 text-gray-800'
                                                    }`}>
                                                        {pkg.amount > 10 ? 'Staking' : 'Base'}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid font-semibold text-red-600`}>
                                                    {formatNumber(pkg.amount)} USDT
                                                </td>
                                                <td className={`${tableCellStyles} w-[15%] border-x-0 border-theme-gray-100 border-solid`}>
                                                    {formatParticipationTime(pkg.date_start)}
                                                </td>
                                                <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid font-semibold`}>
                                                    {pkg.status === 'running' ? (
                                                        <span className="text-gray-500">--</span>
                                                    ) : (
                                                        <span className="text-green-600">{formatNumber(getRewardAmount(pkg))} USDT</span>
                                                    )}
                                                </td>
                                                <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        pkg.status === 'running' 
                                                            ? 'bg-gray-400 text-white' 
                                                            : pkg.status === 'pending-claim'
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-gray-500 text-white'
                                                    }`}>
                                                        {getStatusText(pkg.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
