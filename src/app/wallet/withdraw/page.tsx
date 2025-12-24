'use client'
import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Copy, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getListNetworks,
    getListCoins,
    getBalance,
    getWalletByNetwork,
    withdrawFunds,
    getTransactionHistory,
    type ListNetworksResponse,
    type ListCoinsResponse,
    type BalanceResponse,
    type WalletByNetworkResponse,
    type Network,
    type Coin,
    type WithdrawRequest,
    type TransactionHistoryResponse,
    type TransactionHistoryItem
} from '@/services/WalletService'
import { Skeleton } from '@/ui/skeleton'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import CustomSelect from '@/components/CustomSelect'
import { useIsMobile } from '@/ui/use-mobile'

function WithdrawPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const tableRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()

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

    // Table styles
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 bg-white border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    const formatAddress = (address: string) => {
        if (!address) return ''
        if (address.length <= 10) return address
        return `${address.substring(0, 6)}....${address.substring(address.length - 4)}`
    }

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(`Đã sao chép ${type}`)
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    // Fetch transaction history filtered by withdraw type
    const { data: transactionHistoryResponse, isLoading: isLoadingTransactionHistory } = useQuery<TransactionHistoryResponse>({
        queryKey: ['transaction-history', 'withdraw', selectedCoinInfo?.coin_symbol, selectedNetworkInfo?.net_symbol],
        queryFn: async () => {
            const params: any = { type: 'withdraw' }
            if (selectedCoinInfo?.coin_symbol) {
                params.coin = selectedCoinInfo.coin_symbol
            }
            if (selectedNetworkInfo?.net_symbol) {
                params.network = selectedNetworkInfo.net_symbol
            }
            return await getTransactionHistory(params)
        },
        enabled: true
    })

    // Map transactions to UI format
    const transactions = useMemo(() => {
        if (!transactionHistoryResponse?.data) return []
        return transactionHistoryResponse.data.map((t: TransactionHistoryItem) => {
            const date = new Date(t.created_at)
            const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const formattedTime = `${time} ${dateStr}`
            const status = t.status === 'success' ? 'Complete' : 'Lỗi'
            return {
                id: t.id,
                time: formattedTime,
                type: 'Rút',
                amount: `${t.amount} ${selectedCoinInfo?.coin_symbol || coinSymbol || 'USDT'}`,
                fromAddress: t.hash || '',
                toAddress: t.hash || '',
                transactionId: t.hash || '',
                status
            }
        })
    }, [transactionHistoryResponse, selectedCoinInfo, coinSymbol])

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full container mx-auto'>
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
                                    <span className='text-2xl font-bold text-center text-pink-500  '>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {coinSymbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500  '>
                                    Số dư: 0.00 {coinSymbol || 'USDT'}
                                </span>
                            )}
                        </div>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                    </div>
                </div>

                {/* Middle Section - Withdrawal Amount Block */}
                <div className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 rounded-full p-6 shadow-lg max-w-3xl mx-auto">
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
                <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-6 max-w-3xl mx-auto mt-10">
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
                        className="w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-10 text-lg font-bold uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

                {/* Transaction History Section */}
                <div className="w-full mt-8">
                    <h3 className="text-lg font-semibold text-theme-red-100 mb-4">Lịch sử rút tiền</h3>
                    {isMobile ? (
                        // Mobile: Card Layout
                        <div className="w-full space-y-3">
                            {isLoadingTransactionHistory ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white rounded-lg border border-gray-200">
                                    <div className="text-gray-400 mb-2">
                                        <Wallet className="w-12 h-12 mx-auto" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Chưa có giao dịch rút tiền nào
                                    </p>
                                </div>
                            ) : (
                                transactions.map((transaction) => (
                                    <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">#{transaction.id}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="py-1 rounded-full text-xs min-w-20 flex justify-center font-medium bg-orange-100 text-orange-700">
                                                    {transaction.type}
                                                </div>
                                                <div className={`py-1 rounded-full text-xs min-w-20 flex justify-center font-medium ${
                                                    transaction.status === 'Complete'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {transaction.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="text-base font-semibold text-red-500">
                                                {transaction.amount}
                                            </div>
                                            <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                                                {transaction.time}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-600 min-w-[60px]">TX ID:</span>
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <span className="text-xs text-yellow-600 dark:text-yellow-400 italic break-all">
                                                        {formatAddress(transaction.transactionId)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(transaction.transactionId, 'mã giao dịch')}
                                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors border-none bg-transparent"
                                                        title="Sao chép mã giao dịch"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Desktop: Table Layout
                        <div className="block overflow-hidden rounded-md bg-transparent border-none">
                            {/* Fixed Header */}
                            <div className="overflow-hidden rounded-t-md">
                                <table className={tableStyles}>
                                    <thead>
                                        <tr>
                                            <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>STT</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>THỜI GIAN</th>
                                            <th className={`${tableHeaderStyles} w-[8%]`}>TYPE</th>
                                            <th className={`${tableHeaderStyles} w-[10%]`}>SỐ TIỀN</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>FROM ADDRESS</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TO ADDRESS</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TRANSACTION ID</th>
                                            <th className={`${tableHeaderStyles} w-[11%] text-center rounded-r-lg`}>STATUS</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Scrollable Body */}
                            <div className={tableContainerStyles} ref={tableRef}>
                                <table className={tableStyles}>
                                    <tbody>
                                        {isLoadingTransactionHistory ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8">
                                                    <Skeleton className="h-8 w-full" />
                                                </td>
                                            </tr>
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-gray-500 bg-white shadow-lg border border-gray-200 rounded-lg border-solid">
                                                    Chưa có giao dịch rút tiền nào
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((transaction) => (
                                                <tr key={transaction.id} className="group transition-colors">
                                                    <td className={`${tableCellStyles} w-[5%] text-left !pl-4 rounded-l-lg border-l border-r-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.id}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.time}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[8%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.type}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[10%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.amount}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.fromAddress)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.fromAddress, 'địa chỉ gửi')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép địa chỉ'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.toAddress)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.toAddress, 'địa chỉ nhận')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép địa chỉ'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.transactionId)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.transactionId, 'mã giao dịch')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép mã giao dịch'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[11%] text-center rounded-r-lg border-l-0 border-theme-gray-100 border-solid`}>
                                                        <span
                                                            className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${transaction.status === 'Complete'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-red-500 text-white'
                                                                }`}
                                                        >
                                                            {transaction.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                <div className='w-full container mx-auto'>
                    <Skeleton className="h-10 w-32 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        }>
            <WithdrawPageContent />
        </Suspense>
    )
}
