'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { Loader2, Calendar, DollarSign, Target, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import CustomSelect from '@/components/CustomSelect'
import { Skeleton } from '@/ui/skeleton'
import Modal from '@/components/Modal'
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
    type StakingPackage,
    type JoinStakingRequest,
    type CurrentStakingResponse,
    type StakingHistoriesResponse,
} from '@/services/StakingService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function MakeMoneyPage() {
    const queryClient = useQueryClient()

    // Form state
    const [stakingType, setStakingType] = useState<'1d' | '7d' | '30d'>('1d')
    const [stakingAmount, setStakingAmount] = useState<string>('')
    const [usdtCoinId, setUsdtCoinId] = useState<string>('')
    const [isStakingModalOpen, setIsStakingModalOpen] = useState<boolean>(false)

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
    const { data: historiesResponse, isLoading: isLoadingHistories } = useQuery<StakingHistoriesResponse>({
        queryKey: ['staking-histories'],
        queryFn: getStakingHistories,
        refetchOnWindowFocus: false, // Không cần refetch khi chuyển tab
        staleTime: 2 * 60 * 1000, // Cache 2 phút
    })

    // 5. Join Base Mutation
    const joinBaseMutation = useMutation({
        mutationFn: joinBasePackage,
        onSuccess: () => {
            toast.success('Tham gia gói Base thành công!')
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể tham gia gói Base'
            toast.error(message)
        }
    })

    // 6. Join Staking Mutation
    const joinStakingMutation = useMutation({
        mutationFn: (data: JoinStakingRequest) => joinStakingPackage(data),
        onSuccess: () => {
            toast.success('Tham gia gói Staking thành công!')
            setStakingAmount('')
            setIsStakingModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['current-staking'] })
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] })
            refetchBalance()
            refetchCurrentStaking()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể tham gia gói Staking'
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

    const currentStaking = useMemo(() => {
        return currentStakingResponse?.data || null
    }, [currentStakingResponse])
    console.log(currentStaking)

    const stakingHistories = useMemo(() => {
        return historiesResponse?.data || []
    }, [historiesResponse])

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
                return 'Đã kết thúc'
            default:
                return status
        }
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

    // ==================== Event Handlers ====================

    const handleJoinBase = () => {
        if (usdtBalance >= 10) {
            toast.error('Số dư phải nhỏ hơn $10 để tham gia gói Base')
            return
        }
        if (currentStaking) {
            toast.error('Bạn đang có gói staking đang chạy')
            return
        }
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

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-7xl'>
                {/* Header Section */}
                {currentStaking && (
                    <div className='flex flex-col items-center justify-center mb-8'>
                        <div className='flex items-end justify-center mb-4'>
                            <img src="/logo.png" alt="logo" className='w-12 h-12 object-cover pt-2' />
                            <div className='flex flex-col items-center mx-4'>
                                <h1 className='text-3xl font-semibold font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]'>{currentStaking && currentStaking?.amount > 10 ? 'Staking' : 'Base'}</h1>
                            </div>
                            <img src="/logo.png" alt="logo" className='w-12 h-12 object-cover pt-2' />
                        </div>
                    </div>
                )}

                {/* Current Staking Section */}
                {isLoadingCurrentStaking ? (
                    <div className='mb-8'>
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ) : currentStaking ? (
                    <div className='mb-8 p-6 rounded-lg border border-gray-200'>
                        <div className='grid grid-cols-1 md:grid-cols-2 max-w-[50vw] mx-auto gap-4 mb-4'>
                            {/* Left Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Gói staking:</p>
                                <p className='text-lg font-semibold text-red-600'>{currentStaking?.amount > 10 ? 'Staking' : 'Base'}</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Loại staking:</p>
                                <p className='text-lg font-semibold text-red-600'>{getTypeDurationLabel(currentStaking.type)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Số tiền tham gia:</p>
                                <p className='text-lg font-semibold text-red-600'>{formatNumber(currentStaking.amount)} USDT</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Thời gian tham gia:</p>
                                <p className='text-sm font-medium text-red-600'>{formatDateOnly(currentStaking.date_start)}</p>
                            </div>

                            {/* Left Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Tổng phần thưởng:</p>
                                <p className='text-lg font-semibold text-red-600'>{formatNumber(currentStaking.amount * 0.3)} USDT</p>
                            </div>

                            {/* Right Column */}
                            <div className='p-3 bg-white rounded-full flex items-center gap-3 justify-start shadow-md'>
                                <p className='text-sm text-gray-600 pl-1'>Trạng thái:</p>
                                <p className='text-sm font-medium text-gray-900'>{getStatusText(currentStaking.status)}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {/* <div className='mb-4'>
                            <div className='flex justify-between items-center mb-2'>
                                <span className='text-sm text-gray-600'>Tiến độ</span>
                                <span className='text-sm font-semibold text-pink-500'>{calculateProgress(currentStaking)}%</span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-3'>
                                <div
                                    className='bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 h-3 rounded-full transition-all duration-300'
                                    style={{ width: `${calculateProgress(currentStaking)}%` }}
                                />
                            </div>
                        </div> */}

                        {/* Tasks */}
                        {/* <div className='grid grid-cols-2 gap-4'>
                            <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                <p className='text-sm text-blue-600 mb-1'>Lượt xem video</p>
                                <p className='text-lg font-bold text-blue-900'>{currentStaking.turn_setting}</p>
                            </div>
                            <div className='p-3 bg-green-50 rounded-lg border border-green-200'>
                                <p className='text-sm text-green-600 mb-1'>Số thiết bị</p>
                                <p className='text-lg font-bold text-green-900'>{currentStaking.devices_setting}</p>
                            </div>
                        </div> */}
                    </div>
                ) : (
                    /* Join Package Section */
                    <div className='mb-8 p-6 bg-transparent rounded-lg border border-gray-200 shadow-sm flex gap-10 w-[50vw] mx-auto'>
                        {/* Gói Base - Luôn hiển thị */}
                        <div className='py-4 px-8 bg-transparent border border-theme-gray-100 border-solid flex flex-col items-center justify-center flex-1 gap-4 min-h-3200] rounded-xl'>
                            <h3 className='text-4xl font-semibold text-black mb-2 text-center'>Base</h3>
                            <span className='text-sm text-yellow-800 mb-2'>1 Ngày</span>
                            <Button
                                onClick={handleJoinBase}
                                disabled={joinBaseMutation.isPending || isBaseDisabled}
                                className='w-full bg-gray-100 text-theme-red-200 text-lg uppercase font-semibold rounded-full border-none h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
                            >
                                {joinBaseMutation.isPending ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tham gia ngay'
                                )}
                            </Button>
                        </div>

                        {/* Gói Staking - Luôn hiển thị */}
                        <div className='py-4 px-8 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 border border-green-200 flex flex-col items-center justify-center flex-1 gap-4 min-h-[230px] rounded-xl'>
                            <h3 className='text-4xl text-center font-semibold text-white mb-2'> Staking</h3>
                            <span className='text-sm text-white mb-2'>1 Ngày/ 7 Ngày/ 30 Ngày</span>
                            <Button
                                onClick={() => setIsStakingModalOpen(true)}
                                disabled={isStakingDisabled}
                                className='w-full bg-white text-theme-red-200 text-lg uppercase font-semibold rounded-full border-none h-12 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed'
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

                {/* Staking Histories Section */}
                <h2 className='text-xl font-bold text-theme-red-100 mb-4'>Thống kê gói staking</h2>
                <div className='p-6 bg-white rounded-lg border border-gray-200 shadow-md'>
                    {isLoadingHistories ? (
                        <div className='space-y-3'>
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : stakingHistories.length === 0 ? (
                        <div className='text-center py-8 text-gray-500'>
                            <p>Chưa có lịch sử tham gia</p>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {stakingHistories.map((history) => (
                                <div
                                    key={history.id}
                                    className='rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
                                >
                                    <div className='flex items-center justify-between mb-3'>
                                        <div className='flex items-center gap-3'>
                                            <span className='text-sm font-bold bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white px-4 py-1 rounded-full'>
                                               Staking: {formatNumber(history.amount)} USDT
                                            </span>
                                            <span className='px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium'>
                                                {getTypeLabel(history.type)}
                                            </span>
                                            {getStatusBadge(history.status)}
                                        </div>
                                        <button className=' text-sm uppercase font-semibold rounded-full border-none bg-theme-red-200/40 text-white px-4 py-1'>Claim</button>
                                    </div>

                                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                                        <div>
                                            <p className='text-gray-600'>Bắt đầu</p>
                                            <p className='font-medium text-gray-900'>{formatDate(history.date_start)}</p>
                                        </div>
                                        <div>
                                            <p className='text-gray-600'>Kết thúc</p>
                                            <p className='font-medium text-gray-900'>{formatDate(history.date_end)}</p>
                                        </div>
                                        <div>
                                            <p className='text-gray-600'>Lượt xem</p>
                                            <p className='font-medium text-gray-900'>{history.turn_setting}</p>
                                        </div>
                                        <div>
                                            <p className='text-gray-600'>Thiết bị</p>
                                            <p className='font-medium text-gray-900'>{history.devices_setting}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
