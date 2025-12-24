'use client'
import CustomSelect from '@/components/CustomSelect'
import DepositContent from '@/components/DepositContent'
import WithdrawContent from '@/components/WithdrawContent'
import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Copy, ExternalLink, Plus, Loader2, ChevronDown, ChevronUp, Wallet, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/ui/button'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lang/useLang'
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
import { useIsMobile } from '@/ui/use-mobile'

// Helper function to map API transaction to UI format
const mapTransactionToUI = (transaction: TransactionHistoryItem, coinSymbol?: string, t?: (key: string, params?: Record<string, any>) => string, lang?: 'en' | 'kr' | 'vi'): {
    id: number
    time: string
    type: string
    amount: string
    fromAddress: string
    toAddress: string
    transactionId: string
    status: string
} => {
    // Format date - use locale based on language
    const date = new Date(transaction.created_at)
    const locale = lang === 'kr' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'vi-VN'
    const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const formattedTime = `${time} ${dateStr}`

    // Map option to type
    const type = transaction.option === 'withdraw'
        ? (t ? t('wallet.transactionTypes.withdraw') : 'Rút')
        : (t ? t('wallet.transactionTypes.deposit') : 'Nạp')

    // Format amount
    const amount = `${transaction.amount} ${coinSymbol || 'USDT'}`

    // Map status
    const status = transaction.status === 'success'
        ? (t ? t('wallet.transactionStatus.complete') : 'Complete')
        : (t ? t('wallet.transactionStatus.error') : 'Lỗi')

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

// Transaction Card Component for Mobile
interface TransactionCardProps {
    transaction: {
        id: number
        time: string
        type: string
        amount: string
        fromAddress: string
        toAddress: string
        transactionId: string
        status: string
    }
    onCopy: (text: string, type: string) => void
    formatAddress: (address: string) => string
    t: (key: string, params?: Record<string, any>) => string
}

function TransactionCard({ transaction, onCopy, formatAddress, t }: TransactionCardProps) {
    const isWithdraw = transaction.type === t('wallet.transactionTypes.withdraw')
    const isComplete = transaction.status === t('wallet.transactionStatus.complete')

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-md p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">#{transaction.id}</span>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className={` py-1 rounded-full text-xs min-w-20 flex justify-center font-medium ${isWithdraw
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                        {transaction.type}
                    </div>
                    <div className={` py-1 rounded-full text-xs min-w-20 flex justify-center font-medium ${isComplete
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        {transaction.status}
                    </div>
                </div>
            </div>

            {/* Amount & Time */}
            <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold text-red-500 dark:text-[#FE645F]">
                    {transaction.amount}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 italic mt-0.5">
                    {transaction.time}
                </div>
            </div>

            {/* Details - Always visible */}
            <div className="pt-3 flex items-center justify-start gap-2 border-gray-200 dark:border-gray-700">
                <AddressRow
                    label={t('wallet.addressLabels.to')}
                    labelKey="to"
                    address={transaction.toAddress}
                    onCopy={onCopy}
                    formatAddress={formatAddress}
                    t={t}
                />
                <AddressRow
                    label={t('wallet.addressLabels.txId')}
                    labelKey="txId"
                    address={transaction.transactionId}
                    onCopy={onCopy}
                    formatAddress={formatAddress}
                    t={t}
                />
            </div>
        </div>
    )
}

function AddressRow({
    label,
    labelKey,
    address,
    onCopy,
    formatAddress,
    t
}: {
    label: string
    labelKey: 'to' | 'txId'
    address: string
    onCopy: (text: string, type: string) => void
    formatAddress: (address: string) => string
    t: (key: string, params?: Record<string, any>) => string
}) {
    const getCopyLabel = () => {
        if (labelKey === 'to') {
            return t('wallet.copyLabels.toAddress')
        }
        return t('wallet.copyLabels.transactionId')
    }

    const copyLabel = getCopyLabel()

    return (
        <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 md:min-w-[60px] min-w-auto">
                {label}:
            </span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs text-yellow-600 dark:text-yellow-400 italic break-all">
                    {formatAddress(address)}
                </span>
                <button
                    onClick={() => onCopy(address, copyLabel)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors border-none bg-transparent pt-1"
                    title={t('common.copy') + ' ' + copyLabel}
                >
                    <Copy className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}

export default function WalletPage() {
    const { t, lang } = useLang()
    const [selectedNetwork, setSelectedNetwork] = useState<string>('')
    const [selectedCoin, setSelectedCoin] = useState<string>('')
    const [selectedNetworkSymbol, setSelectedNetworkSymbol] = useState<string>('')
    const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false)
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'deposit' | 'withdraw'>('all')
    const [activeView, setActiveView] = useState<'main' | 'deposit' | 'withdraw'>('deposit')
    const tableRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()
    const router = useRouter()
    const isMobile = useIsMobile()
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
            toast.success(t('wallet.createWalletSuccess'))
            setShowCreateWalletDialog(false)
            // Refetch related queries
            queryClient.invalidateQueries({ queryKey: ['my-wallets'] })
            queryClient.invalidateQueries({ queryKey: ['wallet-check', selectedNetworkSymbol] })
            refetchMyWallets()
            refetchWalletCheck()
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('wallet.createWalletError')
            toast.error(message)
        }
    })

    // 7. Transaction History (moved after selectedCoinInfo definition)

    // ==================== Error Handling ====================
    useEffect(() => {
        if (networksError) {
            console.error('Error fetching networks:', networksError)
            toast.error(t('wallet.loadNetworksError'))
        }
    }, [networksError, t])

    useEffect(() => {
        if (coinsError) {
            console.error('Error fetching coins:', coinsError)
            toast.error(t('wallet.loadCoinsError'))
        }
    }, [coinsError, t])

    useEffect(() => {
        if (balanceError) {
            console.error('Error fetching balance:', balanceError)
            // Don't show toast for balance error if coin is not selected
            if (selectedCoin) {
                toast.error(t('wallet.loadBalanceError'))
            }
        }
    }, [balanceError, selectedCoin, t])

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
        queryKey: ['transaction-history', selectedCoin, selectedNetworkSymbol, transactionTypeFilter],
        queryFn: async () => {
            const params: any = {}
            if (selectedCoinInfo?.coin_symbol) {
                params.coin = selectedCoinInfo.coin_symbol
            }
            if (selectedNetworkSymbol) {
                params.network = selectedNetworkSymbol
            }
            if (transactionTypeFilter !== 'all') {
                params.type = transactionTypeFilter
            }
            return await getTransactionHistory(params)
        },
        enabled: true // Always fetch, filters are optional
    })

    // Map transactions to UI format
    const transactions = useMemo(() => {
        if (!transactionHistoryResponse?.data) return []
        return transactionHistoryResponse.data.map(trans => mapTransactionToUI(trans, selectedCoinInfo?.coin_symbol, t, lang as 'en' | 'kr' | 'vi' | undefined))
    }, [transactionHistoryResponse, selectedCoinInfo, t, lang])

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
            toast.error(t('wallet.pleaseSelectNetwork'))
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
            toast.error(t('wallet.pleaseCreateWalletBeforeDeposit'))
            return
        }
        if (!selectedNetwork) {
            toast.error(t('wallet.pleaseSelectNetwork'))
            return
        }
        setActiveView('deposit')
    }

    const handleWithdraw = () => {
        if (!hasWallet) {
            toast.error(t('wallet.pleaseCreateWalletBeforeWithdraw'))
            return
        }
        if (!selectedNetwork) {
            toast.error(t('wallet.pleaseSelectNetwork'))
            return
        }
        setActiveView('withdraw')
    }

    const handleBackToMain = () => {
        setActiveView('main')
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
            toast.success(t('wallet.copied', { type }))
        } catch (err) {
            toast.error(t('wallet.copyError'))
        }
    }

    const handleTransactionClick = (transaction: { type: string; id: number }) => {
        if (!selectedNetwork || !hasWallet) {
            toast.error(t('wallet.pleaseSelectNetworkAndWallet'))
            return
        }

        // Show deposit or withdraw view based on transaction type
        if (transaction.type === t('wallet.transactionTypes.deposit')) {
            setActiveView('deposit')
        } else if (transaction.type === t('wallet.transactionTypes.withdraw')) {
            setActiveView('withdraw')
        }
    }

    // Table styles from Untitled-2
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 dark:text-[#FE645F] uppercase bg-transparent"
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 dark:text-gray-300 bg-transparent border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    // Format balance number
    const formatBalance = (balance: number) => {
        const balanceFormatted = parseFloat(balance.toFixed(2))
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(balanceFormatted)
    }

    return (
        <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
            <div className='w-full max-w-7xl'>
                {/* Balance Section */}
                <div className='flex flex-col items-center justify-center mb-4 sm:mb-6'>
                    {isMobile ? (
                        // Mobile: Stack vertically, compact
                        <div className='flex flex-col items-center w-full'>
                            <div className='flex items-center gap-2 mb-2'>
                                <span className='text-xs font-medium text-theme-red-100 dark:text-[#FE645F]'>{t('wallet.coin')}:</span>
                                {isLoadingCoins ? (
                                    <Skeleton className="h-7 w-20" />
                                ) : (
                                    <CustomSelect
                                        id="coin"
                                        value={selectedCoin}
                                        onChange={handleCoinChange}
                                        options={coinOptions}
                                        placeholder={t('wallet.selectCoinPlaceholder')}
                                        disabled={isLoadingCoins}
                                        className="lg:w-20 text-xs"
                                    />
                                )}
                            </div>
                            <div className='flex items-center gap-2'>
                                <img src="/logo.png" alt="logo" className='w-8 h-8 object-cover' />
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
                                <img src="/logo.png" alt="logo" className='w-8 h-8 object-cover' />
                            </div>
                            {balanceResponse?.data && (balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                <span className='text-xs text-gray-600 dark:text-gray-300 mt-1'>
                                    ({t('wallet.gift')}: {formatBalance(balanceResponse.data.balance_gift)} | {t('wallet.reward')}: {formatBalance(balanceResponse.data.balance_reward)})
                                </span>
                            )}
                        </div>
                    ) : (
                        // Desktop: Original layout
                        <div className='flex items-end justify-center mb-3'>
                            <div className='flex flex-col items-center mx-4'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <span className='text-sm font-medium text-theme-red-100 dark:text-[#FE645F]'>{t('wallet.selectCoin')}:</span>
                                    {isLoadingCoins ? (
                                        <Skeleton className="h-8 w-24" />
                                    ) : (
                                        <CustomSelect
                                            id="coin"
                                            value={selectedCoin}
                                            onChange={handleCoinChange}
                                            options={coinOptions}
                                            placeholder={t('wallet.selectCoinPlaceholder')}
                                            disabled={isLoadingCoins}
                                            className="w-24 text-sm"
                                        />
                                    )}
                                </div>
                                {isLoadingBalance ? (
                                    <Skeleton className="h-8 w-48" />
                                ) : balanceResponse?.data ? (
                                    <div className='flex flex-col items-center'>
                                        <span className='text-2xl font-bold text-center text-pink-500 bg-theme-pink-100 py-2 mb-2 px-4 rounded-full'>
                                            {t('wallet.balanceLabel')}: {formatBalance(balanceResponse.data.balance)} {selectedCoinInfo?.coin_symbol || 'USDT'}
                                        </span>
                                        {(balanceResponse.data.balance_gift !== 0 || balanceResponse.data.balance_reward !== 0) && (
                                            <span className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                                                ({t('wallet.gift')}: {formatBalance(balanceResponse.data.balance_gift)} USDT | {t('wallet.reward')}: {formatBalance(balanceResponse.data.balance_reward)} USDT)
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className='text-2xl font-bold text-center text-pink-500'>
                                        {t('wallet.balanceLabel')}: 0.00 {selectedCoinInfo?.coin_symbol || 'USDT'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Network Selection Section */}
                <div className='mb-4 sm:mb-6 flex flex-col items-center justify-center'>
                    <label htmlFor="network" className='block mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-theme-red-100 dark:text-[#FE645F]'>
                        {t('wallet.selectNetwork')}
                    </label>
                    <CustomSelect
                        id="network"
                        value={selectedNetwork}
                        onChange={handleNetworkChange}
                        options={networkOptions}
                        placeholder={t('wallet.selectNetworkPlaceholder')}
                        disabled={isLoadingNetworks}
                        className="w-full max-w-[10rem] sm:max-w-56 text-sm"
                    />
                </div>

                {/* Deposit/Withdraw Buttons */}
                {selectedNetwork && (
                    <>
                        <div className='flex flex-row items-stretch sm:items-center justify-between max-w-xl mx-auto gap-3 sm:gap-10 mb-6 sm:mb-10 px-3 sm:px-0'>
                            <Button
                                onClick={handleDeposit}
                                disabled={!hasWallet || !selectedNetwork}
                                className='w-full cursor-pointer font-semibold uppercase sm:max-w-80 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 inline-flex text-white rounded-full border-none h-11 sm:h-12 text-base sm:text-lg hover:bg-theme-pink-100/80 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {t('wallet.depositButton')}
                            </Button>
                            <Button
                                onClick={handleWithdraw}
                                disabled={!hasWallet || !selectedNetwork}
                                className='w-full cursor-pointer font-semibold uppercase sm:max-w-80 bg-theme-pink-100 inline-flex text-pink-500 rounded-full border-pink-500 border-solid border h-11 sm:h-12 text-base sm:text-lg hover:bg-theme-pink-100/80 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {t('wallet.withdrawButton')}
                            </Button>
                        </div>

                        {activeView === 'main' && <div className='mb-4 sm:mb-6 flex flex-col items-center justify-center w-full px-3 sm:px-0'>
                            {isLoadingWalletCheck ? (
                                <Skeleton className="h-20 w-full max-w-2xl" />
                            ) : hasWallet ? (
                                <div className='w-full max-w-2xl p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-[#FE645F] shadow-sm'>
                                    <div className='flex items-center justify-between mb-1.5 sm:mb-2'>
                                        <label className='text-xs sm:text-sm font-medium text-theme-red-100 dark:text-[#FE645F]'>
                                            {t('wallet.walletAddress', { symbol: selectedNetworkInfo?.net_symbol })}:
                                        </label>
                                    </div>
                                    <div className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700'>
                                        <span className='text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 italic flex-1 break-all'>
                                            {formatAddress(walletAddress || '')}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(walletAddress || '', t('wallet.copyLabels.walletAddress'))}
                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent flex-shrink-0'
                                            title={t('wallet.copyAddress')}
                                        >
                                            <Copy className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='w-full max-w-2xl p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700'>
                                    <p className='text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 mb-2 sm:mb-3 text-center'>
                                        {t('wallet.noWalletForNetwork', { name: selectedNetworkInfo?.net_name, symbol: selectedNetworkInfo?.net_symbol })}
                                    </p>
                                    <Button
                                        onClick={confirmCreateWallet}
                                        disabled={createWalletMutation.isPending}
                                        className='w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-10 sm:h-12 hover:opacity-90'
                                    >
                                        {createWalletMutation.isPending ? (
                                            <>
                                                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                                {t('wallet.creatingWallet')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus className='w-4 h-4 mr-2' />
                                                {t('wallet.createWalletFor', { symbol: selectedNetworkInfo?.net_symbol })}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>}

                        {/* Deposit/Withdraw Content - Show below buttons */}
                        {activeView === 'deposit' && selectedNetwork && (
                            <DepositContent
                                networkId={selectedNetwork}
                                networkName={selectedNetworkInfo?.net_name}
                                networkSymbol={selectedNetworkInfo?.net_symbol}
                                coinSymbol={selectedCoinInfo?.coin_symbol}
                            />
                        )}

                        {activeView === 'withdraw' && selectedNetwork && (
                            <WithdrawContent
                                networkId={selectedNetwork}
                                networkName={selectedNetworkInfo?.net_name}
                                networkSymbol={selectedNetworkInfo?.net_symbol}
                                coinSymbol={selectedCoinInfo?.coin_symbol}
                                coinId={selectedCoin}
                                onSuccess={() => {
                                    // Optionally refresh balance or other data
                                    queryClient.invalidateQueries({ queryKey: ['balance', selectedCoin] })
                                }}
                            />
                        )}

                        {/* Transaction History - Only show when in main view */}
                        {activeView === 'main' && (
                            <>
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
                                            <div className="text-center py-12 px-4">
                                                <div className="text-gray-400 dark:text-gray-500 mb-2">
                                                    <Wallet className="w-12 h-12 mx-auto" />
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('wallet.noTransactions')}
                                                </p>
                                            </div>
                                        ) : (
                                            transactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    onClick={() => handleTransactionClick(transaction)}
                                                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                                                >
                                                    <TransactionCard
                                                        transaction={transaction}
                                                        onCopy={handleCopy}
                                                        formatAddress={formatAddress}
                                                        t={t}
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    // Desktop: Table Layout
                                    <div className="block overflow-hidden rounded-md bg-transparent border border-none">
                                        {/* Fixed Header */}
                                        <div className="overflow-hidden rounded-t-md">
                                            <table className={tableStyles}>
                                                <thead>
                                                    <tr>
                                                        <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>{t('wallet.tableHeaders.stt')}</th>
                                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.time')}</th>
                                                        <th className={`${tableHeaderStyles} w-[8%]`}>{t('wallet.tableHeaders.type')}</th>
                                                        <th className={`${tableHeaderStyles} w-[10%]`}>{t('wallet.tableHeaders.amount')}</th>
                                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.hash')}</th>
                                                        <th className={`${tableHeaderStyles} w-[11%] text-center rounded-r-lg`}>{t('wallet.tableHeaders.status')}</th>
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
                                                            <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg border-solid">
                                                                {t('wallet.noWithdrawTransactions')}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        transactions.map((transaction) => (
                                                            <tr
                                                                key={transaction.id}
                                                                className="group transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                onClick={() => handleTransactionClick(transaction)}
                                                            >
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
                                                                            {formatAddress(transaction.transactionId)}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleCopy(transaction.transactionId, t('wallet.copyLabels.transactionId'))}
                                                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent mt-1.5'
                                                                            title={t('wallet.copyAddress')}
                                                                        >
                                                                            <Copy className='w-3.5 h-3.5' />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className={`${tableCellStyles} w-[11%] text-center rounded-r-lg border-l-0 border-theme-gray-100 border-solid`}>
                                                                    <span
                                                                        className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${transaction.status === t('wallet.transactionStatus.complete')
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
                            </>
                        )}
                    </>
                )}


            </div>
        </div>
    )
}