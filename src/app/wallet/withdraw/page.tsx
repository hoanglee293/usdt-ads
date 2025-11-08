'use client'
import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    getListNetworks, 
    getListCoins, 
    getBalance, 
    getWalletByNetwork,
    withdrawFunds,
    type ListNetworksResponse,
    type ListCoinsResponse,
    type BalanceResponse,
    type WalletByNetworkResponse,
    type Network,
    type Coin,
    type WithdrawRequest
} from '@/services/WalletService'
import { Skeleton } from '@/ui/skeleton'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import CustomSelect from '@/components/CustomSelect'

function WithdrawPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const queryClient = useQueryClient()

    const networkId = searchParams.get('networkId')
    const networkName = searchParams.get('networkName')
    const networkSymbol = searchParams.get('networkSymbol')
    const coinSymbol = searchParams.get('coinSymbol')
    const coinId = searchParams.get('coinId')

    // Form state
    const [withdrawAddress, setWithdrawAddress] = useState<string>('')
    const [withdrawAmount, setWithdrawAmount] = useState<string>('')
    const [selectedNetworkId, setSelectedNetworkId] = useState<string>(networkId || '')
    const [selectedCoinId, setSelectedCoinId] = useState<string>(coinId || '')

    // Fetch networks
    const { data: networksResponse, isLoading: isLoadingNetworks } = useQuery<ListNetworksResponse>({
        queryKey: ['networks'],
        queryFn: async () => await getListNetworks()
    })

    // Fetch coins
    const { data: coinsResponse, isLoading: isLoadingCoins } = useQuery<ListCoinsResponse>({
        queryKey: ['coins'],
        queryFn: async () => await getListCoins()
    })

    // Fetch wallet data when page loads and networkId is available
    const { data: walletResponse, isLoading: isLoadingWallet } = useQuery<WalletByNetworkResponse>({
        queryKey: ['wallet-by-network', selectedNetworkId],
        queryFn: async () => {
            if (!selectedNetworkId) throw new Error('Network ID is required')
            return await getWalletByNetwork(Number(selectedNetworkId))
        },
        enabled: !!selectedNetworkId && selectedNetworkId !== '',
    })

    // Fetch balance when coinId is available
    const { data: balanceResponse, isLoading: isLoadingBalance } = useQuery<BalanceResponse>({
        queryKey: ['balance', selectedCoinId],
        queryFn: async () => {
            if (!selectedCoinId) return null as any
            return await getBalance(Number(selectedCoinId))
        },
        enabled: !!selectedCoinId && selectedCoinId !== '',
    })

    // Withdraw mutation
    const withdrawMutation = useMutation({
        mutationFn: (withdrawData: WithdrawRequest) => withdrawFunds(withdrawData),
        onSuccess: (data) => {
            toast.success('Rút tiền thành công!')
            // Reset form
            setWithdrawAddress('')
            setWithdrawAmount('')
            // Invalidate balance to refresh
            queryClient.invalidateQueries({ queryKey: ['balance', selectedCoinId] })
            queryClient.invalidateQueries({ queryKey: ['transaction-history'] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Không thể rút tiền'
            toast.error(message)
        }
    })

    // Initialize from URL params
    useEffect(() => {
        if (networkId && !selectedNetworkId) {
            setSelectedNetworkId(networkId)
        }
        if (coinId && !selectedCoinId) {
            setSelectedCoinId(coinId)
        }
    }, [networkId, coinId, selectedNetworkId, selectedCoinId])

    // Network options
    const networkOptions = useMemo(() => {
        if (!networksResponse?.data || !Array.isArray(networksResponse.data)) {
            return []
        }
        return networksResponse.data
            .filter((network: Network) => network.net_status === 'active')
            .map((network: Network) => ({
                value: network.net_id.toString(),
                label: `${network.net_name} (${network.net_symbol})`
            }))
    }, [networksResponse])

    // Coin options
    const coinOptions = useMemo(() => {
        if (!coinsResponse?.data || !Array.isArray(coinsResponse.data)) {
            return []
        }
        return coinsResponse.data.map((coin: Coin) => ({
            value: coin.coin_id?.toString() || '',
            label: coin.coin_symbol || coin.coin_name || 'Unknown'
        }))
    }, [coinsResponse])

    // Get selected network info
    const selectedNetworkInfo = useMemo(() => {
        if (!selectedNetworkId || !networksResponse?.data) return null
        return networksResponse.data.find((n: Network) => n.net_id.toString() === selectedNetworkId)
    }, [selectedNetworkId, networksResponse])

    // Get selected coin info
    const selectedCoinInfo = useMemo(() => {
        if (!selectedCoinId || !coinsResponse?.data) return null
        return coinsResponse.data.find((c: Coin) => c.coin_id?.toString() === selectedCoinId)
    }, [selectedCoinId, coinsResponse])

    const handleBack = () => {
        router.back()
    }

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedNetworkId(e.target.value)
    }

    const handleCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCoinId(e.target.value)
    }

    const handleMaxAmount = () => {
        if (balanceResponse?.data) {
            setWithdrawAmount(balanceResponse.data.balance.toString())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!selectedNetworkId) {
            toast.error('Vui lòng chọn mạng lưới')
            return
        }

        if (!selectedCoinId) {
            toast.error('Vui lòng chọn coin')
            return
        }

        if (!withdrawAddress || withdrawAddress.trim() === '') {
            toast.error('Vui lòng nhập địa chỉ ví nhận')
            return
        }

        const amount = parseFloat(withdrawAmount)
        if (!withdrawAmount || isNaN(amount) || amount <= 0) {
            toast.error('Vui lòng nhập số tiền hợp lệ')
            return
        }

        if (amount < 0.00000001) {
            toast.error('Số tiền tối thiểu là 0.00000001')
            return
        }

        if (balanceResponse?.data && amount > balanceResponse.data.balance) {
            toast.error('Số tiền vượt quá số dư hiện tại')
            return
        }

        // Prepare withdraw data
        const withdrawData: WithdrawRequest = {
            network: selectedNetworkInfo?.net_symbol || selectedNetworkId,
            coin: selectedCoinInfo?.coin_symbol || selectedCoinId,
            address: withdrawAddress.trim(),
            amount: amount
        }

        withdrawMutation.mutate(withdrawData)
    }

    // Format balance number
    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(balance)
    }

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-2xl'>
                {/* Back Button */}
                <Button
                    onClick={handleBack}
                    variant="ghost"
                    className="mb-4 text-gray-600 cursor-pointer border-none bg-transparent hover:text-pink-500"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                {/* Header */}
                <div className="text-center mb-8">
                    {/* Balance Section */}
                    <div className='flex items-end justify-center mb-6'>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                        <div className='flex flex-col items-center mx-4'>
                            {isLoadingBalance ? (
                                <Skeleton className="h-8 w-48" />
                            ) : balanceResponse?.data ? (
                                <div className='flex flex-col items-center'>
                                    <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || coinSymbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                    Số dư: 0.00 {selectedCoinInfo?.coin_symbol || coinSymbol || 'USDT'}
                                </span>
                            )}
                        </div>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                    </div>
                </div>

                {/* Withdraw Form */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
                    <h2 className="text-xl font-semibold text-theme-red-100 mb-6 text-center">
                        Rút tiền Onchain
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Network Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="network" className="text-sm font-medium text-theme-red-100">
                                Mạng lưới *
                            </Label>
                            {isLoadingNetworks ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <CustomSelect
                                    id="network"
                                    value={selectedNetworkId}
                                    onChange={handleNetworkChange}
                                    options={networkOptions}
                                    placeholder="Chọn mạng lưới"
                                    disabled={isLoadingNetworks}
                                />
                            )}
                        </div>

                        {/* Coin Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="coin" className="text-sm font-medium text-theme-red-100">
                                Coin *
                            </Label>
                            {isLoadingCoins ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <CustomSelect
                                    id="coin"
                                    value={selectedCoinId}
                                    onChange={handleCoinChange}
                                    options={coinOptions}
                                    placeholder="Chọn coin"
                                    disabled={isLoadingCoins}
                                />
                            )}
                        </div>

                        {/* Wallet Address Input */}
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium text-theme-red-100">
                                Địa chỉ ví nhận *
                            </Label>
                            <Input
                                id="address"
                                type="text"
                                value={withdrawAddress}
                                onChange={(e) => setWithdrawAddress(e.target.value)}
                                placeholder="Nhập địa chỉ ví nhận (ví dụ: 0x1234...)"
                                className="font-mono"
                                disabled={withdrawMutation.isPending}
                                required
                            />
                            {walletResponse?.data && (
                                <p className="text-xs text-gray-500">
                                    Địa chỉ ví của bạn: {walletResponse.data.public_key.substring(0, 10)}...{walletResponse.data.public_key.substring(walletResponse.data.public_key.length - 8)}
                                </p>
                            )}
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="amount" className="text-sm font-medium text-theme-red-100">
                                    Số tiền rút *
                                </Label>
                                {balanceResponse?.data && (
                                    <button
                                        type="button"
                                        onClick={handleMaxAmount}
                                        className="text-xs text-pink-500 hover:text-pink-600 underline"
                                        disabled={withdrawMutation.isPending}
                                    >
                                        Tối đa
                                    </button>
                                )}
                            </div>
                            <Input
                                id="amount"
                                type="number"
                                step="0.00000001"
                                min="0.00000001"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00000001"
                                disabled={withdrawMutation.isPending}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Số tiền tối thiểu: 0.00000001 {selectedCoinInfo?.coin_symbol || coinSymbol || 'coin'}
                            </p>
                            {balanceResponse?.data && (
                                <p className="text-xs text-gray-500">
                                    Số dư khả dụng: {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || coinSymbol || 'coin'}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={
                                withdrawMutation.isPending ||
                                !selectedNetworkId ||
                                !selectedCoinId ||
                                !withdrawAddress ||
                                !withdrawAmount ||
                                isLoadingBalance
                            }
                            className="w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-12 text-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {withdrawMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Rút tiền'
                            )}
                        </Button>
                    </form>

                    {/* Success Message */}
                    {withdrawMutation.isSuccess && withdrawMutation.data?.data && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 font-medium mb-2">
                                Rút tiền thành công!
                            </p>
                            <p className="text-xs text-green-700">
                                Transaction Hash: {withdrawMutation.data.data.transaction_hash}
                            </p>
                            <p className="text-xs text-green-700">
                                History ID: {withdrawMutation.data.data.history_id}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function WithdrawPage() {
    return (
        <Suspense fallback={
            <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
                <div className='w-full max-w-2xl'>
                    <Skeleton className="h-10 w-32 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        }>
            <WithdrawPageContent />
        </Suspense>
    )
}
