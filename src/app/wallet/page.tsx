'use client'
import CustomSelect from '@/components/CustomSelect'
import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Copy, ExternalLink, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui/button'
import { useRouter } from 'next/navigation'
import {
    getListNetworks,
    getListCoins,
    getBalance,
    getMyWallets,
    handleCheckNetwork,
    createWallet,
    getTransactionHistory,
    type Network,
    type Coin,
    type ListNetworksResponse,
    type ListCoinsResponse,
    type BalanceResponse,
    type MyWalletResponse,
    type CheckWalletNetworkResponse,
    type TransactionHistoryResponse,
    type TransactionHistoryItem
} from '@/services/WalletService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/ui/dialog'
import { Skeleton } from '@/ui/skeleton'

// Helper function to map API transaction to UI format
const mapTransactionToUI = (transaction: TransactionHistoryItem, coinSymbol?: string): {
    id: number
    time: string
    type: string
    amount: string
    fromAddress: string
    toAddress: string
    transactionId: string
    status: 'Complete' | 'Lỗi'
} => {
    // Format date
    const date = new Date(transaction.created_at)
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const formattedTime = `${time} ${dateStr}`

    // Map option to type
    const type = transaction.option === 'withdraw' ? 'Rút' : 'Nạp'

    // Format amount
    const amount = `${transaction.amount} ${coinSymbol || 'USDT'}`

    // Map status
    const status = transaction.status === 'success' ? 'Complete' : 'Lỗi'

    return {
        id: transaction.id,
        time: formattedTime,
        type,
        amount,
        fromAddress: transaction.hash || '', // Using hash as fromAddress for now
        toAddress: transaction.hash || '', // Using hash as toAddress for now
        transactionId: transaction.hash || '',
        status
    }
}

export default function WalletPage() {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('')
    const [selectedCoin, setSelectedCoin] = useState<string>('')
    const [selectedNetworkSymbol, setSelectedNetworkSymbol] = useState<string>('')
    const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false)
    const tableRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()
    const router = useRouter()
    console.log("showCreateWalletDialog", showCreateWalletDialog)

    // ==================== React Query Hooks ====================

    // 1. Networks
    const { data: networksResponse, isLoading: isLoadingNetworks, error: networksError } = useQuery<ListNetworksResponse>({
        queryKey: ['networks'],
        queryFn: async () => {
            const response = await getListNetworks()
            return response
        }
    })

    // 2. Coins
    const { data: coinsResponse, isLoading: isLoadingCoins, error: coinsError } = useQuery<ListCoinsResponse>({
        queryKey: ['coins'],
        queryFn: async () => {
            const response = await getListCoins()
            return response
        }
    })

    // 3. Balance (refetch khi coin_id thay đổi)
    const { data: balanceResponse, isLoading: isLoadingBalance, error: balanceError, refetch: refetchBalance } = useQuery<BalanceResponse>({
        queryKey: ['balance', selectedCoin],
        queryFn: async () => {
            if (!selectedCoin) return null as any
            const response = await getBalance(Number(selectedCoin))
            return response
        },
        enabled: !!selectedCoin && selectedCoin !== ''
    })

    // 4. My Wallets
    const { data: myWalletsResponse, refetch: refetchMyWallets } = useQuery<MyWalletResponse>({
        queryKey: ['my-wallets'],
        queryFn: async () => {
            const response = await getMyWallets()
            return response
        }
    })

    // 5. Check Wallet Network (khi chọn network)
    const { data: walletCheckResponse, isLoading: isLoadingWalletCheck, refetch: refetchWalletCheck } = useQuery<CheckWalletNetworkResponse>({
        queryKey: ['wallet-check', selectedNetworkSymbol],
        queryFn: async () => {
            if (!selectedNetworkSymbol) return null as any
            const response = await handleCheckNetwork(selectedNetworkSymbol)
            return response
        },
        enabled: !!selectedNetworkSymbol && selectedNetworkSymbol !== ''
    })

    // 6. Create Wallet Mutation
    const createWalletMutation = useMutation({
        mutationFn: (network_id: number) => createWallet(network_id),
        onSuccess: (data) => {
            toast.success('Tạo ví thành công!')
            setShowCreateWalletDialog(false)
            // Refetch related queries
            queryClient.invalidateQueries({ queryKey: ['my-wallets'] })
            queryClient.invalidateQueries({ queryKey: ['wallet-check', selectedNetworkSymbol] })
            refetchMyWallets()
            refetchWalletCheck()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Không thể tạo ví'
            toast.error(message)
        }
    })

    // 7. Transaction History (moved after selectedCoinInfo definition)

    // ==================== Error Handling ====================
    useEffect(() => {
        if (networksError) {
            console.error('Error fetching networks:', networksError)
            toast.error('Không thể tải danh sách mạng lưới')
        }
    }, [networksError])

    useEffect(() => {
        if (coinsError) {
            console.error('Error fetching coins:', coinsError)
            toast.error('Không thể tải danh sách coin')
        }
    }, [coinsError])

    useEffect(() => {
        if (balanceError) {
            console.error('Error fetching balance:', balanceError)
            // Don't show toast for balance error if coin is not selected
            if (selectedCoin) {
                toast.error('Không thể tải số dư')
            }
        }
    }, [balanceError, selectedCoin])

    // ==================== Initialize Default Coin ====================
    useEffect(() => {
        if (coinsResponse?.data && coinsResponse.data.length > 0 && !selectedCoin) {
            // Set first coin as default (usually USDT)
            const firstCoin = coinsResponse.data[0]
            if (firstCoin.coin_id) {
                setSelectedCoin(firstCoin.coin_id.toString())
            }
        }
    }, [coinsResponse, selectedCoin])

    // ==================== Computed Values ====================

    const networkOptions = useMemo(() => {
        if (!networksResponse?.data || !Array.isArray(networksResponse.data)) {
            return []
        }

        // Transform API data to options format, only include active networks
        return networksResponse.data
            .filter((network: Network) => network.net_status === 'active')
            .map((network: Network) => ({
                value: network.net_id.toString(),
                label: `${network.net_name} (${network.net_symbol})`
            }))
    }, [networksResponse])

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
        if (!selectedNetwork || !networksResponse?.data) return null
        return networksResponse.data.find((n: Network) => n.net_id.toString() === selectedNetwork)
    }, [selectedNetwork, networksResponse])

    // Get wallet address for selected network
    const walletAddress = useMemo(() => {
        if (!selectedNetworkSymbol) return null
        // Try from walletCheckResponse first
        if (walletCheckResponse?.data?.address) {
            return walletCheckResponse.data.address
        }
        // Fallback to myWalletsResponse
        if (myWalletsResponse?.data && myWalletsResponse.data[selectedNetworkSymbol]) {
            return myWalletsResponse.data[selectedNetworkSymbol]
        }
        return null
    }, [selectedNetworkSymbol, walletCheckResponse, myWalletsResponse])

    // Check if user has wallet for selected network
    const hasWallet = walletAddress !== null

    // Get selected coin info
    const selectedCoinInfo = useMemo(() => {
        if (!selectedCoin || !coinsResponse?.data) return null
        return coinsResponse.data.find((c: Coin) => c.coin_id?.toString() === selectedCoin)
    }, [selectedCoin, coinsResponse])

    // 7. Transaction History
    const { data: transactionHistoryResponse, isLoading: isLoadingTransactionHistory } = useQuery<TransactionHistoryResponse>({
        queryKey: ['transaction-history', selectedCoin, selectedNetworkSymbol],
        queryFn: async () => {
            const params: any = {}
            if (selectedCoinInfo?.coin_symbol) {
                params.coin = selectedCoinInfo.coin_symbol
            }
            if (selectedNetworkSymbol) {
                params.network = selectedNetworkSymbol
            }
            return await getTransactionHistory(params)
        },
        enabled: true // Always fetch, filters are optional
    })

    // Map transactions to UI format
    const transactions = useMemo(() => {
        if (!transactionHistoryResponse?.data) return []
        return transactionHistoryResponse.data.map(t => mapTransactionToUI(t, selectedCoinInfo?.coin_symbol))
    }, [transactionHistoryResponse, selectedCoinInfo])

    // ==================== Event Handlers ====================

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const networkId = e.target.value
        setSelectedNetwork(networkId)

        // Find network symbol
        if (networksResponse?.data) {
            const network = networksResponse.data.find((n: Network) => n.net_id.toString() === networkId)
            if (network) {
                setSelectedNetworkSymbol(network.net_symbol)
            }
        }
    }

    const handleCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCoin(e.target.value)
    }

    const handleCreateWallet = () => {
        if (!selectedNetwork) {
            toast.error('Vui lòng chọn mạng lưới trước')
            return
        }
        setShowCreateWalletDialog(true)
    }

    const confirmCreateWallet = () => {
        if (!selectedNetwork) return
        createWalletMutation.mutate(Number(selectedNetwork))
    }

    const handleDeposit = () => {
        if (!hasWallet) {
            toast.error('Vui lòng tạo ví trước khi nạp tiền')
            return
        }
        if (!selectedNetwork) {
            toast.error('Vui lòng chọn mạng lưới trước')
            return
        }
        
        // Build query params
        const params = new URLSearchParams({
            networkId: selectedNetwork,
        })
        
        if (selectedNetworkInfo?.net_name) {
            params.append('networkName', selectedNetworkInfo.net_name)
        }
        if (selectedNetworkInfo?.net_symbol) {
            params.append('networkSymbol', selectedNetworkInfo.net_symbol)
        }
        if (selectedCoinInfo?.coin_symbol) {
            params.append('coinSymbol', selectedCoinInfo.coin_symbol)
        }
        if (selectedCoin) {
            params.append('coinId', selectedCoin)
        }
        
        // Navigate to deposit page
        router.push(`/wallet/deposit?${params.toString()}`)
    }

    const handleWithdraw = () => {
        if (!hasWallet) {
            toast.error('Vui lòng tạo ví trước khi rút tiền')
            return
        }
        if (!selectedNetwork) {
            toast.error('Vui lòng chọn mạng lưới trước')
            return
        }
        
        // Build query params
        const params = new URLSearchParams({
            networkId: selectedNetwork,
        })
        
        if (selectedNetworkInfo?.net_name) {
            params.append('networkName', selectedNetworkInfo.net_name)
        }
        if (selectedNetworkInfo?.net_symbol) {
            params.append('networkSymbol', selectedNetworkInfo.net_symbol)
        }
        if (selectedCoinInfo?.coin_symbol) {
            params.append('coinSymbol', selectedCoinInfo.coin_symbol)
        }
        if (selectedCoin) {
            params.append('coinId', selectedCoin)
        }
        
        // Navigate to withdraw page
        router.push(`/wallet/withdraw?${params.toString()}`)
    }

    const formatAddress = (address: string | null | undefined) => {
        if (!address) return ''
        if (address.length <= 10) return address
        // Extract "pump" from the end if it exists, otherwise use last 4 characters
        const endsWithPump = address.toLowerCase().endsWith('pump')
        if (endsWithPump) {
            return `${address.substring(0, 4)}....pump`
        }
        return `${address.substring(0, 4)}....${address.substring(address.length - 4)}`
    }

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(`Đã sao chép ${type}`)
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    // Table styles from Untitled-2
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 bg-white border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    // Format balance number
    const formatBalance = (balance: number) => {
        const balanceFormatted = parseFloat(balance.toFixed(2))
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(balanceFormatted)
    }

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-7xl'>
                {/* Balance Section */}
                <div className='flex flex-col items-center justify-center mb-6'>
                    <div className='flex items-end justify-center mb-3'>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                        <div className='flex flex-col items-center mx-4'>
                            <div className='flex items-center gap-2 mb-1'>
                                <span className='text-sm font-medium text-theme-red-100'>Chọn coin:</span>
                                {isLoadingCoins ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <CustomSelect
                                        id="coin"
                                        value={selectedCoin}
                                        onChange={handleCoinChange}
                                        options={coinOptions}
                                        placeholder="Chọn coin"
                                        disabled={isLoadingCoins}
                                        className="w-24 text-sm"
                                    />
                                )}
                            </div>
                            {isLoadingBalance ? (
                                <Skeleton className="h-8 w-48" />
                            ) : balanceResponse?.data ? (
                                <div className='flex flex-col items-center'>
                                    <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                    Số dư: 0.00 {selectedCoinInfo?.coin_symbol || 'USDT'}
                                </span>
                            )}
                        </div>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                    </div>
                </div>

                {/* Network Selection Section */}
                <div className='mb-6 flex flex-col items-center justify-center'>
                    <label htmlFor="network" className='block mb-2 text-sm font-medium text-theme-red-100'>
                        Chọn mạng lưới
                    </label>
                    <CustomSelect
                        id="network"
                        value={selectedNetwork}
                        onChange={handleNetworkChange}
                        options={networkOptions}
                        placeholder="Chọn mạng lưới"
                        disabled={isLoadingNetworks}
                        className="w-full max-w-56"
                    />
                </div>

                {/* Wallet Address Section */}
                {selectedNetwork && (
                    <div className='mb-6 flex flex-col items-center justify-center'>
                        {isLoadingWalletCheck ? (
                            <Skeleton className="h-20 w-full max-w-2xl" />
                        ) : hasWallet ? (
                            <div className='w-full max-w-2xl p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='text-sm font-medium text-theme-red-100'>
                                        Địa chỉ ví {selectedNetworkInfo?.net_symbol}:
                                    </label>
                                </div>
                                <div className='flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200'>
                                    <span className='text-sm text-yellow-600 dark:text-yellow-400 italic flex-1 break-all'>
                                        {formatAddress(walletAddress || '')}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(walletAddress || '', 'địa chỉ ví')}
                                        className='text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent'
                                        title='Sao chép địa chỉ'
                                    >
                                        <Copy className='w-4 h-4' />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className='w-full max-w-2xl p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                                <p className='text-sm text-yellow-800 mb-3 text-center'>
                                    Bạn chưa có ví cho mạng lưới {selectedNetworkInfo?.net_name} ({selectedNetworkInfo?.net_symbol})
                                </p>
                                <Button
                                    onClick={confirmCreateWallet}
                                    disabled={createWalletMutation.isPending}
                                    className='w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-10 hover:opacity-90'
                                >
                                    {createWalletMutation.isPending ? (
                                        <>
                                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                            Đang tạo ví...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className='w-4 h-4 mr-2' />
                                            Tạo ví cho {selectedNetworkInfo?.net_symbol}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Deposit/Withdraw Buttons */}
                {selectedNetwork && <div className='flex items-center justify-center gap-4 mb-10'>
                    <Button
                        onClick={handleDeposit}
                        disabled={!hasWallet || !selectedNetwork}
                        className='w-full cursor-pointer font-semibold uppercase max-w-56 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 inline-flex text-white rounded-full border-none h-12 text-lg hover:bg-theme-pink-100/80 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Nạp
                    </Button>
                    <Button
                        onClick={handleWithdraw}
                        disabled={!hasWallet || !selectedNetwork}
                        className='w-full cursor-pointer font-semibold uppercase max-w-56 bg-theme-pink-100 inline-flex text-pink-500 rounded-full border-pink-500 border-solid border h-12 text-lg hover:bg-theme-pink-100/80 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Rút
                    </Button>
                </div>}

                <div className="hidden sm:block overflow-hidden rounded-md shadow-md border border-gray-200 border-solid">
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
                                        <td colSpan={8} className="text-center py-8 text-gray-500">
                                            Không có giao dịch nào
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
            </div>
        </div>
    )
}