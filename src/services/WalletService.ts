import axiosClient from "@/utils/axiosClient";

// ==================== TypeScript Interfaces ====================

export interface Coin {
  coin_id?: number;
  coin_name?: string;
  coin_symbol?: string;
  coin_logo?: string;
  [key: string]: any;
}

export interface Network {
  net_id: number;
  net_name: string;
  net_symbol: string;
  net_logo?: string;
  net_scan?: string;
  net_status: string;
  [key: string]: any;
}

export interface ListCoinsResponse {
  statusCode: number;
  message: string;
  data: Coin[];
}

export interface ListNetworksResponse {
  statusCode: number;
  message: string;
  data: Network[];
}

export interface MyWalletResponse {
  statusCode: number;
  message: string;
  data: {
    [network: string]: string | null; // e.g., { "SOL": "address...", "BNB": null, "ETH": null }
  };
}

export interface CheckWalletNetworkResponse {
  statusCode: number;
  message: string;
  data: {
    address: string | null;
  };
}

export interface CreateWalletResponse {
  statusCode: number;
  message: string;
  data: {
    uwn_id: number;
    uwn_user_id: number;
    uwn_network_id: number;
    uwn_public_key: string;
    created_at: string;
    updated_at: string;
  };
}

export interface BalanceResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    wallet_type: string;
    coin_id: number;
    balance: number;
    balance_gift: number;
    balance_reward: number;
  };
}

export interface WalletErrorResponse {
  statusCode: 400 | 401 | 404;
  message: string;
}

export interface WalletByNetworkResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    network_id: number;
    public_key: string;
    qr_code: string; // base64 image
  };
}

// ==================== Withdraw Interfaces ====================

export interface WithdrawRequest {
  network: string | number;  // net_id hoặc net_symbol
  coin: string | number;      // coin_id hoặc coin_symbol
  address: string;            // Địa chỉ ví nhận
  amount: number;             // >= 0.00000001
}

export interface WithdrawResponse {
  statusCode: 200;
  message: string;
  data: {
    transaction_hash: string;
    history_id: number;
  };
}

// ==================== Transaction History Interfaces ====================

export interface TransactionHistoryItem {
  id: number;
  wallet_network_id: number | null;
  type: "crypto";
  option: "withdraw" | "deposit";
  coin_id: number;
  amount: number;
  hash: string;
  image_verify: string | null;
  status: "success" | "pending" | "failed" | string;
  node: string;               // Network symbol
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionHistoryResponse {
  statusCode: 200;
  message: string;
  data: TransactionHistoryItem[];
}

export interface TransactionHistoryParams {
  coin?: string;              // Coin symbol (e.g., "USDT")
  network?: string;           // Network symbol (e.g., "ETH")
  type?: "withdraw" | "deposit" | null;
}

// ==================== API Functions ====================

/**
 * Lấy danh sách các loại coin
 * @returns Promise<ListCoinsResponse>
 */
export const getListCoins = async (): Promise<ListCoinsResponse> => {
  try {
    const response = await axiosClient.get('/wallets/list-coins');
    return response.data;
  } catch (error) {
    console.error('Error fetching list coins:', error);
    throw error;
  }
}

/**
 * Lấy danh sách các mạng lưới (SOL, BNB, ETH...)
 * @returns Promise<ListNetworksResponse>
 */
export const getListNetworks = async (): Promise<ListNetworksResponse> => {
  try {
    const response = await axiosClient.get('/wallets/list-networks');
    return response.data;
  } catch (error) {
    console.error('Error fetching list networks:', error);
    throw error;
  }
}

/**
 * Lấy danh sách các ví theo mạng lưới của user
 * @returns Promise<MyWalletResponse>
 */
export const getMyWallets = async (): Promise<MyWalletResponse> => {
  try {
    const response = await axiosClient.get('/wallets/my-wallet');
    return response.data;
  } catch (error) {
    console.error('Error fetching my wallets:', error);
    throw error;
  }
}

/**
 * Kiểm tra ví theo mạng lưới của user
 * @param network - Tên mạng lưới (ví dụ: "SOL", "BNB", "ETH")
 * @returns Promise<CheckWalletNetworkResponse>
 */
export const handleCheckNetwork = async (network: string): Promise<CheckWalletNetworkResponse> => {
  try {
    if (!network || network.trim() === '') {
      throw new Error('Network parameter is required');
    }
    const response = await axiosClient.get(`/wallets/check-wallet-network?network=${network}`);
    return response.data;
  } catch (error) {
    console.error('Error checking wallet network:', error);
    throw error;
  }
}

/**
 * Tạo ví mới cho một mạng lưới
 * @param network_id - ID của mạng lưới
 * @returns Promise<CreateWalletResponse>
 */
export const createWallet = async (network_id: number): Promise<CreateWalletResponse> => {
  try {
    if (!network_id || network_id <= 0) {
      throw new Error('Network ID is required and must be greater than 0');
    }
    const response = await axiosClient.post(`/wallets/create-wallet`, {
      network_id: network_id,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
}

/**
 * Lấy số dư coin (USDT hoặc coin khác) của user
 * @param coin_id - ID của coin
 * @returns Promise<BalanceResponse>
 */
export const getBalance = async (coin_id: number): Promise<BalanceResponse> => {
  try {
    if (!coin_id || coin_id <= 0 || !Number.isInteger(coin_id)) {
      throw new Error('Coin ID is required and must be a positive integer');
    }
    const response = await axiosClient.get(`/wallets/balance?coin_id=${coin_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

/**
 * Lấy public key và QR code của ví theo mạng lưới
 * @param network_id - ID của mạng lưới
 * @returns Promise<WalletByNetworkResponse>
 */
export const getWalletByNetwork = async (network_id: number): Promise<WalletByNetworkResponse> => {
  try {
    if (!network_id || network_id <= 0 || !Number.isInteger(network_id)) {
      throw new Error('Network ID is required and must be a positive integer');
    }
    const response = await axiosClient.get(`/wallets/network?id=${network_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet by network:', error);
    throw error;
  }
}

/**
 * Rút tiền Onchain
 * @param withdrawData - Dữ liệu rút tiền
 * @returns Promise<WithdrawResponse>
 */
export const withdrawFunds = async (withdrawData: WithdrawRequest): Promise<WithdrawResponse> => {
  try {
    // Validation
    if (!withdrawData.network) {
      throw new Error('Network is required');
    }
    if (!withdrawData.coin) {
      throw new Error('Coin is required');
    }
    if (!withdrawData.address || withdrawData.address.trim() === '') {
      throw new Error('Address is required');
    }
    if (!withdrawData.amount || withdrawData.amount < 0.00000001) {
      throw new Error('Amount must be >= 0.00000001');
    }

    const response = await axiosClient.post('/wallets/withdraw', withdrawData);
    return response.data;
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
}

/**
 * Lấy lịch sử giao dịch
 * @param params - Query parameters (optional)
 * @returns Promise<TransactionHistoryResponse>
 */
export const getTransactionHistory = async (
  params?: TransactionHistoryParams
): Promise<TransactionHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.coin) {
      queryParams.append('coin', params.coin);
    }
    if (params?.network) {
      queryParams.append('network', params.network);
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }

    const queryString = queryParams.toString();
    const url = `/wallets/transaction-history${queryString ? `?${queryString}` : ''}`;
    
    const response = await axiosClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}