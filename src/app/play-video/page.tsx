'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Loader2, PlayCircle, CheckCircle2, Clock, ArrowLeft, Video, ArrowRight, Gift, Eye, Smartphone } from 'lucide-react';

import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMissionNow, watchVideo, claimMissionReward, claimDay, type MissionNowResponse } from '@/services/StakingService';
import { useLang } from '@/lang/useLang';
import toast from 'react-hot-toast';
import { Card } from '@/ui/card';
import { Progress } from '@/ui/progress';

type ViewState = 'idle' | 'connecting' | 'watching' | 'countdown' | 'completed';

export default function PlayVideoPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t } = useLang();

    // GAM Ad Unit ID - TODO: Replace with actual Ad Unit ID from Google Ad Manager
    const AD_UNIT_ID = process.env.NEXT_PUBLIC_GAM_AD_UNIT_ID || '/123456789/rewarded_ad';
    const GAM_TEST_MODE = process.env.NEXT_PUBLIC_GAM_TEST_MODE === 'true';

    const { isLoaded, isLoading: isLoadingAd, error: adError, showAd, earnedReward, isReady } = useRewardedAd({
        adUnitId: AD_UNIT_ID,
        autoLoad: true,
    });

    // Mock earnedReward for testing when GAM fails (development only)
    const [mockEarnedReward, setMockEarnedReward] = useState(false);

    const [viewState, setViewState] = useState<ViewState>('idle');
    const [devicesCount, setDevicesCount] = useState(0);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [videoWatched, setVideoWatched] = useState(false); // Đánh dấu đã xem xong video nhưng chưa gọi API

    // Get mission progress
    const { data: missionNowResponse, isLoading: isLoadingMission, error: missionError } = useQuery<MissionNowResponse>({
        queryKey: ['mission-now'],
        queryFn: getMissionNow,
        retry: false,
        refetchInterval: false, // Only refetch when idle
        // refetchInterval: viewState === 'idle' ? 30000 : false, // Only refetch when idle
    });

    // Watch video mutation
    const watchVideoMutation = useMutation({
        mutationFn: watchVideo,
        onSuccess: async (data) => {
            console.log('✅ watchVideo API success:', data);

            // Reset mock reward if in test mode
            if (GAM_TEST_MODE) {
                setMockEarnedReward(false);
            }

            // Invalidate và refetch query mission-now để cập nhật time_watch_new cho countdown
            queryClient.invalidateQueries({ queryKey: ['mission-now'] });
            await queryClient.refetchQueries({ queryKey: ['mission-now'] });

            // Invalidate các queries liên quan khác
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] });
            queryClient.invalidateQueries({ queryKey: ['current-staking'] });

            // Chuyển sang màn hình countdown sau khi API thành công và data đã được refetch
            console.log('🔄 Switching to countdown screen after API success');
            setViewState('countdown');
        },
        onError: (error: any) => {
            console.error('❌ watchVideo API error:', error);
            const message = error?.response?.data?.message || t('makeMoney.playVideo.watchError');
            toast.error(message);
            // Nếu lỗi khi gọi API sau khi xem video, user vẫn ở màn hình watching hoặc quay về idle?
            // Tạm thời quay về idle để user thử lại
            setViewState('idle');
            setVideoWatched(false);
        },
    });

    // Claim day reward mutation
    const claimDayMutation = useMutation({
        mutationFn: claimDay,
        onSuccess: async (data) => {
            toast.success(t('makeMoney.playVideo.claimDaySuccess'));

            // Reset view state về idle để render lại UI
            setViewState('idle');
            setVideoWatched(false);

            // Invalidate và refetch tất cả queries liên quan
            queryClient.invalidateQueries({ queryKey: ['mission-now'] });
            queryClient.invalidateQueries({ queryKey: ['current-staking'] });
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] });
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] });

            // Refetch để cập nhật trạng thái mới nhất ngay lập tức
            await queryClient.refetchQueries({ queryKey: ['mission-now'] });
            await queryClient.refetchQueries({ queryKey: ['current-staking-with-missions'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('makeMoney.playVideo.claimError');
            toast.error(message);
        },
    });

    // Claim reward mutation (for final reward when staking ends)
    const claimRewardMutation = useMutation({
        mutationFn: claimMissionReward,
        onSuccess: (data) => {
            const rewardAmount = data?.data?.total_reward || 0;
            toast.success(
                `${t('makeMoney.playVideo.claimSuccess')}! ${t('makeMoney.playVideo.reward')}: ${rewardAmount} USDT`
            );
            queryClient.invalidateQueries({ queryKey: ['mission-now'] });
            queryClient.invalidateQueries({ queryKey: ['current-staking'] });
            queryClient.invalidateQueries({ queryKey: ['current-staking-with-missions'] });
            queryClient.invalidateQueries({ queryKey: ['staking-histories'] });

            // Quay về trang make-money sau khi claim thành công
            setTimeout(() => {
                router.push('/make-money');
            }, 2000);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('makeMoney.playVideo.claimError');
            toast.error(message);
        },
    });

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if completed (đã xem đủ video)
    const isCompleted = useMemo(() => {
        if (!missionNowResponse?.data) return false;
        const { turn_day, turn_setting } = missionNowResponse.data;
        return turn_day >= turn_setting;
    }, [missionNowResponse]);

    // Calculate time remaining for countdown
    const countdownRemaining = useMemo(() => {
        if (!missionNowResponse?.data || !missionNowResponse.data.time_watch_new) {
            // Nếu time_watch_new là null (chưa xem lần nào), countdown = 0
            return 0;
        }

        const { time_watch_new, time_gap } = missionNowResponse.data;
        const lastWatchTime = new Date(time_watch_new);
        const nextWatchTime = new Date(lastWatchTime.getTime() + time_gap * 60 * 1000);
        const remaining = Math.max(0, nextWatchTime.getTime() - currentTime.getTime());

        return remaining;
    }, [missionNowResponse, currentTime]);

    // Check if countdown finished
    const isCountdownFinished = useMemo(() => {
        if (missionNowResponse?.data?.time_watch_new === null) return true; // Chưa xem lần nào thì coi như đã finish countdown
        return countdownRemaining === 0;
    }, [countdownRemaining, missionNowResponse]);

    // Auto-switch to countdown state if in cooldown
    useEffect(() => {
        // Nếu đang ở idle và countdown chưa kết thúc → chuyển sang countdown
        if (viewState === 'idle' && !isCountdownFinished && !isCompleted && missionNowResponse?.data) {
            console.log('⏳ User is in cooldown, switching to countdown state');
            setViewState('countdown');
        }
        // Nếu đang ở connecting và countdown chưa kết thúc → chuyển sang countdown (không cho phép xem video)
        else if (viewState === 'connecting' && !isCountdownFinished && !isCompleted && missionNowResponse?.data) {
            console.log('⏳ Countdown chưa kết thúc, chuyển từ connecting sang countdown state');
            setViewState('countdown');
        }
        // Lưu ý: Không tự động chuyển từ watching sang countdown
        // Vì khi đang xem video (watching), phải giữ nguyên state watching cho đến khi xem xong
        // Chỉ khi xem xong video (earnedReward = true) mới chuyển sang countdown (xử lý ở useEffect khác)
    }, [viewState, isCountdownFinished, isCompleted, missionNowResponse]);

    // Format time remaining
    const formatTimeRemaining = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle reward earned from ad (real GAM or mock) - Chuyển sang countdown sau khi xem xong
    const actualEarnedReward = GAM_TEST_MODE ? mockEarnedReward : earnedReward;

    useEffect(() => {
        // Khi xem xong ad (rewarded) → Gọi API watchVideo
        // State sẽ được chuyển sang countdown trong onSuccess callback của mutation
        if (actualEarnedReward && viewState === 'watching' && !videoWatched) {
            console.log('✅ Reward earned, calling watchVideo API...');
            setVideoWatched(true);

            // Gọi API watchVideo - state sẽ được chuyển sang countdown trong onSuccess
            watchVideoMutation.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actualEarnedReward, viewState, videoWatched]);

    // Chuyển sang state "watching" khi state "connecting" đã gọi API thành công
    // Lưu ý: Logic kiểm tra countdown được xử lý bởi useEffect auto-switch ở trên
    // Nếu countdown chưa kết thúc, useEffect auto-switch sẽ chuyển từ connecting sang countdown
    // Nên ở đây chỉ cần kiểm tra nếu vẫn còn ở connecting thì mới chuyển sang watching
    // Chuyển sang state "watching" khi state "connecting" đã gọi API thành công
    // Lưu ý: Logic kiểm tra countdown được xử lý bởi useEffect auto-switch ở trên
    // Nếu countdown chưa kết thúc, useEffect auto-switch sẽ chuyển từ connecting sang countdown
    // Nên ở đây chỉ cần kiểm tra nếu vẫn còn ở connecting thì mới chuyển sang watching
    useEffect(() => {
        if (viewState === 'connecting' && !isLoadingMission && missionNowResponse?.data) {
            // Chỉ chuyển sang watching nếu countdown đã kết thúc hoặc chưa xem lần nào
            // Nếu countdown chưa kết thúc, useEffect auto-switch sẽ chuyển sang countdown trước
            if (!isCountdownFinished && !isCompleted) {
                // Không làm gì, để useEffect auto-switch xử lý
                return;
            }

            console.log('✅ API mission-now loaded, waiting 5s before switching to watching state...');

            // Wait 5 seconds before switching to watching state
            const timer = setTimeout(() => {
                console.log('✅ 5s passed, switching to watching state...');
                setViewState('watching');

                // Show ad sau khi chuyển sang watching
                if (GAM_TEST_MODE) {
                    // Test mode: Mock ad watching (simulate 5 seconds of watching)
                    console.log('🧪 TEST MODE: Simulating ad watch...');
                    setTimeout(() => {
                        console.log('🧪 TEST MODE: Mock reward earned');
                        setMockEarnedReward(true);
                    }, 5000); // Simulate 5 seconds of watching
                } else {
                    // Production mode: Show real GAM ad
                    showAd();
                }
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [viewState, isLoadingMission, missionNowResponse, GAM_TEST_MODE, showAd, isCountdownFinished, isCompleted]);

    // // Gọi API watchVideo chỉ khi countdown đã hết và đã xem xong video
    // useEffect(() => {
    //     if (videoWatched && viewState === 'countdown') {
    //         console.log('✅ check', missionNowResponse?.data?.time_watch_new);
    //         console.log('✅ check', isCountdownFinished);
    //         // Nếu là lần xem đầu tiên (time_watch_new === null), gọi API ngay
    //         const isFirstWatch = missionNowResponse?.data?.time_watch_new;

    //         if (isCountdownFinished) {
    //             console.log('✅ Countdown finished (or first watch), calling watchVideo API...');
    //             watchVideoMutation.mutate();
    //             setVideoWatched(false); // Reset flag sau khi gọi API
    //         }
    //     }
    // }, [videoWatched, isCountdownFinished, viewState, missionNowResponse]);

    // Reset view state when mission data changes (after refetch)
    useEffect(() => {
        if (viewState === 'countdown' && isCountdownFinished) {
            // Countdown finished, ready to show Next button
        } else if (viewState === 'countdown' && !isCountdownFinished) {
            // Still counting down
        } else if (viewState !== 'idle' && viewState !== 'completed' && !isLoadingMission) {
            // Reset to idle if not in a persistent state
            // This handles the case when user navigates away and comes back
        }
    }, [viewState, isCountdownFinished, isLoadingMission]);

    // Redirect if no active staking
    useEffect(() => {
        if (missionError && (missionError as any)?.response?.status === 400) {
            toast.error(t('makeMoney.playVideo.noActiveStaking'));
            setTimeout(() => {
                router.push('/make-money');
            }, 2000);
        }
    }, [missionError, router, t]);

    // Auto reset to idle when countdown finishes (optional, or show Next button)
    // We'll show Next button instead of auto-reset for better UX

    const handleWatchVideo = async () => {
        console.log('🎬 handleWatchVideo called', { isReady, isLoaded, isLoadingAd, viewState });

        // Kiểm tra nếu countdown chưa kết thúc → chuyển sang countdown state
        if (!isCountdownFinished && !isCompleted && missionNowResponse?.data) {
            console.log('⏳ Countdown chưa kết thúc, chuyển sang countdown state');
            setViewState('countdown');
            return;
        }

        if (!isReady && GAM_TEST_MODE) {
            toast.error(t('makeMoney.playVideo.adNotReady') + ' - ' + (adError?.message || 'Service đang khởi tạo...'));
            return;
        }

        if (!isLoaded && !isLoadingAd && !GAM_TEST_MODE) {
            // Try to load ad first - ad will load automatically via autoLoad
            toast.error(t('makeMoney.playVideo.adNotReady'));
            return;
        }

        // Bắt đầu flow xem video: Connecting -> Watching -> (Xem xong) -> Gọi API
        const devices = missionNowResponse?.data?.devices || 0;
        setDevicesCount(devices);

        // Chuyển sang state connecting
        console.log('🔄 Setting viewState to connecting');
        setViewState('connecting');

        // Gọi lại API getMissionNow để lấy time_watch_new mới nhất
        console.log('🔄 Refetching mission-now API...');
        await queryClient.refetchQueries({ queryKey: ['mission-now'] });

        // Note: Việc chuyển sang state "watching" sẽ được xử lý bởi useEffect khi API trả về và có time_watch_new
    };

    const handleNext = () => {
        setViewState('idle');
        setVideoWatched(false); // Reset flag khi quay về idle
        // Refetch mission data to get latest status
        queryClient.invalidateQueries({ queryKey: ['mission-now'] });
    };

    const handleClaimReward = () => {
        // Sử dụng claimDay API để claim phần thưởng của ngày
        claimDayMutation.mutate();
    };

    // Calculate progress percentage based on missionData (same as line 365-367)
    const progress = useMemo(() => {
        const missionData = missionNowResponse?.data;
        if (!missionData) return 0;
        const { turn_day, turn_setting } = missionData;
        if (turn_setting > 0) {
            // Đảm bảo progress không vượt quá 100%
            return Math.min(100, Math.round((turn_day / turn_setting) * 100));
        }
        return 0;
    }, [missionNowResponse]);

    if (isLoadingMission) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">{t('makeMoney.playVideo.loading')}</p>
                </div>
            </div>
        );
    }

    const missionData = missionNowResponse?.data;

    // Render Countdown Screen
    if (viewState === 'countdown') {
        const totalDuration = (missionNowResponse?.data?.time_gap || 0) * 60 * 1000;
        const radius = 60;
        const stroke = 6;
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = totalDuration ? circumference - (countdownRemaining / totalDuration) * circumference : 0;

        return (
            <div className="w-full min-h-screen lg:py-[15vh] bg-[radial-gradient(100%_100%_at_50%_0%,_#45a6e7_0%,_#e1e7ec_50%,_#a979da_100%)] dark:bg-gray-950 flex flex-col items-center justify-between py-28 px-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />

                {/* Top Content */}
                <div className="w-full max-w-md flex flex-col items-center space-y-6 z-10 md:pt-10">
                    {/* Progress Pill */}
                    <div className="bg-white dark:bg-gray-800 rounded-full px-6 py-2 shadow-md shadow-blue-100 dark:shadow-none flex items-center gap-1.5 transform transition-all">
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm whitespace-nowrap">
                            {t('makeMoney.playVideo.watched') || 'Đã xem'}
                        </span>
                        <span className="text-[#ef4444] font-bold text-base">
                            {missionData?.turn_day || 0}/{missionData?.turn_setting || 200}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                            video
                        </span>
                    </div>
                </div>

                {/* Center Timer Section */}
                <div className="flex flex-col items-center justify-center z-10 w-full mb-10">
                    {!isCountdownFinished ? (
                        <div className="relative flex items-center justify-center mb-8">
                            {/* Circular Progress */}
                            <svg
                                height={radius * 2 * 1.5}
                                width={radius * 2 * 1.5}
                                className="transform -rotate-90 scale-150"
                            >
                                <circle
                                    stroke="currentColor"
                                    fill="transparent"
                                    strokeWidth={stroke}
                                    r={normalizedRadius}
                                    cx={radius * 1.5}
                                    cy={radius * 1.5}
                                    className="text-slate-400 dark:text-slate-700"
                                />
                                <circle
                                    stroke="currentColor"
                                    fill="transparent"
                                    strokeWidth={stroke}
                                    strokeDasharray={circumference + ' ' + circumference}
                                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                    strokeLinecap="round"
                                    r={normalizedRadius}
                                    cx={radius * 1.5}
                                    cy={radius * 1.5}
                                    className="text-[#d946ef]"
                                />
                                {/* Current Position Indicator (Dot) */}
                                {/* Note: Calculating exact position for dot is complex in CSS/SVG alone without JS for angles, 
                                    ignoring purely visual dot for now or adding simpler implementation if needed strict fidelity */}
                            </svg>

                            {/* Time Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl md:text-5xl font-bold text-[#f43f5e]">
                                    {formatTimeRemaining(countdownRemaining)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center w-full space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('makeMoney.playVideo.countdownFinished')}
                            </h2>
                        </div>
                    )}

                    {!isCountdownFinished && (
                        <p className="text-[#e13c9c] text-center font-medium italic max-w-xs animate-pulse">
                            {t('makeMoney.playVideo.waitForNext', { minutes: missionData?.time_gap || 2 }) || `Bạn phải đợi sau ${missionData?.time_gap || 2} phút thì mới được xem tiếp video`}
                        </p>
                    )}
                </div>

                {/* Bottom Action */}
                <div className="w-full max-w-md z-10">
                    <Button
                        onClick={handleNext}
                        disabled={!isCountdownFinished}
                        className={`w-full rounded-[2rem] h-10 md:h-14 text-sm md:text-lg font-bold cursor-pointer transition-all duration-300 border-none uppercase ${isCountdownFinished
                            ? 'bg-gradient-primary hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:scale-[1.02]'
                            : 'bg-[#9ca3af] text-white/90 cursor-not-allowed'
                            }`}
                    >
                        {t('makeMoney.playVideo.next') || 'NEXT'}
                    </Button>
                </div>
            </div>
        );
    }



    // Render Watching Video Screen
    if (viewState === 'watching') {
        return (
            <div className="w-full min-h-screen lg:py-[15vh] bg-[radial-gradient(100%_100%_at_50%_0%,_#45a6e7_0%,_#e1e7ec_50%,_#a979da_100%)] dark:bg-gray-950 flex flex-col items-center justify-between py-20 px-6 relative overflow-hidden">
                {/* Ad Container - GAM will inject ad here */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />
                <div id="rewarded-ad-container" className="absolute inset-0 z-0 bg-transparent" />

                {/* Overlay while loading ad or if ad is hidden */}
                <div className="z-10 bg-white dark:bg-gray-800 backdrop-blur-lg p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 animate-pulse">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">{t('makeMoney.playVideo.watching')}</h3>
                    <p className="text-blue-100/80 text-sm">
                        {t('makeMoney.playVideo.watchToComplete')}
                    </p>
                </div>
            </div>
        );
    }

    // Render Main Screen (Idle or Completed)
    return (
        <div className="w-full min-h-screen bg-[radial-gradient(100%_100%_at_50%_0%,_#45a6e7_0%,_#e1e7ec_50%,_#a979da_100%)] dark:bg-gray-950 flex flex-col items-center justify-between py-32 px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-320/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />

            {/* Top Content */}
            <div className="w-full max-w-md flex flex-col items-center z-10 pt-0 md:pt-20">
                {/* Logo Area */}
                <div className="relative mb-4 md:mb-6">
                    <img src="/logo.png" alt="logo" className="w-16 md:w-32 h-16 md:h-32 object-contain" />
                </div>

                {/* Status Section */}
                <div className="flex flex-col items-center space-y-4 w-full md:space-y-6">
                    {/* Progress Pill */}
                    <div className="bg-white dark:bg-gray-800 rounded-full px-8 py-2 shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2 transform transition-all hover:scale-105">
                        <span className="text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            {t('makeMoney.playVideo.watched') || 'Đã xem'}
                        </span>
                        <span className={`font-semibold text-lg ${isCompleted ? 'text-green-500' : 'text-[#ef4444]'}`}>
                            {missionData?.turn_day || 0}/{missionData?.turn_setting || 200}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                            video
                        </span>
                    </div>

                    {/* Devices Info */}
                    {!isCompleted && (
                        <div className="flex items-center gap-2 text-theme-red-200 font-semibold bg-transparent px-4 py-2 rounded-lg">
                        <Eye className="w-6 h-6" />
                        <span className="text-base">
                            {(missionData?.devices || 20) > 0 ? missionData?.devices : 20} {t('makeMoney.playVideo.devicesWatching') || 'thiết bị khác xem video'}
                        </span>
                    </div>
                    )}
                </div>
            </div>
            {isCompleted && (
                <div className="w-full max-w-md z-10 pb-6 flex flex-col gap-5 justify-center items-center">
                   <img src="/complete.png" alt="completed" className="w-52 h-auto object-contain" />
                   <p className="text-red-500 font-semibold text-sm px-10 text-center"> {t('makeMoney.playVideo.readyToClaim') || 'Bạn đã hoàn thành tất cả video cho ngày hôm nay. Hãy quay lại trang Make Money để nhận thưởng.'} </p>
                </div>
            )}
            {/* Bottom Action */}
            <div className="w-full max-w-md z-10 pb-6 flex justify-center items-center">
                {isCompleted ? (
                    <Button
                        onClick={handleClaimReward}
                        disabled={claimDayMutation.isPending}
                        className="w-full bg-gradient-primary hover:from-emerald-600 hover:to-teal-700 text-white rounded-[2rem] h-10 md:h-16 text-sm md:text-xl font-bold shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none cursor-pointer"
                    >
                        {claimDayMutation.isPending ? (
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        ) : (
                            <Gift className="w-6 h-6 mr-2 mb-1" />
                        )}
                        {t('makeMoney.playVideo.claimReward')}
                    </Button>
                ) : (
                    <Button
                        onClick={handleWatchVideo}
                        className="md:w-full px-10 bg-gradient-primary hover:from-[#2563eb] hover:via-[#4f46e5] hover:to-[#7c3aed] text-white rounded-[2rem] h-10 md:h-16 text-sm md:text-xl font-bold shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none cursor-pointer"
                    >
                        {t('makeMoney.playVideo.watchVideo').toUpperCase()}
                    </Button>
                )}

                {adError && !GAM_TEST_MODE && (
                    <p className="text-xs text-red-500 text-center mt-3 bg-red-50 dark:bg-red-900/20 py-1 px-3 rounded-full">
                        {adError.message}
                    </p>
                )}
            </div>

            {/* Ad Container - GAM will inject ad here */}
            <div id="rewarded-ad-container" className="hidden"></div>

            {/* Connecting Modal Overlay */}
            {viewState === 'connecting' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="text-center space-y-2">
                            <h3 className="text-[#3b82f6] text-lg font-bold">
                                {t('makeMoney.playVideo.connectingDevices', { count: devicesCount }) || `Đang kết nối đến ${devicesCount} thiết bị cùng xem`}
                            </h3>
                        </div>

                        <div className="relative w-full h-32 flex items-center justify-center">
                            {/* Phone Outline */}
                            <img src="/phone.png" alt="phone" className="w-32 h-32 object-contain" />

                            {/* Eye Icon inside */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2 shadow-lg">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="w-12 h-12">
                            <Loader2 className="w-full h-full text-purple-500 animate-spin" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
