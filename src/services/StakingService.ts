import axiosClient from "@/utils/axiosClient";

// ==================== TypeScript Interfaces ====================

export interface StakingPackage {
  id: number;
  user_id?: number;          // Optional - có thể không có trong join-now response
  type: "base" | "1d" | "7d" | "30d";
  date_start: string;        // ISO 8601 datetime
  date_end: string;          // ISO 8601 datetime
  amount: number;            // Số tiền tham gia
  total_usd: number;         // Tổng giá trị USD
  turn_setting: number;      // Số lượt xem video cần hoàn thành
  devices_setting: number;   // Số thiết bị cần hoàn thành
  estimated_reward?: number; // Phần thưởng ước tính (từ API join-now)
  real_reward?: number;     // Phần thưởng thực tế (từ API join-now)
  status: "running" | "pending-claim" | "ended";
}

export interface JoinBaseResponse {
  statusCode: 201;
  message: string;
  data: StakingPackage;
}

export interface JoinStakingRequest {
  type: "1d" | "7d" | "30d";
  amount: number;
}

export interface JoinStakingResponse {
  statusCode: 201;
  message: string;
  data: StakingPackage;
}

export interface CurrentStakingResponse {
  statusCode: 200;
  message: string;
  data: StakingPackage;
}

export interface StakingHistoriesResponse {
  statusCode: 200;
  message: string;
  data: StakingPackage[];
}

export interface StakingErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

export interface RewardHistory {
  id: number;
  user_id: number;
  stake_id: number;
  amount: number;
  date: string;        // ISO 8601 datetime
  status: "success" | "pending" | "failed";
}

export interface MissionClaimResponse {
  statusCode: 200;
  message: string;
  data: {
    staking_lock: StakingPackage;
    total_reward: number;
    reward_history: RewardHistory;
  };
}

export interface MissionNowResponse {
  statusCode: 200;
  message: string;
  data: {
    turn_setting: number;        // Số video cần xem
    devices: number;              // Số thiết bị cho phép
    turn_day: number;             // Số video đã xem
    time_watch_new: string | null; // Thời gian xem video mới nhất (ISO 8601)
    time_gap: number;             // Khoảng thời gian giữa các lần xem (phút)
  };
}

// ==================== API Functions ====================

/**
 * Tham gia gói Base (chỉ khi số dư < $10)
 * @returns Promise<JoinBaseResponse>
 */
export const joinBasePackage = async (): Promise<JoinBaseResponse> => {
  try {
    const response = await axiosClient.post('/incomes/join-base');
    return response.data;
  } catch (error) {
    console.error('Error joining base package:', error);
    throw error;
  }
}

/**
 * Tham gia gói Staking (chỉ khi số dư >= $10)
 * @param data - Dữ liệu tham gia staking (type và amount)
 * @returns Promise<JoinStakingResponse>
 */
export const joinStakingPackage = async (
  data: JoinStakingRequest
): Promise<JoinStakingResponse> => {
  try {
    // Validation
    if (!data.type || !['1d', '7d', '30d'].includes(data.type)) {
      throw new Error('Type must be one of: 1d, 7d, 30d');
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (data.amount > 3500) {
      throw new Error('Amount must not exceed 3500');
    }

    const response = await axiosClient.post('/incomes/join-staking', data);
    return response.data;
  } catch (error) {
    console.error('Error joining staking package:', error);
    throw error;
  }
}

/**
 * Lấy thông tin gói staking đang tham gia
 * @returns Promise<CurrentStakingResponse>
 */
export const getCurrentStaking = async (): Promise<CurrentStakingResponse> => {
  try {
    const response = await axiosClient.get('/incomes/join-now');
    return response.data;
  } catch (error: any) {
    // 404 is expected when no active staking exists
    if (error?.response?.status === 404) {
      throw error;
    }
    console.error('Error fetching current staking:', error);
    throw error;
  }
}

/**
 * Lấy lịch sử tham gia staking
 * @returns Promise<StakingHistoriesResponse>
 */
export const getStakingHistories = async (): Promise<StakingHistoriesResponse> => {
  try {
    const response = await axiosClient.get('/incomes/join-histories');
    return response.data;
  } catch (error) {
    console.error('Error fetching staking histories:', error);
    throw error;
  }
}

/**
 * Claim phần thưởng làm nhiệm vụ về ví
 * @returns Promise<MissionClaimResponse>
 */
export const claimMissionReward = async (): Promise<MissionClaimResponse> => {
  try {
    const response = await axiosClient.post('/incomes/mission-claim');
    return response.data;
  } catch (error) {
    console.error('Error claiming mission reward:', error);
    throw error;
  }
}

/**
 * Lấy thông tin tiến độ nhiệm vụ xem video
 * @returns Promise<MissionNowResponse>
 */
export const getMissionNow = async (): Promise<MissionNowResponse> => {
  try {
    const response = await axiosClient.get('/incomes/mission-now');
    return response.data;
  } catch (error: any) {
    // 400 is expected when no active staking exists
    if (error?.response?.status === 400) {
      throw error;
    }
    console.error('Error fetching mission now:', error);
    throw error;
  }
}
