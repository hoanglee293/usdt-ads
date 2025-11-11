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

    // Auto-select first coin if not provided
    useEffect(() => {
        if (coinsResponse?.data && coinsResponse.data.length > 0 && !selectedCoinId) {
            const firstCoin = coinsResponse.data[0]
            if (firstCoin.coin_id) {
                setSelectedCoinId(firstCoin.coin_id.toString())
            }
        }
    }, [coinsResponse, selectedCoinId])

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
            <div className='w-full max-w-2xl space-y-6'>
                {/* Back Button */}
                <Button
                    onClick={handleBack}
                    variant="ghost"
                    className="text-gray-600 cursor-pointer border-none bg-transparent hover:text-pink-500 p-0"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                {/* Top Section - Balance Display */}
                <div className="flex items-center justify-center">
                    <div className='flex items-end justify-center mb-6'>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                        <div className='flex flex-col items-center mx-4'>
                            {isLoadingBalance ? (
                                <Skeleton className="h-8 w-48" />
                            ) : balanceResponse?.data ? (
                                <div className='flex flex-col items-center'>
                                    <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {coinSymbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                    Số dư: 0.00 {coinSymbol || 'USDT'}
                                </span>
                            )}
                        </div>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                    </div>
                </div>

                {/* Middle Section - Withdrawal Amount Block */}
                <div className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 rounded-full p-6 shadow-lg">
                    <h3 className="text-white text-center font-semibold mb-4 text-lg">
                        Nhập số tiền muốn rút
                    </h3>

                    <div className="flex items-center gap-3 mb-3 w-full relative">
                        <Input
                            id="amount"
                            type="number"
                            step="0.00000001"
                            min="0.00000001"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0"
                            disabled={withdrawMutation.isPending}
                            className="max-w-[300px] mx-auto bg-white text-center text-lg font-semibold rounded-xl border-none h-10 text-gray-800"
                            required
                        />
                        <Button
                            type="button"
                            onClick={handleMaxAmount}
                            disabled={withdrawMutation.isPending || !balanceResponse?.data}
                            className="bg-pink-500 absolute right-0 hover:bg-pink-600 text-white rounded-xl px-6 h-8 font-semibold uppercase border-none disabled:opacity-50"
                        >
                            MAX
                        </Button>
                    </div>

                    {balanceResponse?.data && (
                        <p className="text-white text-center text-sm opacity-90">
                            Số dư {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || coinSymbol || 'USDT'}
                        </p>
                    )}
                </div>

                {/* Lower Middle Section - Network and Address */}
                <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-6">
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {/* Network Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="network" className="text-sm font-medium text-theme-red-100">
                                Chọn mạng lưới
                            </Label>
                            {isLoadingNetworks ? (
                                <Skeleton className="h-12 w-full rounded-full" />
                            ) : (
                                <CustomSelect
                                    id="network"
                                    value={selectedNetworkId}
                                    onChange={handleNetworkChange}
                                    options={networkOptions}
                                    placeholder="Chọn"
                                    disabled={isLoadingNetworks}
                                />
                            )}
                        </div>

                        {/* Wallet Address Input */}
                        <div className="space-y-2 w-full">
                            <Label htmlFor="address" className="text-sm font-medium text-theme-red-100">
                                Địa chỉ ví
                            </Label>
                            <Input
                                id="address"
                                type="text"
                                value={withdrawAddress}
                                onChange={(e) => setWithdrawAddress(e.target.value)}
                                placeholder="Nhập"
                                className="rounded-full placeholder:text-gray-400 border border-gray-200 border-solid w-full"
                                disabled={withdrawMutation.isPending}
                                required
                            />
                        </div>
                    </div>

                    {/* Coin Selection - Hidden but required for API */}
                    {selectedCoinId && (
                        <input type="hidden" name="coin" value={selectedCoinId} />
                    )}

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
                        className="w-full mt-6 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-10 text-lg font-bold uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {withdrawMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'RÚT'
                        )}
                    </Button>
                </form>

                {/* Success Message */}
                {withdrawMutation.isSuccess && withdrawMutation.data?.data && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
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
