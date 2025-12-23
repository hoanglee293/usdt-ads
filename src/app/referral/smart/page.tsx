"use client"

import { useState } from "react"
import {
    Copy,
    ChevronUp,
    ChevronDown,
    User,
    Check,
    ExternalLink,
    Link2,
    Gift,
    X,
    AlertCircle,
    Calendar,
    DollarSign,
    Activity,
    Wallet,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSmartRefInfo, getSmartRefTree, getSmartRefDetail, createSmartRefWithdraw } from "@/services/RefService";
import { useLang } from "@/lang";
import toast from "react-hot-toast";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/ui/use-mobile";

export default function DirectReferralPage() {
    const { t } = useLang();
    const { profile } = useProfile();
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();
    console.log(profile);
    const [showReferralStructure, setShowReferralStructure] = useState(true)
    const [activeTab, setActiveTab] = useState("level-referral") // 'level-referral', 'referred-users'
    const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined)

    // Fetch Smart Ref Info
    const { data: smartRefInfo = {} as any, isLoading: isLoadingInfo } = useQuery({
        queryKey: ["smartRefInfo"],
        queryFn: getSmartRefInfo,
    });

    // Fetch Smart Ref Tree
    const { data: smartRefTree = {} as any, isLoading: isLoadingTree } = useQuery({
        queryKey: ["smartRefTree"],
        queryFn: getSmartRefTree,
    });

    // Fetch Smart Ref Detail (with level filter)
    const { data: smartRefDetail = {} as any, isLoading: isLoadingDetail } = useQuery({
        queryKey: ["smartRefDetail", selectedLevel],
        queryFn: () => getSmartRefDetail(selectedLevel),
    });

    // Withdraw mutation
    const withdrawMutation = useMutation({
        mutationFn: createSmartRefWithdraw,
        onSuccess: (data) => {
            toast.success(t('ref.withdrawSuccess') || 'Withdraw successful');
            queryClient.invalidateQueries({ queryKey: ['smartRefInfo'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('ref.withdrawError') || 'Failed to withdraw';
            toast.error(message);
        },
    });

    const handleCopyLink = async () => {
        try {
            const referralLink = `https://usda-demo.vercel.app/?ref=${profile?.ref || ''}`;
            await navigator.clipboard.writeText(referralLink);
            toast.success(t('ref.linkCopied') || 'Link copied successfully');
        } catch (err) {
            toast.error(t('ref.copyFailed') || 'Failed to copy link');
        }
    }

    const handleWithdraw = () => {
        const totalCanWithdraw = smartRefInfo.data?.total_can_withdraw || 0;
        
        if (totalCanWithdraw < 10) {
            toast.error(t('ref.minimumWithdrawError', { amount: totalCanWithdraw.toFixed(2) }) || `Minimum withdrawal amount is $10. Current amount is $${totalCanWithdraw.toFixed(2)}`);
            return;
        }

        if (withdrawMutation.isPending) {
            return;
        }

        withdrawMutation.mutate();
    }

    // Format date to display in a more readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }

    // Filter users based on selected level
    const filteredUsers = selectedLevel
        ? (smartRefDetail.data || []).filter((user: any) => user.level === selectedLevel)
        : (smartRefDetail.data || []);

    return (
        <div className="w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1">
            <div className="w-full max-w-7xl space-y-6">
                {/* Title Section */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
                    <h1 className="text-xl sm:text-3xl md:text-4xl text-gradient-secondary text-center">
                        {t('ref.title')}
                    </h1>
                </div>

                {/* Your Referral Link Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-solid border-gray-200 dark:border-[#FE645F] shadow-sm p-4 sm:p-6">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('ref.yourReferralLink') || 'Your Referral Link'}
                    </label>
                    <div className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            value={`https://usda-demo.vercel.app/?ref=${profile?.ref || ''}`}
                            readOnly
                            className="flex-1 bg-gray-50 dark:bg-gray-900/50 text-sm sm:text-base px-3 py-2 rounded-md border border-theme-gray-100 dark:border-gray-700 border-solid text-gray-500 dark:text-gray-400"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-none absolute right-2 top-1/2 transform -translate-y-1/2 rounded-md p-2 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    {/* Total Branches Card */}
                    <div className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 rounded-lg p-4 sm:px-6 sm:py-4 gap-2 text-white shadow-lg flex flex-col justify-between order-1 sm:order-1">
                        <h3 className="text-sm font-medium opacity-90">
                            {t('ref.totalBranches') || 'Total Branches'}
                        </h3>
                        <p className="text-2xl sm:text-3xl font-semibold">
                            {isLoadingInfo ? '...' : (smartRefInfo.data?.total_branches || 0)}
                        </p>
                    </div>

                    {/* Total Can Withdraw Card */}
                    <div className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 rounded-lg p-4 sm:px-6 sm:py-4 gap-2 text-white shadow-lg flex flex-col justify-between order-3 sm:order-2 col-span-2 sm:col-span-1">
                        <h3 className="text-sm font-medium opacity-90">
                            {t('ref.totalCanWithdraw') || 'Total Can Withdraw'}
                        </h3>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl sm:text-3xl font-semibold flex-1">
                                ${isLoadingInfo ? '...' : (typeof smartRefInfo.data?.total_can_withdraw === 'number' ? smartRefInfo.data.total_can_withdraw.toFixed(2) : '0.00')}
                            </p>
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawMutation.isPending || isLoadingInfo || (smartRefInfo.data?.total_can_withdraw || 0) < 10}
                                className="px-3 bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-600 border-none font-medium rounded-full py-2 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wallet className="w-4 h-4" />
                                {withdrawMutation.isPending ? (t('common.loading') || 'Loading...') : (t('ref.withdraw') || 'Withdraw')}
                            </button>
                        </div>

                    </div>

                    {/* Total Invitees Card */}
                    <div className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 rounded-lg p-4 sm:px-6 sm:py-4 gap-2 text-white shadow-lg flex flex-col justify-between order-2 sm:order-3">
                        <h3 className="text-sm font-medium opacity-90">
                            {t('ref.totalInvitees') || 'Total Invitees'}
                        </h3>
                        <p className="text-2xl sm:text-3xl font-semibold">
                            {isLoadingInfo ? '...' : (smartRefInfo.data?.total_invitees || 0)}
                        </p>
                    </div>
                </div>



                {/* Referral Structure Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-solid border-theme-gray-100 dark:border-[#FE645F] shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                            {t('ref.referralStructure') || 'Referral Structure'}
                        </h2>
                        <button
                            onClick={() => setShowReferralStructure(!showReferralStructure)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-0.5 border-none rounded-full transition-colors flex items-center gap-1 text-sm"
                        >
                            {showReferralStructure ? (
                                <>
                                    {t('ref.hide') || 'Hide'} <ChevronUp className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    {t('ref.show') || 'Show'} <ChevronDown className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                    {showReferralStructure && (
                        <div className="flex flex-col items-center ">
                            {smartRefInfo.data?.reward_levels && smartRefInfo.data.reward_levels.length > 0 ? (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg text-white text-sm font-semibold">
                                            You
                                        </div>
                                    {/* Top Level */}
                                    <div className="flex flex-col items-center gap-2 relative">
                                        <div className="w-[2px] h-10 bg-gradient-to-b from-pink-400 to-purple-400"/>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {smartRefInfo.data.reward_levels.find((rl: any) => rl.level === 1)?.percentage || 0}%
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        {smartRefInfo.data.max_level > 1 && (
                                            <div className="absolute top-[105%] left-1/2 transform w-[2px] h-10 bg-gradient-to-b from-pink-400 to-purple-400"></div>
                                        )}
                                    </div>

                                    {/* Connection Lines */}
                                    {smartRefInfo.data.max_level > 1 && (
                                        <div className="flex items-center justify-center space-x-8 sm:space-x-16 mt-12 w-60 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400">
                                            
                                        </div>
                                    )}

                                    {/* Bottom Level */}
                                    {smartRefInfo.data.max_level > 1 && (() => {
                                        const level2Rewards = smartRefInfo.data.reward_levels.filter((rl: any) => rl.level > 1);
                                        const level2Percentage = level2Rewards.length > 0 ? level2Rewards[0].percentage : 0;
                                        // Luôn hiển thị 2 thành phần ở cấp 2 để minh họa
                                        const displayItems = [level2Percentage, level2Percentage];
                                        
                                        return (
                                            <div className="flex items-center justify-between w-72 mt-[34px]">
                                                {displayItems.map((percentage, index) => (
                                                    <div key={index} className="flex flex-col items-center relative">
                                                        <div className="absolute bottom-[103%] left-1/2 transform w-[2px] h-8 bg-gradient-to-b from-pink-400 to-purple-400"></div>
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                                                            <User className="w-8 h-8 text-white" />
                                                        </div>
                                                        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                            {percentage}%
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>{t('ref.noData') || 'No data available'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Your Referrals Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-solid border-theme-gray-100 dark:border-[#FE645F] shadow-sm p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        {t('ref.yourReferrals') || 'Your Referrals'}
                    </h2>
                    <div className="flex gap-6 border-b border-gray-300 dark:border-gray-700 mb-4">
                        <button
                            onClick={() => setActiveTab("level-referral")}
                            className={`py-2 text-sm border-0 bg-transparent font-medium border-b-2 cursor-pointer transition-colors ${activeTab === "level-referral"
                                ? "border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            {t('ref.levelReferral') || 'Level Referral'}
                        </button>
                        <button
                            onClick={() => setActiveTab("referred-users")}
                            className={`py-2 text-sm border-0 font-medium bg-transparent border-b-2 cursor-pointer transition-colors ${activeTab === "referred-users"
                                ? "border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            {t('ref.referredUsers') || 'Referred Users'}
                        </button>
                    </div>

                    {/* Level Referral Tab Content */}
                    {activeTab === "level-referral" && (
                        <div className="mt-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
                                <div className="bg-transparent p-2 sm:p-3 text-center">
                                    &ensp;
                                </div>
                                <div className="bg-theme-red-200 rounded-lg p-2 sm:p-3 text-center">
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                        {t('ref.totalTransactions') || 'Total Transactions'}
                                    </p>
                                </div>
                                <div className="bg-theme-red-200 rounded-lg p-2 sm:p-3 text-center">
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                        {t('ref.totalRewards') || 'Total Rewards'}
                                    </p>
                                </div>
                                <div className="bg-theme-red-200 rounded-lg p-2 sm:p-3 text-center">
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                        {t('ref.totalWithdrawn') || 'Total Withdrawn'}
                                    </p>
                                </div>
                            </div>

                            {/* Level Referral Rows */}
                            <div className="space-y-4">
                                {isLoadingTree ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{t('common.loading')}</p>
                                    </div>
                                ) : smartRefTree.data && smartRefTree.data.length > 0 ? (
                                    smartRefTree.data.map((item: any) => (
                                        <div key={item.level} className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">
                                                {t('ref.level') || 'Level'} {item.level}
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 border-solid border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 text-center">
                                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                    {item.total_transactions || 0}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 border-solid border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 text-center">
                                                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-bold">
                                                    ${typeof item.total_rewards === 'number' ? item.total_rewards.toFixed(2) : '0.00'}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 border-solid border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 text-center">
                                                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold">
                                                    ${typeof item.total_withdrawn === 'number' ? item.total_withdrawn.toFixed(2) : '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>{t('ref.noData') || 'No data available'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Referred Users Tab Content */}
                    {activeTab === "referred-users" && (
                        <div className="mt-4">
                            {/* Level Filter */}
                            <div className="flex flex-wrap gap-2 mb-4 bg-transparent rounded-md">
                                <button
                                    onClick={() => setSelectedLevel(undefined)}
                                    className={`px-3 py-1 text-xs border-none font-medium rounded-md transition-colors ${selectedLevel === undefined
                                        ? "bg-purple-600 dark:bg-purple-500 text-white"
                                        : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {t('ref.all') || 'All'}
                                </button>
                                {smartRefInfo.data?.max_level &&
                                    Array.from({ length: smartRefInfo.data.max_level }, (_, i) => i + 1).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setSelectedLevel(level)}
                                            className={`px-3 py-1 text-xs border-none font-medium rounded-md transition-colors ${selectedLevel === level
                                                ? "bg-purple-600 dark:bg-purple-500 text-white"
                                                : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                                }`}
                                        >
                                            {t('ref.level') || 'Level'} {level}
                                        </button>
                                    ))
                                }
                            </div>

                            {/* Users Table/Cards */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {/* Table Headers - Desktop Only */}
                                {!isMobile && (
                                    <div className="grid grid-cols-5 gap-2 p-3 text-xs font-medium text-purple-600 dark:text-purple-400 bg-transparent border-b border-gray-200 dark:border-gray-700">
                                        <div className="px-2 py-1">{t('ref.user') || 'User'}</div>
                                        <div className="px-2 py-1 text-center">
                                            <Calendar className="w-3 h-3 inline mr-1" />
                                            {t('ref.joinDate') || 'Join Date'}
                                        </div>
                                        <div className="px-2 py-1 text-center">{t('ref.level') || 'Level'}</div>
                                        <div className="px-2 py-1 text-center">{t('ref.transactions') || 'Transactions'}</div>
                                        <div className="px-2 py-1 text-center">
                                            <DollarSign className="w-3 h-3 inline mr-1" />
                                            {t('ref.rewards') || 'Rewards'}
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="overflow-y-auto">
                                    {isLoadingDetail ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{t('common.loading')}</p>
                                        </div>
                                    ) : filteredUsers.length > 0 ? (
                                        <div className={isMobile ? "space-y-3 p-3" : "flex flex-col gap-2 p-2"}>
                                            {filteredUsers.map((user: any) => (
                                                isMobile ? (
                                                    // Mobile Card Layout
                                                    <div
                                                        key={user.uid}
                                                        className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    >
                                                        {/* User Info Section */}
                                                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <User className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                                                                    {user.display_name || t('ref.unknown') || 'Unknown'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.uid}</p>
                                                            </div>
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex-shrink-0">
                                                                {t('ref.level') || 'Level'} {user.level}
                                                            </span>
                                                        </div>

                                                        {/* Details Grid */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    <span>{t('ref.joinDate') || 'Join Date'}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {user.join_date ? formatDate(user.join_date) : '-'}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    <Activity className="w-3.5 h-3.5" />
                                                                    <span>{t('ref.transactions') || 'Transactions'}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {user.total_transactions || 0}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Rewards Section */}
                                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    <DollarSign className="w-3.5 h-3.5" />
                                                                    <span>{t('ref.rewards') || 'Rewards'}</span>
                                                                </div>
                                                                <p className="text-base font-bold text-green-600 dark:text-green-400">
                                                                    ${typeof user.total_rewards === 'number' ? user.total_rewards.toFixed(2) : '0.00'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Desktop Grid Layout
                                                    <div
                                                        key={user.uid}
                                                        className="grid grid-cols-5 gap-2 items-center border-solid border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-3 rounded-md overflow-hidden"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                    {user.display_name || t('ref.unknown') || 'Unknown'}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">ID: {user.uid}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-center text-xs text-gray-700 dark:text-gray-300">
                                                            {user.join_date ? formatDate(user.join_date) : '-'}
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                                                {t('ref.level') || 'Level'} {user.level}
                                                            </span>
                                                        </div>
                                                        <div className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {user.total_transactions || 0}
                                                        </div>
                                                        <div className="text-center text-xs font-bold text-green-600 dark:text-green-400">
                                                            ${typeof user.total_rewards === 'number' ? user.total_rewards.toFixed(2) : '0.00'}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <p>{t('ref.noReferredUsers') || 'No referred users'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
