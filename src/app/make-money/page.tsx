'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Loader2, Calendar, DollarSign, Target, Clock, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import CustomSelect from '@/components/CustomSelect'
import { Skeleton } from '@/ui/skeleton'
import Modal from '@/components/Modal'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
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
    getCurrentStakingWithMissions,
    calculateStaking,
    type StakingPackage,
    type JoinStakingRequest,
    type CurrentStakingResponse,
    type StakingHistoriesResponse,
    type MissionClaimResponse,
    type MissionNowResponse,
    type CurrentStakingWithMissionsResponse,
    type CalculateStakingResponse,
    type Mission,
} from '@/services/StakingService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function MakeMoneyPage() {
    const queryClient = useQueryClient()
    const tableRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()
    const { t } = useLang()

    // Form state
    const [stakingType, setStakingType] = useState<'1d' | '7d' | '30d'>('1d')
    const [stakingAmount, setStakingAmount] = useState<string>('')
    const [usdtCoinId, setUsdtCoinId] = useState<string>('')
    const [selectedCoin, setSelectedCoin] = useState<string>('')
    const [isStakingModalOpen, setIsStakingModalOpen] = useState<boolean>(false)
    const [isBaseConfirmModalOpen, setIsBaseConfirmModalOpen] = useState<boolean>(false)
    const [isStakingConfirmModalOpen, setIsStakingConfirmModalOpen] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<Date>(new Date())

    // ==================== React Query Hooks ====================

    // 1. Get Coins to find USDT
    const { data: coinsResponse, isLoading: isLoadingCoins, error: coinsError, isError: isCoinsError } = useQuery<ListCoinsResponse>({
        queryKey: ['coins'],
        queryFn: async () => {
            const response = await getListCoins()
            return response
        },
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 5 * 60 * 1000, // Coins ít thay đổi, cache 5 phút
    })

    // 2. Get Balance
    const { data: balanceResponse, isLoading: isLoadingBalance, refetch: refetchBalance, error: balanceError, isError: isBalanceError } = useQuery<BalanceResponse>({
        queryKey: ['balance', selectedCoin],
        queryFn: async () => {
            if (!selectedCoin) return null as any
            const response = await getBalance(Number(selectedCoin))
            return response
        },
        enabled: !!selectedCoin && selectedCoin !== '',
        refetchOnWindowFocus: false, // Tắt auto refetch khi focus, chỉ refetch khi cần (sau mutation)
        staleTime: 30 * 1000, // Cache 30 giây
    })

    // 3. Get Current Staking
    const { data: currentStakingResponse, isLoading: isLoadingCurrentStaking, refetch: refetchCurrentStaking, error: currentStakingError, isError: isCurrentStakingError } = useQuery<CurrentStakingResponse>({
        queryKey: ['current-staking'],
        queryFn: getCurrentStaking,
        retry: false, // Don't retry on 404
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 1 * 60 * 1000, // Cache 1 phút
    })

    // 4. Get Staking Histories
    const { data: historiesResponse, isLoading: isLoadingHistories, refetch: refetchHistories, error: historiesError, isError: isHistoriesError } = useQuery<StakingHistoriesResponse>({
        queryKey: ['staking-histories'],
        queryFn: getStakingHistories,
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 2 * 60 * 1000, // Cache 2 phút
    })

    // 5. Get Current Staking with Missions
    // Query khi đã load xong currentStaking (không cần kiểm tra status, để API tự xử lý 404)
    const { data: stakingWithMissionsResponse, isLoading: isLoadingStakingWithMissions, refetch: refetchStakingWithMissions, error: stakingWithMissionsError, isError: isStakingWithMissionsError } = useQuery<CurrentStakingWithMissionsResponse>({
        queryKey: ['current-staking-with-missions'],
        queryFn: getCurrentStakingWithMissions,
        enabled: !isLoadingCurrentStaking, // Chỉ cần đợi currentStaking load xong, không cần kiểm tra status
        refetchInterval: 30000, // Refetch mỗi 30 giây
        refetchOnWindowFocus: false,
        retry: false, // Không retry nếu 404 (không có staking)
    })

    // Get current staking from either source
    const currentStaking = useMemo(() => {
        // Ưu tiên dùng staking_lock từ API mới nếu có, fallback về currentStakingResponse
        return stakingWithMissionsResponse?.data?.staking_lock || currentStakingResponse?.data || null
    }, [stakingWithMissionsResponse, currentStakingResponse])

    // Get missions list - sorted by date (newest first)
    const missions = useMemo(() => {
        const missionsList = stakingWithMissionsResponse?.data?.missions || []
        // Sort by date descending (newest first)
        return [...missionsList].sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateB - dateA
        })
    }, [stakingWithMissionsResponse])

    // 6. Get Mission Progress (keep for backward compatibility if needed)
    const { data: missionNowResponse, isLoading: isLoadingMission, refetch: refetchMissionNow, error: missionError, isError: isMissionError } = useQuery<MissionNowResponse>({
        queryKey: ['mission-now'],
        queryFn: getMissionNow,
        enabled: !!currentStaking && currentStaking.status === 'running' && !stakingWithMissionsResponse, // Chỉ query khi không có staking-with-missions
        refetchInterval: 30000, // Refetch mỗi 30 giây để cập nhật countdown
        refetchOnWindowFocus: false,
        retry: false, // Không retry nếu 400 (không có staking)
    })

    // Debounced staking amount for calculator API - chỉ gọi API sau 2s khi user ngừng nhập
    const [debouncedStakingAmount, setDebouncedStakingAmount] = useState<string>('')
    useEffect(() => {
        // Reset debounced value nếu input rỗng
        if (!stakingAmount || stakingAmount.trim() === '') {
            setDebouncedStakingAmount('')
            return
        }

        // Chỉ debounce khi có giá trị hợp lệ
        const timer = setTimeout(() => {
            setDebouncedStakingAmount(stakingAmount)
        }, 1000) // 2 seconds delay - tránh gọi API liên tục khi đang nhập

        return () => clearTimeout(timer)
    }, [stakingAmount])

    // 7. Calculate Staking (preview) - với debounce 2s
    const { data: calculatorResponse, isLoading: isLoadingCalculator } = useQuery<CalculateStakingResponse>({
        queryKey: ['staking-calculator', stakingType, debouncedStakingAmount],
        queryFn: () => calculateStaking({
            type: stakingType,
            amount: Number(debouncedStakingAmount)
        }),
        enabled: !!debouncedStakingAmount &&
            !isNaN(Number(debouncedStakingAmount)) &&
            Number(debouncedStakingAmount) > 0 &&
            !!stakingType,
        refetchOnWindowFocus: false,
        staleTime: 1 * 1000, // Cache 3 giây
        retry: false,
    })

    // 7b. Calculate Staking for confirm modal (không debounce, chỉ khi modal mở)
    const { data: calculatorConfirmResponse, isLoading: isLoadingCalculatorConfirm } = useQuery<CalculateStakingResponse>({
        queryKey: ['staking-calculator-confirm', stakingType, stakingAmount],
        queryFn: () => calculateStaking({
            type: stakingType,
            amount: Number(stakingAmount)
        }),
        enabled: isStakingConfirmModalOpen &&
            !!stakingAmount &&
            !isNaN(Number(stakingAmount)) &&
            Number(stakingAmount) > 0 &&
            !!stakingType,
        refetchOnWindowFocus: false,
        staleTime: 3 * 1000, // Cache 30 giây
        retry: false,
    })

    // 8. Join Base Mutation
    const joinBaseMutation = useMutation({
        mutationFn: joinBasePackage,
        onSuccess: (data) => {
            const message = data?.message || t('staking.joinBaseSuccess')
            toast.success(message)
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('staking.joinBaseError')

            // Check for specific error messages and use translations
            if (message.includes('User already has an active staking lock')) {
                toast.error(t('staking.userAlreadyHasActiveStaking'))
                return
            }
            if (message.includes('USDT coin not found')) {
                toast.error(t('staking.usdtCoinNotFound'))
                return
            }
            if (message.includes('USDT wallet not found for user')) {
                toast.error(t('staking.usdtWalletNotFound'))
                return
            }
            if (message.includes('USDT balance must be less than $10')) {
                toast.error(t('staking.usdtBalanceMustBeLessThan10'))
                return
            }
            if (message.includes('Failed to join base staking')) {
                toast.error(t('staking.failedToJoinBase'))
                return
            }

            // Fallback to show the original message if no translation found
            toast.error(message)
        }
    })

    // 9. Join Staking Mutation
    const joinStakingMutation = useMutation({
        mutationFn: (data: JoinStakingRequest) => joinStakingPackage(data),
        onSuccess: (response) => {
            const message = response?.message || t('staking.joinStakingSuccess')
            toast.success(message)
            setStakingAmount('')
            setDebouncedStakingAmount('')
            setIsStakingModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('staking.joinStakingError')

            // Check for specific error messages and use translations
            if (message.includes('Type must be one of: 1d, 7d, 30d')) {
                toast.error(t('staking.typeMustBeOneOf'))
                return
            }
            if (message.includes('Amount must be greater than 0')) {
                toast.error(t('staking.amountMustBeGreaterThan0'))
                return
            }
            if (message.includes('Amount must not exceed 3500')) {
                toast.error(t('staking.amountMustNotExceed3500'))
                return
            }
            if (message.includes('User already has an active staking lock')) {
                toast.error(t('staking.userAlreadyHasActiveStaking'))
                return
            }
            if (message.includes('USDT coin not found')) {
                toast.error(t('staking.usdtCoinNotFound'))
                return
            }
            if (message.includes('USDT balance must be greater than or equal to $10')) {
                toast.error(t('staking.usdtBalanceMustBeGreaterOrEqual10'))
                return
            }
            if (message.includes('Insufficient balance')) {
                toast.error(t('staking.insufficientBalance'))
                return
            }
            if (message.includes('Invalid staking type')) {
                toast.error(t('staking.invalidStakingType'))
                return
            }
            if (message.includes('Failed to join staking')) {
                toast.error(t('staking.failedToJoinStaking'))
                return
            }

            // Fallback to show the original message if no translation found
            toast.error(message)
        }
    })

    // 9. Claim Mission Reward Mutation
    const claimMissionMutation = useMutation({
        mutationFn: claimMissionReward,
        onSuccess: async (data: MissionClaimResponse) => {
            const apiMessage = data?.message
            const rewardAmount = formatNumber(data.data.total_reward)
            const successMessage = apiMessage
                ? `${apiMessage} ${t('makeMoney.reward')}: ${rewardAmount} USDT`
                : `${t('makeMoney.claim')} ${t('common.success')}! ${t('makeMoney.reward')}: ${rewardAmount} USDT`
            toast.success(successMessage)

            // Invalidate tất cả các queries liên quan
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            queryClient.invalidateQueries({ queryKey: ['mission-now'] })
            queryClient.invalidateQueries({ queryKey: ['balance', selectedCoin] })

            // Refetch trực tiếp tất cả các queries để đảm bảo dữ liệu được cập nhật ngay lập tức
            await Promise.all([
                refetchBalance(),
                refetchCurrentStaking(),
                refetchHistories(),
            ])

            // Kiểm tra trạng thái staking sau khi claim
            const updatedStaking = data.data.staking_lock
            if (updatedStaking && updatedStaking.status === 'running') {
                // Nếu staking vẫn đang running, refetch để cập nhật dữ liệu mới
                refetchStakingWithMissions()
                refetchMissionNow()
            } else {
                // Nếu staking đã kết thúc hoặc không còn active, clear dữ liệu để tránh hiển thị dữ liệu cũ
                queryClient.setQueryData(['current-staking-with-missions'], null)
                queryClient.setQueryData(['mission-now'], null)

                // Thử refetch để kiểm tra xem còn staking active không
                // Nếu API trả về 404, query sẽ tự động set data thành undefined
                try {
                    await refetchStakingWithMissions()
                } catch (error: any) {
                    // 404 là expected khi không còn staking active
                    if (error?.response?.status === 404) {
                        queryClient.setQueryData(['current-staking-with-missions'], null)
                    }
                }

                try {
                    await refetchMissionNow()
                } catch (error: any) {
                    // 400 là expected khi không còn staking active
                    if (error?.response?.status === 400) {
                        queryClient.setQueryData(['mission-now'], null)
                    }
                }
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('staking.claimError')

            // Check for specific error messages and use translations
            if (message.includes('You have already claimed the reward')) {
                toast.error(t('staking.alreadyClaimed'))
                return
            }
            if (message.includes('You have not completed the mission')) {
                toast.error(t('staking.notCompletedMission'))
                return
            }
            if (message.includes('No active staking lock found')) {
                toast.error(t('staking.noActiveStakingLock'))
                return
            }
            if (message.includes('Can only claim after 00:05:00 UTC of the day after staking ends')) {
                toast.error(t('staking.canOnlyClaimAfterTime'))
                return
            }
            if (message.includes('Invalid staking lock type')) {
                toast.error(t('staking.invalidStakingLockType'))
                return
            }
            if (message.includes('USDT coin not found')) {
                toast.error(t('staking.usdtCoinNotFound'))
                return
            }
            if (message.includes('USDT wallet not found for user')) {
                toast.error(t('staking.usdtWalletNotFound'))
                return
            }
            if (message.includes('Failed to claim mission')) {
                toast.error(t('staking.failedToClaimMission'))
                return
            }

            // Fallback to show the original message if no translation found
            toast.error(message)
        }
    })

    // ==================== Initialize Coin ====================
    useEffect(() => {
        if (coinsResponse?.data && coinsResponse.data.length > 0 && !selectedCoin) {
            // Find USDT coin
            const usdtCoin = coinsResponse.data.find(
                (coin: Coin) => coin.coin_symbol?.toUpperCase() === 'USDT'
            ) || coinsResponse.data[0] // Fallback to first coin if USDT not found

            if (usdtCoin?.coin_id) {
                const coinId = usdtCoin.coin_id.toString()
                setSelectedCoin(coinId)
                setUsdtCoinId(coinId) // Keep for backward compatibility
            }
        }
    }, [coinsResponse, selectedCoin])

    // Update current time every second to check claim availability
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000) // Update every second for accurate countdown

        return () => clearInterval(interval)
    }, [])

    // Handle errors from queries and show notifications
    useEffect(() => {
        if (isCoinsError && coinsError) {
            const error: any = coinsError
            const message = error?.response?.data?.message || t('makeMoney.errors.loadCoinsError')
            toast.error(message)
        }
    }, [isCoinsError, coinsError, t])

    useEffect(() => {
        if (isBalanceError && balanceError) {
            const error: any = balanceError
            const message = error?.response?.data?.message || t('makeMoney.errors.loadBalanceError')
            toast.error(message)
        }
    }, [isBalanceError, balanceError, t])

    useEffect(() => {
        if (isCurrentStakingError && currentStakingError) {
            const error: any = currentStakingError
            // 404 is expected when no active staking exists, reset related data
            if (error?.response?.status === 404) {
                // Reset missions data vì không còn staking active
                queryClient.setQueryData(['current-staking-with-missions'], null)
                queryClient.setQueryData(['mission-now'], null)
                return
            }
            const message = error?.response?.data?.message || t('makeMoney.errors.loadStakingError')
            toast.error(message)
        }
    }, [isCurrentStakingError, currentStakingError, queryClient])

    useEffect(() => {
        if (isHistoriesError && historiesError) {
            const error: any = historiesError
            const message = error?.response?.data?.message || t('makeMoney.errors.loadHistoriesError')
            toast.error(message)
        }
    }, [isHistoriesError, historiesError, t])

    useEffect(() => {
        if (isStakingWithMissionsError && stakingWithMissionsError) {
            const error: any = stakingWithMissionsError
            // 404 is expected when no active staking exists, reset data to null
            if (error?.response?.status === 404) {
                queryClient.setQueryData(['current-staking-with-missions'], null)
                return
            }
            const message = error?.response?.data?.message || t('makeMoney.errors.loadMissionError')
            toast.error(message)
        }
    }, [isStakingWithMissionsError, stakingWithMissionsError, t, queryClient])

    useEffect(() => {
        if (isMissionError && missionError) {
            const error: any = missionError
            // 400 is expected when no active staking exists, reset data to null
            if (error?.response?.status === 400) {
                queryClient.setQueryData(['mission-now'], null)
                return
            }
            const message = error?.response?.data?.message || t('makeMoney.errors.loadMissionError')
            toast.error(message)
        }
    }, [isMissionError, missionError, t, queryClient])

    // ==================== Computed Values ====================

    const coinOptions = useMemo(() => {
        if (!coinsResponse?.data || !Array.isArray(coinsResponse.data)) {
            return []
        }

        return coinsResponse.data.map((coin: Coin) => ({
            value: coin.coin_id?.toString() || '',
            label: coin.coin_symbol || coin.coin_name || 'Unknown'
        }))
    }, [coinsResponse])

    // Get selected coin info
    const selectedCoinInfo = useMemo(() => {
        if (!selectedCoin || !coinsResponse?.data) return null
        return coinsResponse.data.find((c: Coin) => c.coin_id?.toString() === selectedCoin)
    }, [selectedCoin, coinsResponse])

    const usdtBalance = useMemo(() => {
        return balanceResponse?.data?.balance || 0
    }, [balanceResponse])

    // Calculate total balance for base package (balance + balance_gift)
    const totalBaseBalance = useMemo(() => {
        const balance = balanceResponse?.data?.balance || 0
        const balanceGift = balanceResponse?.data?.balance_gift || 0
        return balance + balanceGift
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

    // Format balance number
    const formatBalance = (balance: number) => {
        const balanceFormatted = parseFloat(balance.toFixed(2))
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(balanceFormatted)
    }

    // Get reward amount - ưu tiên real_reward, fallback về estimated_reward hoặc tính toán
    const getRewardAmount = (staking: StakingPackage): number => {
        return staking?.total_usd - staking?.amount || 0
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                        {t('makeMoney.statusRunning')}
                    </span>
                )
            case 'pending-claim':
                return (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium">
                        {t('makeMoney.statusPendingClaim')}
                    </span>
                )
            case 'ended':
                return (
                    <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">
                        {t('makeMoney.statusEnded')}
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
                return t('makeMoney.basePackage')
            case '1d':
                return t('makeMoney.oneDay')
            case '7d':
                return t('makeMoney.sevenDays')
            case '30d':
                return t('makeMoney.thirtyDays')
            default:
                return type
        }
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
        if (milliseconds <= 0) return t('makeMoney.canWatchNow')

        const totalSeconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60

        if (minutes > 0) {
            return `${minutes} ${t('makeMoney.minute')} ${seconds} ${t('makeMoney.second')}`
        }
        return `${seconds} ${t('makeMoney.second')}`
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
            toast.error(t('makeMoney.errors.insufficientBalance'))
            return
        }
        if (currentStaking) {
            toast.error(t('makeMoney.errors.stakingRunning'))
            return
        }

        const amount = parseFloat(stakingAmount)
        if (!amount || amount <= 0) {
            toast.error(t('makeMoney.errors.invalidAmount'))
            return
        }
        if (amount > 3500) {
            toast.error(t('makeMoney.errors.amountExceeded'))
            return
        }
        if (amount > usdtBalance) {
            toast.error(t('makeMoney.errors.balanceInsufficient'))
            return
        }

        // Mở modal xác nhận thay vì submit trực tiếp
        setIsStakingConfirmModalOpen(true)
    }

    const handleConfirmJoinStaking = () => {
        const amount = parseFloat(stakingAmount)
        setIsStakingConfirmModalOpen(false)
        setIsStakingModalOpen(false)
        setDebouncedStakingAmount('')
        joinStakingMutation.mutate({
            type: stakingType,
            amount: amount
        })
    }

    const handleCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const coinId = e.target.value
        setSelectedCoin(coinId)
        setUsdtCoinId(coinId) // Sync with usdtCoinId for balance query
    }

    const stakingTypeOptions = [
        { value: '1d', label: t('makeMoney.oneDay') },
        { value: '7d', label: t('makeMoney.sevenDays') },
        { value: '30d', label: t('makeMoney.thirtyDays') },
    ]

    // Table styles (matching wallet page)
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase bg-transparent "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 dark:text-gray-300 bg-transparent border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    return (
        <div className='w-full min-h-svh flex py-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
            <div className='w-full max-w-7xl'>
                {/* Header Section */}
                {currentStaking && (
                    <div className='flex flex-col items-center justify-center'>
                        <div className='flex items-end justify-center mb-2 sm:mb-4 gap-2 sm:gap-4'>
                            <div className='flex flex-col items-center mx-2 sm:mx-4'>
                                <h1 className='text-2xl md:text-3xl font-semibold   text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]'>{currentStaking && currentStaking?.amount > 10 ? t('makeMoney.stakingTitle') : t('makeMoney.baseTitle')}</h1>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Staking Section */}
                {isLoadingCurrentStaking ? (
                    <div className='mb-6 sm:mb-8'>
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ) : currentStaking ? (
                    <div className='mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#FE645F] bg-transparent'>
                        <div className='grid grid-cols-1 md:grid-cols-2 w-full md:max-w-3xl mx-auto gap-3 sm:gap-y-4 sm:gap-x-10 mb-3 sm:mb-4'>
                            {/* Right Column */}
                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.stakingType')}:</p>
                                <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{getTypeDurationLabel(currentStaking.type)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.status')}:</p>
                                <p className='text-xs sm:text-sm font-medium text-red-600 dark:text-[#FE645F]'>{getStatusText(currentStaking.status)}</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.time')}:</p>
                                <p className='text-xs sm:text-sm font-medium text-red-600 dark:text-[#FE645F]'>{formatDateOnly(currentStaking.date_start)} - {formatDateOnly(currentStaking.date_end)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.amount')}:</p>
                                <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{currentStaking.amount} USDT</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md flex-wrap'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.estimatedReward')}:</p>
                                <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                    <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{currentStaking.estimated_reward} USDT</p>
                                </div>
                            </div>

                            <div className='p-2 sm:px-3 sm:py-2 bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 sm:gap-3 md:justify-start justify-between shadow-md flex-wrap'>
                                <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-1'>{t('makeMoney.earnedAmount')}:</p>
                                <div className='flex gap-1 sm:gap-2 items-center flex-wrap'>
                                    <p className='text-xs sm:text-sm font-semibold text-red-600 dark:text-[#FE645F]'>{(currentStaking.real_reward || 0).toFixed(3)} USDT</p>
                                </div>
                            </div>
                        </div>
                        {/* Tasks & Missions - Hiển thị khi có dữ liệu staking-with-missions hoặc mission-now */}
                        {stakingWithMissionsResponse?.data ? (
                            <>
                                {/* Video Views & Devices Info */}
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-10 w-full md:max-w-3xl mx-auto mb-3 sm:mb-4'>
                                    <div className='p-2 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/55 rounded-lg border border-blue-200 dark:border-blue-700'>
                                        <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                            <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium'>{t('makeMoney.videoViews')}</p>
                                            <p className='text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300'>
                                                {currentStaking?.turn_setting * (currentStaking?.devices_setting || 0) || 0}
                                            </p>
                                        </div>
                                        <p className='text-[10px] sm:text-xs text-blue-500 dark:text-blue-400'>
                                            {t('makeMoney.videoViewsDescription')}
                                        </p>
                                    </div>
                                    <div className='p-2 sm:p-3 md:p-4 bg-green-50 dark:bg-green-900/65 rounded-lg border border-green-200 dark:border-green-700'>
                                        <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                            <p className='text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium'>{t('makeMoney.devices')}</p>
                                            <p className='text-xs sm:text-sm font-semibold text-green-900 dark:text-green-300'>
                                                {currentStaking?.devices_setting || 0}
                                            </p>
                                        </div>
                                        <p className='text-[10px] sm:text-xs text-green-500 dark:text-green-400'>
                                            {t('makeMoney.devicesDescription')}
                                        </p>
                                    </div>
                                </div>

                                {currentStaking && (
                                    <div className='mb-6 sm:mb-8'>
                                        <div className='max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-4 sm:p-6 shadow-md'>
                                            {(() => {
                                                const startDate = new Date(currentStaking.date_start)
                                                const endDate = new Date(currentStaking.date_end)

                                                // Normalize dates to just date part (remove time)
                                                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                                                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

                                                const year = startDate.getFullYear()
                                                const month = startDate.getMonth()

                                                // Get first day of month and number of days
                                                const firstDay = new Date(year, month, 1)
                                                const lastDay = new Date(year, month + 1, 0)
                                                const daysInMonth = lastDay.getDate()
                                                const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

                                                // Vietnamese day names
                                                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                                                const monthNames = [
                                                    t('makeMoney.months.1'), t('makeMoney.months.2'), t('makeMoney.months.3'), t('makeMoney.months.4'),
                                                    t('makeMoney.months.5'), t('makeMoney.months.6'), t('makeMoney.months.7'), t('makeMoney.months.8'),
                                                    t('makeMoney.months.9'), t('makeMoney.months.10'), t('makeMoney.months.11'), t('makeMoney.months.12')
                                                ]

                                                // Get missions from stakingWithMissionsResponse
                                                const missionsList = stakingWithMissionsResponse?.data?.missions || []

                                                // Helper to format date as YYYY-MM-DD
                                                const formatDateString = (y: number, m: number, d: number): string => {
                                                    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                                }

                                                // Helper to find mission by date
                                                const findMissionByDate = (day: number): Mission | undefined => {
                                                    const dateString = formatDateString(year, month, day)
                                                    return missionsList.find(mission => mission.date === dateString)
                                                }

                                                // Helper to check if date is in range
                                                const isDateInRange = (day: number): boolean => {
                                                    const currentDate = new Date(year, month, day)
                                                    return currentDate >= startDateOnly && currentDate <= endDateOnly
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

                                                // Create calendar days array
                                                const calendarDays: (number | null)[] = []
                                                // Add empty cells for days before month starts
                                                for (let i = 0; i < startingDayOfWeek; i++) {
                                                    calendarDays.push(null)
                                                }
                                                // Add all days of the month
                                                for (let day = 1; day <= daysInMonth; day++) {
                                                    calendarDays.push(day)
                                                }

                                                return (
                                                    <div>
                                                        <h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center'>
                                                            {monthNames[month]} {year}
                                                        </h3>
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

                                                                                // Determine background color based on mission status
                                                                                const getBackgroundColor = () => {
                                                                                    if (day === null) return 'bg-gray-50 dark:bg-gray-800/30'
                                                                                    if (isStart || isEnd) return 'bg-gray-400 dark:bg-gray-500'
                                                                                    if (mission) {
                                                                                        // Ngày có mission: màu theo status
                                                                                        return mission.status === 'success'
                                                                                            ? '!bg-green-100 !dark:bg-green-900/30'
                                                                                            : '!bg-orange-100 !dark:bg-orange-900/30'
                                                                                    }
                                                                                    if (inRange) {
                                                                                        // Khoảng thời gian staking nhưng chưa có dữ liệu
                                                                                        return 'bg-gray-400 dark:bg-gray-500'
                                                                                    }
                                                                                    return 'bg-white dark:bg-gray-800'
                                                                                }

                                                                                const bgColor = getBackgroundColor()
                                                                                const hasMission = mission !== undefined
                                                                                const isSuccess = mission?.status === 'success'
                                                                                const isOut = mission?.status === 'out'

                                                                                // Determine text color
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
                                                                                            <div className={`flex py-1 flex-col h-full justify-center items-center gap-0.5 sm:gap-1 ${mission?.status === 'success'
                                                                                                ? 'border-green-500 border-solid'
                                                                                                : mission?.status === 'out'
                                                                                                    ? 'border-red-500 border-solid'
                                                                                                    : ''} rounded-lg`}>
                                                                                                <span className={`text-xs sm:text-sm font-semibold ${textColor}`}>
                                                                                                    {day}
                                                                                                </span>
                                                                                                {mission && (
                                                                                                    <div className='text-[9px] sm:text-[10px] leading-tight'>
                                                                                                        {/* <div className={`font-medium ${textColor}`}>
                                                                                            {mission.turn}/{currentStaking?.turn_setting || 0}
                                                                                        </div> */}
                                                                                                        {mission.reward !== undefined && (
                                                                                                            <div className={`mt-0.5 font-semibold ${isSuccess
                                                                                                                    ? 'text-green-600 dark:text-green-400'
                                                                                                                    : 'text-orange-600 dark:text-orange-400'
                                                                                                                }`}>
                                                                                                                + ${mission.reward.toFixed(0)}
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
                                    </div>
                                )}

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
                                                                {mission.turn} / {currentStaking?.turn_setting || 0}
                                                            </span>
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

                                            {/* Scrollable Body */}
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
                                                                        {mission.turn} / {currentStaking?.turn_setting || 0}
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
                            </>
                        ) : missionNowResponse?.data ? (
                            <div className='grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full md:max-w-3xl mx-auto'>
                                <div className='p-2 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/55 rounded-lg border border-blue-200 dark:border-blue-700'>
                                    <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                        <p className='text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium'>{t('makeMoney.videoViews')}</p>
                                        {missionProgress ? (
                                            <p className='text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300'>
                                                {missionProgress.completed}/{missionProgress.total}
                                            </p>
                                        ) : (
                                            <p className='text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300'>
                                                {missionNowResponse.data.turn_setting}
                                            </p>
                                        )}
                                    </div>
                                    {missionProgress ? (
                                        <>
                                            <p className='text-[10px] sm:text-xs text-blue-500 dark:text-blue-400'>
                                                {missionProgress.isCompleted ? `✅ ${t('makeMoney.completed')}` : `${t('makeMoney.remaining')}: ${missionProgress.total - missionProgress.completed} video`}
                                            </p>
                                            {!missionProgress.canWatchNext && missionProgress.timeRemaining > 0 && (
                                                <p className='text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 mt-0.5 sm:mt-1'>
                                                    ⏱️ {t('makeMoney.canWatchNext')}: {formatTimeRemaining(missionProgress.timeRemaining)}
                                                </p>
                                            )}
                                            {missionProgress.canWatchNext && !missionProgress.isCompleted && (
                                                <p className='text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1'>
                                                    ✅ {t('makeMoney.canWatchNow')}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Skeleton className='h-2 w-full' />
                                    )}
                                </div>
                                <div className='p-2 sm:p-3 md:p-4 bg-green-50 dark:bg-green-900/65 rounded-lg border border-green-200 dark:border-green-700'>
                                    <div className='flex items-center justify-between mb-1 sm:mb-2'>
                                        <p className='text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium'>{t('makeMoney.devices')}</p>
                                        <p className='text-xs sm:text-sm font-semibold text-green-900 dark:text-green-300'>
                                            {missionNowResponse.data.devices}
                                        </p>
                                    </div>
                                    <p className='text-[10px] sm:text-xs text-green-500 dark:text-green-400'>
                                        {t('makeMoney.devicesDescription')}
                                    </p>
                                </div>
                            </div>
                        ) : isLoadingStakingWithMissions || isLoadingMission ? (
                            <div className='grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full md:max-w-[50vw] mx-auto'>
                                <Skeleton className='h-20 sm:h-24 w-full rounded-lg' />
                                <Skeleton className='h-20 sm:h-24 w-full rounded-lg' />
                            </div>
                        ) : null}
                        <div className='flex flex-col items-center mt-3 sm:mt-6 gap-2'>
                            <Button
                                onClick={() => claimMissionMutation.mutate()}
                                disabled={claimMissionMutation.isPending || !canClaimReward(currentStaking)}
                                className='w-full sm:w-[200px] text-center bg-theme-red-200 text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-9 sm:h-10 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer'
                            >
                                {claimMissionMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin' />
                                        {t('makeMoney.processing')}
                                    </>
                                ) : (
                                    t('makeMoney.claim')
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Join Package Section */
                    <>
                        {/* Balance Section */}
                        <div className='flex flex-col items-center justify-center mb-4 sm:mb-6'>
                            {isMobile ? (
                                // Mobile: Stack vertically, compact
                                <div className='flex flex-col items-center w-full'>
                                    {/* <div className='flex items-center gap-2 mb-2'>
                                        <span className='text-xs font-medium text-theme-red-100 dark:text-[#FE645F]'>{t('wallet.coin')}:</span>
                                        {isLoadingCoins ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <CustomSelect
                                                id="coin"
                                                value={selectedCoin}
                                                onChange={handleCoinChange}
                                                options={coinOptions}
                                                placeholder={t('makeMoney.selectCoinPlaceholder')}
                                                disabled={isLoadingCoins}
                                                className="w-24 h-8 text-xs"
                                            />
                                        )}
                                    </div> */}
                                    <div className='flex items-center gap-2'>
                                        {isLoadingBalance ? (
                                            <Skeleton className="h-6 w-40" />
                                        ) : balanceResponse?.data ? (
                                            <span className='text-lg sm:text-xl md:text-2xl font-bold text-center text-pink-500  '>
                                                {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || 'USDT'}
                                            </span>
                                        ) : (
                                            <span className='text-lg sm:text-xl md:text-2xl font-bold text-center text-pink-500  '>
                                                0.00 {selectedCoinInfo?.coin_symbol || 'USDT'}
                                            </span>
                                        )}
                                    </div>
                                    {balanceResponse?.data && (balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-xs text-gray-600 dark:text-gray-300 mt-1'>
                                            ({t('makeMoney.gift')}: {formatBalance(balanceResponse.data.balance_gift)} | {t('makeMoney.reward')}: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                // Desktop: Original layout
                                <div className='flex items-end justify-center mb-3'>
                                    <div className='flex flex-col items-center mx-4'>
                                        {/* <div className='flex items-center gap-2 mb-4'>
                                            <span className='text-sm font-medium text-theme-red-100 dark:text-[#FE645F]'>{t('makeMoney.selectCoin')}:</span>
                                            {isLoadingCoins ? (
                                                <Skeleton className="h-8 w-24" />
                                            ) : (
                                                <CustomSelect
                                                    id="coin"
                                                    value={selectedCoin}
                                                    onChange={handleCoinChange}
                                                    options={coinOptions}
                                                    placeholder={t('makeMoney.selectCoinPlaceholder')}
                                                    disabled={isLoadingCoins}
                                                    className="w-24 text-sm"
                                                />
                                            )}
                                        </div> */}
                                        {isLoadingBalance ? (
                                            <Skeleton className="h-8 w-48" />
                                        ) : balanceResponse?.data ? (
                                            <div className='flex flex-col items-center bg-theme-pink-100 dark:bg-transparent py-3 px-4 rounded-full'>
                                                <span className='text-2xl font-bold text-center text-pink-500  '>
                                                    {t('makeMoney.balance')}: {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || 'USDT'}
                                                </span>
                                                {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                                    <span className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                                                        ({t('makeMoney.gift')}: {formatBalance(balanceResponse.data.balance_gift)} USDT | {t('makeMoney.reward')}: {formatBalance(balanceResponse.data.balance_reward)} USDT)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className='text-2xl font-bold text-center text-pink-500  '>
                                                {t('makeMoney.balance')}: 0.00 {selectedCoinInfo?.coin_symbol || 'USDT'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className='mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 bg-transparent rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 w-full md:w-[50vw] mx-auto'>
                            {/* Gói Base - Luôn hiển thị */}
                            <div className='py-3 sm:py-4 px-4 sm:px-6 md:px-8 bg-transparent border border-theme-gray-100 dark:border-[#FE645F] border-solid flex flex-col items-center justify-center flex-1 gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[230px] rounded-xl'>
                                <h3 className='text-2xl sm:text-3xl md:text-4xl font-semibold text-black dark:text-white mb-1 sm:mb-2 text-center'>{t('makeMoney.basePackage')}</h3>
                                <span className='text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 mb-1 sm:mb-2'>{t('makeMoney.oneDay')}</span>
                                <Button
                                    onClick={handleJoinBase}
                                    disabled={joinBaseMutation.isPending || isBaseDisabled}
                                    className='w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-theme-red-200 dark:text-[#FE645F] text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-10 sm:h-11 md:h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer'
                                >
                                    {joinBaseMutation.isPending ? (
                                        <>
                                            <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin' />
                                            {t('makeMoney.processing')}
                                        </>
                                    ) : (
                                        t('makeMoney.joinBase')
                                    )}
                                </Button>
                            </div>

                            {/* Gói Staking - Luôn hiển thị */}
                            <div className='py-3 sm:py-4 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 border border-green-200 flex flex-col items-center justify-center flex-1 gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[230px] rounded-xl'>
                                <h3 className='text-2xl sm:text-3xl md:text-4xl text-center font-semibold text-white mb-1 sm:mb-2'>{t('makeMoney.stakingTitle')}</h3>
                                <span className='text-xs sm:text-sm text-white mb-1 sm:mb-2'>{t('makeMoney.oneDay')} / {t('makeMoney.sevenDays')} / {t('makeMoney.thirtyDays')}</span>
                                <Button
                                    onClick={() => setIsStakingModalOpen(true)}
                                    disabled={isStakingDisabled}
                                    className='w-full bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-theme-red-200 dark:text-[#FE645F] text-sm sm:text-base md:text-lg uppercase font-semibold rounded-full border-none h-10 sm:h-11 md:h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
                                >
                                    {t('makeMoney.joinStaking')}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Staking Modal */}
                <Modal
                    isOpen={isStakingModalOpen}
                    onClose={() => {
                        setIsStakingModalOpen(false)
                        setStakingAmount('')
                        setDebouncedStakingAmount('')
                    }}
                    title={t('makeMoney.joinStakingModalTitle')}
                    maxWidth="max-w-[500px]"
                >
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-theme-red-200 dark:text-[#FE645F] mb-2'>
                                {t('makeMoney.packageType')}
                            </label>
                            <CustomSelect
                                id="staking-type-modal"
                                value={stakingType}
                                onChange={(e) => setStakingType(e.target.value as '1d' | '7d' | '30d')}
                                options={stakingTypeOptions}
                                placeholder={t('makeMoney.selectPackageType')}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-theme-red-200 dark:text-[#FE645F] mb-2'>
                                {t('makeMoney.amountLabel')}
                            </label>
                            <div className='flex items-center gap-2'>
                                <Input
                                    type="number"
                                    value={stakingAmount}
                                    onChange={(e) => setStakingAmount(e.target.value)}
                                    placeholder={t('makeMoney.amountPlaceholder')}
                                    min="0"
                                    max="3500"
                                    className="w-full rounded-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const maxAmount = Math.min(usdtBalance, 3500)
                                        setStakingAmount((Math.floor(maxAmount * 100) / 100).toFixed(2))
                                    }}
                                    className='text-sm min-w-[50px] underline-offset-2 bg-transparent border-none outline-none cursor-pointer font-medium text-theme-red-200 dark:text-[#FE645F] hover:underline'
                                >
                                    {t('makeMoney.useMax')}
                                </button>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {t('makeMoney.availableBalance')}: <span className='font-bold text-theme-red-200 dark:text-[#FE645F]'>{formatNumber(usdtBalance)} </span> USDT
                                </p>
                            </div>
                        </div>

                        {/* Calculator Preview */}
                        {stakingType && stakingAmount && parseFloat(stakingAmount) > 0 && (
                            <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                                {isLoadingCalculator ? (
                                    <div className='flex items-center gap-2'>
                                        <Loader2 className='w-4 h-4 animate-spin text-theme-red-200 dark:text-[#FE645F]' />
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            {t('makeMoney.calculating')}
                                        </span>
                                    </div>
                                ) : calculatorResponse?.data ? (
                                    <div className='space-y-3'>
                                        <h4 className='text-sm font-semibold text-theme-red-200 dark:text-[#FE645F] mb-2'>
                                            {t('makeMoney.previewInfo')}
                                        </h4>
                                        <div className='grid grid-cols-2 gap-3'>
                                            <div>
                                                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                                                    {t('makeMoney.videosPerDay')}
                                                </p>
                                                <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                                    {calculatorResponse.data.videos_per_day}
                                                </p>
                                            </div>
                                            <div>
                                                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                                                    {t('makeMoney.devices')}
                                                </p>
                                                <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                                    {calculatorResponse.data.devices}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsStakingModalOpen(false)
                                    setStakingAmount('')
                                    setDebouncedStakingAmount('')
                                }}
                                disabled={joinStakingMutation.isPending}
                                className='flex-1 bg-transparent border border-solid border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 cursor-pointer'
                            >
                                {t('makeMoney.cancel')}
                            </Button>
                            <Button
                                onClick={handleJoinStaking}
                                disabled={joinStakingMutation.isPending || !stakingAmount || parseFloat(stakingAmount || '0') <= 0}
                                className='flex-1 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                            >
                                {joinStakingMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        {t('makeMoney.processing')}
                                    </>
                                ) : (
                                    t('makeMoney.confirm')
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Base Confirmation Modal */}
                <Modal
                    isOpen={isBaseConfirmModalOpen}
                    onClose={() => setIsBaseConfirmModalOpen(false)}
                    showCloseButton={false}
                    maxWidth="max-w-[500px]"
                    className='p-4'
                >
                    <div className='space-y-4'>
                        <div className='text-center'>
                            <p className='text-base text-gray-700 dark:text-gray-300 mb-2'>
                                {t('makeMoney.baseConfirmMessage')} <span className='font-semibold text-theme-red-200 dark:text-[#FE645F]'>{t('makeMoney.basePackage')}</span>?
                            </p>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                                {t('makeMoney.baseConfirmDescription')} <span className='font-medium'>{t('makeMoney.baseConfirmDuration')}</span> {t('makeMoney.baseConfirmRequirement')}
                            </p>
                        </div>

                        {/* Thông tin số tiền sẽ stake */}
                        <div className='space-y-3'>
                            {/* Tổng số tiền sẽ stake */}
                            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>{t('makeMoney.amountLabelConfirm')}</span>
                                    <span className='text-base font-semibold text-blue-700 dark:text-blue-300'>
                                        {formatNumber(totalBaseBalance)} USDT
                                    </span>
                                </div>
                            </div>
                            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>{t('makeMoney.profitPercent')}:</span>
                                    <span className='text-base font-semibold text-blue-700 dark:text-blue-300'>
                                        0.2%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
                            <Button
                                variant="outline"
                                onClick={() => setIsBaseConfirmModalOpen(false)}
                                disabled={joinBaseMutation.isPending}
                                className='flex-1 bg-transparent border border-solid border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer '
                            >
                                {t('makeMoney.cancel')}
                            </Button>
                            <Button
                                onClick={handleConfirmJoinBase}
                                disabled={joinBaseMutation.isPending}
                                className='flex-1 bg-gray-100 dark:bg-gray-700 text-theme-red-200 dark:text-[#FE645F] hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer '
                            >
                                {joinBaseMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        {t('makeMoney.processing')}
                                    </>
                                ) : (
                                    t('makeMoney.confirm')
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Staking Confirmation Modal */}
                <Modal
                    isOpen={isStakingConfirmModalOpen}
                    onClose={() => setIsStakingConfirmModalOpen(false)}
                    title={t('makeMoney.stakingConfirmModalTitle')}
                    maxWidth="max-w-[500px]"
                >
                    <div className='space-y-4'>
                        <div className='space-y-3'>
                            <p className='text-base text-gray-700 dark:text-gray-300 mb-4 text-center'>
                                {t('makeMoney.stakingConfirmMessage')}
                            </p>

                            {/* Thông tin loại gói */}
                            <div className='p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>{t('makeMoney.packageTypeLabel')}</span>
                                    <span className='text-base font-semibold text-theme-red-200 dark:text-[#FE645F]'>
                                        {stakingTypeOptions.find(opt => opt.value === stakingType)?.label || stakingType}
                                    </span>
                                </div>
                            </div>

                            {/* Thông tin số tiền */}
                            <div className='p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>{t('makeMoney.amountLabelConfirm')}</span>
                                    <span className='text-base font-semibold text-theme-red-200 dark:text-[#FE645F]'>
                                        {formatNumber(parseFloat(stakingAmount || '0'))} USDT
                                    </span>
                                </div>
                            </div>

                            {/* Thông tin số dư khả dụng */}
                            <div className='p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>{t('makeMoney.availableBalanceLabel')}</span>
                                    <span className='text-base font-semibold text-gray-700 dark:text-gray-300'>
                                        {formatNumber(usdtBalance)} USDT
                                    </span>
                                </div>
                            </div>

                            {/* Thông tin số dư còn lại sau khi tham gia */}
                            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>{t('makeMoney.remainingBalance')}</span>
                                    <span className='text-base font-semibold text-blue-700 dark:text-blue-300'>
                                        {formatNumber(usdtBalance - parseFloat(stakingAmount || '0'))} USDT
                                    </span>
                                </div>
                            </div>

                            {/* Thông tin số video cần làm mỗi ngày và số thiết bị */}
                            {(calculatorConfirmResponse?.data || calculatorResponse?.data) && (
                                <>
                                    {isLoadingCalculatorConfirm ? (
                                        <div className='p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                                            <div className='flex items-center justify-center gap-2'>
                                                <Loader2 className='w-4 h-4 animate-spin text-theme-red-200 dark:text-[#FE645F]' />
                                                <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                    {t('makeMoney.calculating')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700'>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-sm font-medium text-green-600 dark:text-green-400'>
                                                        {t('makeMoney.videosPerDay')}
                                                    </span>
                                                    <span className='text-base font-semibold text-green-700 dark:text-green-300'>
                                                        {(calculatorConfirmResponse?.data || calculatorResponse?.data)?.videos_per_day}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Thông tin số thiết bị */}
                                            <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700'>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-sm font-medium text-purple-600 dark:text-purple-400'>
                                                        {t('makeMoney.devices')}
                                                    </span>
                                                    <span className='text-base font-semibold text-purple-700 dark:text-purple-300'>
                                                        {(calculatorConfirmResponse?.data || calculatorResponse?.data)?.devices}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
                            <Button
                                variant="outline"
                                onClick={() => setIsStakingConfirmModalOpen(false)}
                                disabled={joinStakingMutation.isPending}
                                className='flex-1 bg-transparent border border-solid border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer '
                            >
                                {t('makeMoney.cancel')}
                            </Button>
                            <Button
                                onClick={handleConfirmJoinStaking}
                                disabled={joinStakingMutation.isPending}
                                className='flex-1 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer '
                            >
                                {joinStakingMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        {t('makeMoney.processing')}
                                    </>
                                ) : (
                                    t('makeMoney.confirm')
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* All Packages Table Section */}
                <h2 className='text-lg sm:text-xl font-bold text-theme-red-100 dark:text-[#FE645F] mb-3 sm:mb-4 mt-6 sm:mt-8'>{t('makeMoney.packagesTableTitle')}</h2>
                <div className=' border-none'>
                    {isLoadingCurrentStaking || isLoadingHistories ? (
                        <div className='space-y-2 sm:space-y-3'>
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                            <Skeleton className="h-12 sm:h-16 w-full rounded-lg" />
                        </div>
                    ) : allPackages.length === 0 ? (
                        <div className='text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400'>
                            <p className='text-sm sm:text-base'>{t('makeMoney.noPackages')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card Layout */}
                            <div className="block sm:hidden space-y-3">
                                {allPackages.map((pkg, index) => (
                                    <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] p-3 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('makeMoney.packageNumber')}{index + 1}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${pkg.status === 'running'
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
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{t('makeMoney.stakingTypeLabel')}</span>
                                                <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium">
                                                    {getTypeDurationLabel(pkg.type)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{t('makeMoney.typeLabel')}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pkg.amount > 10
                                                    ? 'bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {pkg.amount > 10 ? t('makeMoney.stakingTitle') : t('makeMoney.baseTitle')}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{t('makeMoney.amount')}:</span>
                                                <span className="text-xs font-semibold text-red-600 dark:text-[#FE645F]">{formatNumber(pkg.amount)} USDT</span>
                                            </div>

                                            <div className="flex items-start justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{t('makeMoney.participationTimeLabel')}</span>
                                                <span className="text-[10px] text-gray-700 dark:text-gray-300 text-right flex-1 ml-2">{formatParticipationTime(pkg.date_start)}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{t('makeMoney.totalRewardLabel')}</span>
                                                {pkg.status === 'running' ? (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">--</span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">{formatNumber(getRewardAmount(pkg))} USDT</span>
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
                                                <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>{t('wallet.tableHeaders.stt')}</th>
                                                <th className={`${tableHeaderStyles} w-[12%]`}>{t('makeMoney.packageTypeColumn')}</th>
                                                <th className={`${tableHeaderStyles} w-[10%]`}>{t('makeMoney.typeColumn')}</th>
                                                <th className={`${tableHeaderStyles} w-[12%]`}>{t('makeMoney.amountColumn')}</th>
                                                <th className={`${tableHeaderStyles} w-[15%]`}>{t('makeMoney.participationTimeColumn')}</th>
                                                <th className={`${tableHeaderStyles} w-[12%]`}>{t('makeMoney.totalRewardColumn')}</th>
                                                <th className={`${tableHeaderStyles} w-[12%]`}>{t('makeMoney.statusColumn')}</th>
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
                                                        <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium">
                                                            {getTypeDurationLabel(pkg.type)}
                                                        </span>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[10%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${pkg.amount > 10
                                                            ? 'bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                            }`}>
                                                            {pkg.amount > 10 ? t('makeMoney.stakingTitle') : t('makeMoney.baseTitle')}
                                                        </span>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid font-semibold text-red-600 dark:text-[#FE645F]`}>
                                                        {formatNumber(pkg.amount)} USDT
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[15%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {formatParticipationTime(pkg.date_start)}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid font-semibold`}>
                                                        {pkg.status === 'running' ? (
                                                            <span className="text-gray-500 dark:text-gray-400">--</span>
                                                        ) : (
                                                            <span className="text-green-600 dark:text-green-400">{formatNumber(getRewardAmount(pkg))} USDT</span>
                                                        )}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-r rounded-r-lg border-theme-gray-100 border-solid`}>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${pkg.status === 'running'
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
