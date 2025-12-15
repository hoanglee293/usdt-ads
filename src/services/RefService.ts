import axiosClient from "@/utils/axiosClient";

// ==================== TypeScript Interfaces ====================

export interface ReferralMember {
  wallet_id: number;
  wallet_solana_address: string;
  wallet_nick_name: string;
  amount_reward: number;
}

export interface ReferralRewardsByLevel {
  member_num: number;
  amount_available: number;
  amount_total: number;
}

export interface ReferralRewardsData {
  referent_code: string;
  total: {
    member_num: number;
    amount_available: number;
    amount_total: number;
  };
  by_level: {
    [key: string]: ReferralRewardsByLevel; // e.g., "level_1", "level_2", etc.
  };
}

export interface GetRewardsResponse {
  statusCode: number;
  message: string;
  data: ReferralRewardsData;
}

export interface ListMembersData {
  members: {
    [key: string]: ReferralMember[]; // e.g., "level_1", "level_2", etc.
  };
}

export interface GetListMembersResponse {
  statusCode: number;
  message: string;
  data: ListMembersData;
}

export interface ReferralWithdrawal {
  withdrawId: number;
  amountUSD: number;
  amountSOL: number;
  status: "pending" | "completed" | "rejected" | "processing";
  createdAt: string;
  processedAt?: string;
  rewardIds?: number[];
}

export interface GetReferralWithdrawHistoryResponse {
  statusCode: number;
  message: string;
  data: ReferralWithdrawal[];
}

export interface CreateReferralWithdrawResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data?: any;
}

export interface RefErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

// ==================== Smart Ref Interfaces ====================

export interface RewardLevel {
  level: number;
  percentage: number;
}

export interface SmartRefInfoData {
  max_level: number;
  reward_levels: RewardLevel[];
  total_branches: number;
  total_invitees: number;
  total_rewards: number;
  total_withdrawn: number;
  total_can_withdraw: number;
}

export interface GetSmartRefInfoResponse {
  statusCode: number;
  message: string;
  data: SmartRefInfoData;
}

export interface SmartRefTreeItem {
  level: number;
  total_transactions: number;
  total_rewards: number;
  total_withdrawn: number;
}

export interface GetSmartRefTreeResponse {
  statusCode: number;
  message: string;
  data: SmartRefTreeItem[];
}

export interface SmartRefDetailItem {
  uid: number;
  display_name: string;
  join_date: string;
  level: number;
  total_transactions: number;
  total_rewards: number;
}

export interface GetSmartRefDetailResponse {
  statusCode: number;
  message: string;
  data: SmartRefDetailItem[];
}

// ==================== Member Ref Interfaces ====================

export interface MemberRefInfoData {
  total_members: number;
  current_milestone: number;
  total_rewards: number;
  total_withdrawn: number;
  total_can_withdraw: number;
}

export interface GetMemberRefInfoResponse {
  statusCode: number;
  message: string;
  data: MemberRefInfoData;
}

export interface MemberRefWithdrawData {
  withdraw_history_id: number;
  total_amount: number;
  total_amount_usd: number;
  rewards_count: number;
  date: string;
}

export interface CreateMemberRefWithdrawResponse {
  statusCode: number;
  message: string;
  data: MemberRefWithdrawData;
}

// ==================== API Functions ====================

/**
 * Lấy thông tin rewards và referral code
 * @returns Promise<GetRewardsResponse>
 */
export const getRewards = async (): Promise<GetRewardsResponse> => {
  try {
    const response = await axiosClient.get("/referrals/rewards");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching rewards:", error);
    throw error;
  }
};

/**
 * Lấy danh sách members theo level
 * @returns Promise<GetListMembersResponse>
 */
export const getListMembers = async (): Promise<GetListMembersResponse> => {
  try {
    const response = await axiosClient.get("/referrals/members");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching list members:", error);
    throw error;
  }
};

/**
 * Tạo yêu cầu rút tiền referral
 * @returns Promise<CreateReferralWithdrawResponse>
 */
export const createReferralWithdraw = async (): Promise<CreateReferralWithdrawResponse> => {
  try {
    const response = await axiosClient.post("/referrals/withdraw");
    return response.data;
  } catch (error: any) {
    console.error("Error creating referral withdraw:", error);
    throw error;
  }
};

/**
 * Lấy lịch sử rút tiền referral
 * @returns Promise<GetReferralWithdrawHistoryResponse>
 */
export const getReferralWithdrawHistory = async (): Promise<GetReferralWithdrawHistoryResponse> => {
  try {
    const response = await axiosClient.get("/referrals/withdraw-history");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching withdraw history:", error);
    throw error;
  }
};

/**
 * Lấy thông tin Smart Ref
 * @returns Promise<GetSmartRefInfoResponse>
 */
export const getSmartRefInfo = async (): Promise<GetSmartRefInfoResponse> => {
  try {
    const response = await axiosClient.get("/referrals/smart-ref-info");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching smart ref info:", error);
    throw error;
  }
};

/**
 * Lấy thông tin hoa hồng mỗi tuyến SmartRef
 * @returns Promise<GetSmartRefTreeResponse>
 */
export const getSmartRefTree = async (): Promise<GetSmartRefTreeResponse> => {
  try {
    const response = await axiosClient.get("/referrals/smart-ref-tree");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching smart ref tree:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết mỗi user trong SmartRef
 * @param level - Level cần lấy (optional, nếu không truyền hoặc không hợp lệ thì lấy tất cả level)
 * @returns Promise<GetSmartRefDetailResponse>
 */
export const getSmartRefDetail = async (level?: number): Promise<GetSmartRefDetailResponse> => {
  try {
    const url = level && level > 0 
      ? `/referrals/smart-ref-detail?level=${level}`
      : "/referrals/smart-ref-detail";
    const response = await axiosClient.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching smart ref detail:", error);
    throw error;
  }
};

/**
 * Lấy thông tin Member Ref
 * @returns Promise<GetMemberRefInfoResponse>
 */
export const getMemberRefInfo = async (): Promise<GetMemberRefInfoResponse> => {
  try {
    const response = await axiosClient.get("/referrals/member-ref-info");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching member ref info:", error);
    throw error;
  }
};

/**
 * Rút thưởng Member Ref (tối thiểu 10$)
 * @returns Promise<CreateMemberRefWithdrawResponse>
 */
export const createMemberRefWithdraw = async (): Promise<CreateMemberRefWithdrawResponse> => {
  try {
    const response = await axiosClient.post("/referrals/member-ref-withdraw");
    return response.data;
  } catch (error: any) {
    console.error("Error creating member ref withdraw:", error);
    throw error;
  }
};

