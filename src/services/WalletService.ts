import axiosClient from "@/utils/axiosClient";

// ==================== Types ====================

// List Coins API Types
export interface Coin {
  id: number;
  symbol: string;
  name: string;
  // Add other coin properties as needed
}

export interface ListCoinsSuccessResponse {
  statusCode: 200;
  message: "Get list coins successfully";
  data: Coin[];
}

// List Networks API Types
export interface Network {
  id: number;
  symbol: string;
  name: string;
  // Add other network properties as needed
}

export interface ListNetworksSuccessResponse {
  statusCode: 200;
  message: "Get list networks successfully";
  data: Network[];
}

// Create Wallet API Types
export interface CreateWalletRequest {
  network_id: number;
}

export interface CreateWalletData {
  uwn_id: number;
  uwn_user_id: number;
  uwn_network_id: number;
  uwn_public_key: string;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface CreateWalletSuccessResponse {
  statusCode: 201;
  message: "Wallet created successfully";
  data: CreateWalletData;
}

export interface CreateWalletErrorResponse {
  statusCode: 400;
  message: string;
}

// Get Balance API Types
export interface BalanceData {
  id: number;
  wallet_type: "crypto";
  coin_id: number;
  balance: number;
  balance_gift: number;
  balance_reward: number;
}

export interface GetBalanceSuccessResponse {
  statusCode: 200;
  message: "Get balance successfully";
  data: BalanceData;
}

export interface GetBalanceErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

// Get Wallet by Network API Types
export interface WalletNetworkData {
  id: number;
  network_id: number;
  public_key: string;
  qr_code: string; // Base64 encoded image
}

export interface GetWalletNetworkSuccessResponse {
  statusCode: 200;
  message: "Get wallet successfully";
  data: WalletNetworkData;
}

export interface GetWalletNetworkErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

// Withdraw API Types
export interface WithdrawRequest {
  network: string | number; // net_id (số) hoặc net_symbol (ví dụ: "SOL", "ETH", "BNB")
  coin: string | number; // coin_id (số) hoặc coin_symbol (ví dụ: "USDT", "SOL")
  address: string; // Địa chỉ ví nhận
  amount: number; // Số lượng coin (phải >= 0.00000001)
}

export interface WithdrawData {
  transaction_hash: string;
  history_id: number;
}

export interface WithdrawSuccessResponse {
  statusCode: 200;
  message: "Withdraw successful";
  data: WithdrawData;
}

export interface WithdrawErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

// ==================== API Functions ====================

/**
 * Lấy danh sách coin
 * API: GET /wallets/list-coins
 */
export const getListCoins = async (): Promise<ListCoinsSuccessResponse> => {
  try {
    const response = await axiosClient.get<ListCoinsSuccessResponse>('/wallets/list-coins');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data;
    }
    console.error(error);
    throw error;
  }
};

/**
 * Lấy danh sách network
 * API: GET /wallets/list-networks
 */
export const getListNetworks = async (): Promise<ListNetworksSuccessResponse> => {
  try {
    const response = await axiosClient.get<ListNetworksSuccessResponse>('/wallets/list-networks');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data;
    }
    console.error(error);
    throw error;
  }
};

/**
 * Tạo ví mạng lưới
 * API: POST /wallets/create-wallet
 * 
 * Error Messages:
 * - 400: Network not found
 * - 400: Wallet already exists for this network
 * - 400: Wallet seed not configured
 * - 400: Invalid wallet seed
 */
export const createWallet = async (networkId: number): Promise<CreateWalletSuccessResponse> => {
  try {
    const response = await axiosClient.post<CreateWalletSuccessResponse>('/wallets/create-wallet', {
      network_id: networkId
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as CreateWalletErrorResponse;
    }
    console.error(error);
    throw error;
  }
};

/**
 * Lấy số dư coin (USDT)
 * API: GET /wallets/balance?coin_id={coin_id}
 * 
 * Error Messages:
 * - 400: Coin ID is required and must be a number
 * - 404: Balance not found for this coin
 */
export const getBalance = async (coinId: number): Promise<GetBalanceSuccessResponse> => {
  try {
    const response = await axiosClient.get<GetBalanceSuccessResponse>('/wallets/balance', {
      params: {
        coin_id: coinId
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as GetBalanceErrorResponse;
    }
    console.error(error);
    throw error;
  }
};

/**
 * Lấy public key của user theo mạng lưới
 * API: GET /wallets/network?id={network_id}
 * 
 * Error Messages:
 * - 400: Network ID is required and must be a number
 * - 404: Wallet not found for this network
 */
export const getWalletNetwork = async (networkId: number): Promise<GetWalletNetworkSuccessResponse> => {
  try {
    const response = await axiosClient.get<GetWalletNetworkSuccessResponse>('/wallets/network', {
      params: {
        id: networkId
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as GetWalletNetworkErrorResponse;
    }
    console.error(error);
    throw error;
  }
};

/**
 * Rút tiền Onchain
 * API: POST /wallets/withdraw
 * 
 * @param network - net_id (số) hoặc net_symbol (ví dụ: "SOL", "ETH", "BNB")
 * @param coin - coin_id (số) hoặc coin_symbol (ví dụ: "USDT", "SOL")
 * @param address - Địa chỉ ví nhận (ví dụ: "0x1234...", "ABC123...")
 * @param amount - Số lượng coin cần rút (phải >= 0.00000001)
 * 
 * Error Messages:
 * - 400: Network not found
 * - 400: Coin not found
 * - 404: Not Found
 */
export const withdraw = async (
  network: string | number,
  coin: string | number,
  address: string,
  amount: number
): Promise<WithdrawSuccessResponse> => {
  try {
    const response = await axiosClient.post<WithdrawSuccessResponse>('/wallets/withdraw', {
      network,
      coin,
      address,
      amount
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as WithdrawErrorResponse;
    }
    console.error(error);
    throw error;
  }
};

