'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Loader2, PlayCircle, CheckCircle2, Clock, ArrowLeft, Video, ArrowRight, Gift } from 'lucide-react';
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
    useEffect(() => {
        if (viewState === 'connecting' && !isLoadingMission && missionNowResponse?.data) {
            // Chỉ chuyển sang watching nếu countdown đã kết thúc hoặc chưa xem lần nào
            // Nếu countdown chưa kết thúc, useEffect auto-switch sẽ chuyển sang countdown trước
            if (!isCountdownFinished && !isCompleted) {
                // Không làm gì, để useEffect auto-switch xử lý
                return;
            }

            console.log('✅ API mission-now loaded, switching to watching state...');
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
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl">
                    <Card className="p-8 bg-gradient-primary shadow-md">
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Clock className="w-10 h-10 text-white" />
                            </div>

                            <div>
                                {/* <h2 className="text-2xl font-bold mb-2">{t('makeMoney.playVideo.countdownTitle')}</h2>
                            <p className="text-muted-foreground mb-6">{t('makeMoney.playVideo.countdownDescription')}</p> */}

                                {!isCountdownFinished ? (
                                    <div className="space-y-4">
                                        <div className="text-5xl font-bold text-white mb-4">
                                            {formatTimeRemaining(countdownRemaining)}
                                        </div>
                                        <p className="text-sm text-white">
                                            {t('makeMoney.playVideo.waitingForNextVideo')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-2xl font-semibold text-white mb-4">
                                            {t('makeMoney.playVideo.countdownFinished')}
                                        </div>
                                        <Button
                                            onClick={handleNext}
                                            size="lg"
                                            className="w-full sm:w-auto outline-none border-none bg-gradient-primary text-white rounded-full h-14 text-lg cursor-pointer"
                                        >
                                            {t('makeMoney.playVideo.next')}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Render Connecting Modal
    if (viewState === 'connecting') {
        return (
            <div className="fixed inset-0 bg-gray-400/50 dark:bg-gray-800/50 flex items-center justify-center z-50 p-4">
                <Card className="p-8 max-w-sm w-full bg-gradient-primary rounded-lg">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
                        <div>
                            <h3 className="font-semibold text-white text-xl mb-2">{t('makeMoney.playVideo.connecting')}</h3>
                            <p className="text-sm text-white">
                                {t('makeMoney.playVideo.connectingDevices', { count: devicesCount })}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Render Watching Video Screen
    if (viewState === 'watching') {
        return (
            <div className="fixed inset-0 bg-gray-400/50 dark:bg-gray-800/50 flex items-center justify-center z-50 p-4">
                <Card className="p-8 max-w-sm w-full bg-gradient-primary rounded-lg">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Video className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-xl mb-2">{t('makeMoney.playVideo.watching')}</h3>
                            <p className="text-sm text-white">
                                {t('makeMoney.playVideo.watchToComplete')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Render Main Screen (Idle or Completed)
    return (
        <div className="w-full min-h-svh flex py-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1">
            <div className='w-full max-w-7xl bg-[#e6effd63] shadow-md dark:bg-gray-800 rounded-lg p-6 mt-10'>
                {/* Header */}
                {/* <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/make-money')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('makeMoney.playVideo.back')}
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">{t('makeMoney.playVideo.title')}</h1>
                    <p className="text-muted-foreground">{t('makeMoney.playVideo.description')}</p>
                </div> */}

                {/* Progress Card */}
                <Card className="p-6 mb-6 bg-gradient-primary rounded-lg">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                    <Video className="w-5 h-5 text-white" />
                                )}
                                <span className="font-semibold text-white">{t('makeMoney.playVideo.progress')}</span>
                            </div>
                            <span className={`text-sm text-white ${isCompleted ? ' font-semibold' : 'text-muted-foreground'}`}>
                                {missionData?.turn_day || 0} / {missionData?.turn_setting || 0}
                                {isCompleted && ' ✓'}
                            </span>
                        </div>

                        <Progress
                            value={progress}
                            className={`h-3 bg-gray-200 dark:bg-white ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
                            indicatorClassName={isCompleted ? 'bg-green-500' : 'bg-black'}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <p className="text-sm text-white mb-1">{t('makeMoney.playVideo.videosWatched')}</p>
                                <p className={`text-2xl font-bold text-white ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}`}>
                                    {missionData?.turn_day || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-white mb-1">{t('makeMoney.playVideo.remaining')}</p>
                                <p className={`text-2xl font-bold text-white ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                                    {missionData ? Math.max(0, missionData.turn_setting - missionData.turn_day) : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Card */}
                <Card className="p-6 border-none outline-none shadow-none">
                    {isCompleted ? (
                        // Đã xem đủ video - Hiện nút Nhận thưởng
                        <div className="space-y-6 flex flex-col items-center justify-center py-4">
                            <div className="text-center space-y-4">
                                {/* <div className="mx-auto w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {t('makeMoney.playVideo.completed')}
                                </h3> */}
                                <img src="/complete.png" alt="completed" className="w-40 h-40 mx-auto mb-4" />
                                <p className="text-muted-foreground dark:text-white text-base max-w-md">
                                    {t('makeMoney.playVideo.readyToClaim')}
                                </p>
                            </div>
                            <Button
                                onClick={handleClaimReward}
                                disabled={claimDayMutation.isPending}
                                className="w-full sm:w-fit bg-gradient-primary h-14 text-white rounded-full border-none text-lg cursor-pointer hover:bg-gradient-primary/80 transition-all duration-300 hover:scale-105 shadow-lg"
                                size="lg"
                            >
                                {claimDayMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('makeMoney.playVideo.processing')}
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-5 h-5 mr-2" />
                                        {t('makeMoney.playVideo.claimReward')}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        // Chưa xem đủ video - Hiện nút Xem video
                        <div className="space-y-4 flex flex-col items-center justify-center">
                            <div className="text-center mb-4">
                                <p className="text-muted-foreground dark:text-white mb-2">
                                    {t('makeMoney.playVideo.watchToComplete')}
                                </p>
                                <p className="text-sm text-muted-foreground dark:text-white">
                                    {t('makeMoney.playVideo.remainingVideos', {
                                        count: missionData ? Math.max(0, missionData.turn_setting - missionData.turn_day) : 0
                                    })}
                                </p>
                            </div>

                            <Button
                                onClick={handleWatchVideo}
                                // disabled={isLoadingAd || !isLoaded || watchVideoMutation.isPending || !isReady || viewState === 'watching'}
                                className="w-fit bg-theme-red-200 uppercase font-semibold h-12 text-white rounded-full border-none text-lg cursor-pointer"
                                size="lg"
                            >
                                {/* {watchVideoMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('makeMoney.playVideo.processing')}
                                    </>
                                ) : isLoadingAd ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('makeMoney.playVideo.loadingAd')}
                                    </>
                                ) : viewState === 'watching' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('makeMoney.playVideo.watching')}
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="w-5 h-5 mr-2" />
                                        {t('makeMoney.playVideo.watchVideo')}
                                    </>
                                )} */}
                                <>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    {t('makeMoney.playVideo.watchVideo')}
                                </>
                            </Button>
                            {adError && !GAM_TEST_MODE && (
                                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                    {adError.message}
                                </p>
                            )}

                            {!isReady && !GAM_TEST_MODE && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                                    {t('makeMoney.playVideo.initializing')}
                                </p>
                            )}

                            {GAM_TEST_MODE && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center">
                                        🧪 <strong>TEST MODE:</strong> GAM đang ở chế độ test. Ad sẽ được mock sau 5 giây.
                                    </p>
                                </div>
                            )}

                            {missionData && (
                                <div className="pt-4 w-full max-w-3xl border-none bg-gradient-primary rounded-lg p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-white">{t('makeMoney.playVideo.devicesAllowed')}</span>
                                        <span className="font-medium text-white">{missionData.devices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white">{t('makeMoney.playVideo.timeGap')}</span>
                                        <span className="font-medium text-white">{missionData.time_gap} {t('makeMoney.playVideo.minutes')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Ad Container - GAM will inject ad here */}
                <div id="rewarded-ad-container" className="hidden"></div>
            </div>
        </div>
    );
}
