'use client';

import { useState, useEffect, useRef } from 'react';

interface WorldTimeApiResponse {
  datetime: string;
  unixtime: number;
  timezone: string;
}

/**
 * Hook để lấy thời gian hiện tại từ server thông qua API miễn phí
 * Sử dụng worldtimeapi.org để đảm bảo thời gian chính xác không phụ thuộc vào giờ thiết bị
 */
export const useServerTime = (updateInterval: number = 1000) => {
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientOffset, setClientOffset] = useState<number>(0); // Offset giữa server time và client time
  const clientOffsetRef = useRef<number>(0); // Ref để tránh stale closure
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isIntervalSetupRef = useRef<boolean>(false); // Track xem đã setup interval chưa

  // Fetch thời gian từ API
  const fetchServerTime = async (): Promise<Date | null> => {
    try {
      // Sử dụng worldtimeapi.org - API miễn phí, không cần API key
      const response = await fetch('https://worldtimeapi.org/api/timezone/UTC', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Cache control để tránh cache
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WorldTimeApiResponse = await response.json();
      
      // Parse datetime từ API (format: "2024-01-01T12:00:00.000000+00:00")
      const serverDate = new Date(data.datetime);
      
      // Tính offset giữa server time và client time
      const clientTime = new Date();
      const offset = serverDate.getTime() - clientTime.getTime();
      setClientOffset(offset);
      clientOffsetRef.current = offset; // Update ref để tránh stale closure
      
      return serverDate;
    } catch (err: any) {
      console.error('Error fetching server time:', err);
      setError(err.message || 'Failed to fetch server time');
      
      // Fallback: sử dụng client time nếu API fail
      // Nhưng vẫn log warning để developer biết
      console.warn('⚠️ Using client time as fallback. Countdown may be inaccurate if device time is wrong.');
      return new Date();
    }
  };

  // Khởi tạo: fetch thời gian từ server lần đầu
  useEffect(() => {
    let isMounted = true;

    const initServerTime = async () => {
      setIsLoading(true);
      setError(null);
      
      const time = await fetchServerTime();
      
      if (isMounted && time) {
        setServerTime(time);
        setIsLoading(false);
        lastFetchTimeRef.current = Date.now();
      }
    };

    initServerTime();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update thời gian mỗi interval
  // Sử dụng client time + offset để tránh phải fetch API quá nhiều
  useEffect(() => {
    if (serverTime === null || isIntervalSetupRef.current) return;

    // Đánh dấu đã setup interval
    isIntervalSetupRef.current = true;

    // Fetch lại từ server mỗi 5 phút để sync lại offset (tránh drift)
    syncIntervalRef.current = setInterval(async () => {
      const time = await fetchServerTime();
      if (time) {
        setServerTime(time);
        lastFetchTimeRef.current = Date.now();
      }
    }, 5 * 60 * 1000); // 5 phút

    // Update local time mỗi interval (sử dụng offset)
    intervalRef.current = setInterval(() => {
      // Tính thời gian hiện tại = client time + offset (dùng ref để tránh stale closure)
      const now = new Date();
      const adjustedTime = new Date(now.getTime() + clientOffsetRef.current);
      setServerTime(adjustedTime);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      isIntervalSetupRef.current = false;
    };
  }, [serverTime, updateInterval]); // Chỉ setup một lần khi serverTime sẵn sàng

  // Return thời gian hiện tại (hoặc client time nếu chưa fetch được server time)
  const getCurrentTime = (): Date => {
    if (serverTime) {
      return serverTime;
    }
    // Fallback về client time nếu chưa fetch được
    return new Date();
  };

  return {
    currentTime: getCurrentTime(),
    isLoading,
    error,
    isUsingServerTime: serverTime !== null && error === null,
  };
};
