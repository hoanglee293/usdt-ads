# Phân tích API Documentation - Rút tiền Onchain & Lịch sử giao dịch

## 📋 Tổng quan

File documentation mô tả 2 API endpoints chính cho tính năng rút tiền và lịch sử giao dịch:

---

## 1. POST /wallets/withdraw - Rút tiền Onchain

### Mục đích
Rút tiền từ ví của user ra địa chỉ ví bên ngoài trên blockchain.

### Request

**Endpoint**: `POST /wallets/withdraw`

**Request Body**:
```typescript
{
  "network": "string",    // net_id (số) hoặc net_symbol (ví dụ: "SOL", "ETH", "BNB")
  "coin": "string",       // coin_id (số) hoặc coin_symbol (ví dụ: "USDT", "SOL")
  "address": "string",    // Địa chỉ ví nhận (ví dụ: "0x1234...", "ABC123...")
  "amount": number        // Số lượng coin cần rút (phải >= 0.00000001)
}
```

**Lưu ý**:
- `network` có thể là số (net_id) hoặc string (net_symbol)
- `coin` có thể là số (coin_id) hoặc string (coin_symbol)
- `amount` phải >= 0.00000001 (minimum amount)

### Response Success (200)

```typescript
{
  "statusCode": 200,
  "message": "Withdraw successful",
  "data": {
    "transaction_hash": "string",      // Hash của transaction trên blockchain
    "history_id": number               // ID của record trong wallet_histories
  }
}
```

### Response Error

```typescript
{
  "statusCode": 400 | 401 | 404,
  "message": "<error_message>"
}
```

**Error Messages**:
- `400 Bad Request: Network not found` - Network không tồn tại
- `400 Bad Request: Coin not found` - Coin không tồn tại
- `404 Not Found: Not Found` - Không tìm thấy
- `401 Unauthorized` - Chưa đăng nhập hoặc token hết hạn

---

## 2. GET /api/v1/wallets/transaction-history - Lịch sử giao dịch

### Mục đích
Lấy lịch sử nạp/rút tiền Onchain của user.

### Request

**Endpoint**: `GET /api/v1/wallets/transaction-history`

**Query Parameters**:
- `coin` (optional): Coin symbol (ví dụ: "USDT")
- `network` (optional): Network symbol (ví dụ: "ETH")
- `type` (optional): Loại giao dịch - có thể là `"withdraw"`, `"deposit"`, hoặc `null` (lấy tất cả)

**Ví dụ**:
```
GET /api/v1/wallets/transaction-history?coin=USDT&network=ETH&type=withdraw
GET /api/v1/wallets/transaction-history?coin=USDT
GET /api/v1/wallets/transaction-history?type=withdraw
GET /api/v1/wallets/transaction-history
```

### Response Success (200)

```typescript
{
  "statusCode": 200,
  "message": "Get transaction history successfully",
  "data": [
    {
      "id": 1,
      "wallet_network_id": null,
      "type": "crypto",
      "option": "withdraw",           // "withdraw" hoặc "deposit"
      "coin_id": 1,
      "amount": 100.5,
      "hash": "0x...",                // Transaction hash
      "image_verify": null,
      "status": "success",             // "success", "pending", "failed", etc.
      "node": "ETH",                   // Network symbol
      "user_id": 123,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Response Error

```typescript
{
  "statusCode": 400 | 401 | 500,
  "message": "<error_message>"
}
```

**Error Messages**:
- `400 Bad Request: Coin not found: INVALID_COIN` - Coin không hợp lệ
- `404 Not Found: Network not found: INVALID_NETWORK` - Network không hợp lệ
- `500 Internal Server Error: Internal server error` - Lỗi server
- `401 Unauthorized` - Chưa đăng nhập

---

## 🔍 So sánh với Implementation hiện tại

### ❌ Chưa implement:

1. **POST /wallets/withdraw** - Chưa có function trong `WalletService.ts`
   - Trang `/wallet/withdraw/page.tsx` chỉ là placeholder
   - Cần implement form rút tiền với validation

2. **GET /wallets/transaction-history** - Chưa có function trong `WalletService.ts`
   - Trang `/wallet/page.tsx` đang dùng `fakeTransactions`
   - Cần thay thế bằng API call thực tế

### ⚠️ Lưu ý về Endpoint Path:

**Quan trọng**: `axiosClient` đã có `baseURL: ${apiUrl}/api/v1`

- ✅ **Withdraw**: Dùng `/wallets/withdraw` (axiosClient sẽ tự thêm `/api/v1`)
- ⚠️ **Transaction History**: Documentation ghi `/api/v1/wallets/transaction-history` nhưng nên dùng `/wallets/transaction-history` (vì axiosClient đã có `/api/v1`)

---

## 📊 Cấu trúc dữ liệu cần implement

### TypeScript Interfaces

```typescript
// Withdraw Request
export interface WithdrawRequest {
  network: string | number;  // net_id hoặc net_symbol
  coin: string | number;      // coin_id hoặc coin_symbol
  address: string;            // Địa chỉ ví nhận
  amount: number;             // >= 0.00000001
}

// Withdraw Response
export interface WithdrawResponse {
  statusCode: 200;
  message: "Withdraw successful";
  data: {
    transaction_hash: string;
    history_id: number;
  };
}

// Transaction History Item
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

// Transaction History Response
export interface TransactionHistoryResponse {
  statusCode: 200;
  message: "Get transaction history successfully";
  data: TransactionHistoryItem[];
}

// Transaction History Query Params
export interface TransactionHistoryParams {
  coin?: string;              // Coin symbol (e.g., "USDT")
  network?: string;           // Network symbol (e.g., "ETH")
  type?: "withdraw" | "deposit" | null;
}
```

---

## 🎯 Action Items để implement

### 1. Thêm functions vào `WalletService.ts`

```typescript
/**
 * Rút tiền Onchain
 * @param withdrawData - Dữ liệu rút tiền
 * @returns Promise<WithdrawResponse>
 */
export const withdrawFunds = async (
  withdrawData: WithdrawRequest
): Promise<WithdrawResponse> => {
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

  try {
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
```

### 2. Implement trang Withdraw (`/wallet/withdraw/page.tsx`)

**Cần có**:
- Form với các field:
  - Select Network (dropdown)
  - Select Coin (dropdown)
  - Input Address (text input với validation)
  - Input Amount (number input với validation >= 0.00000001)
- Hiển thị số dư hiện tại
- Validation trước khi submit
- Loading state khi đang xử lý
- Success/Error handling
- Hiển thị transaction hash sau khi thành công

### 3. Cập nhật trang Wallet (`/wallet/page.tsx`)

**Cần thay đổi**:
- Thay `fakeTransactions` bằng API call thực tế
- Sử dụng `getTransactionHistory()` với filters:
  - Filter theo coin (nếu có selectedCoin)
  - Filter theo network (nếu có selectedNetwork)
  - Filter theo type (withdraw/deposit)
- Map dữ liệu từ API response sang format hiện tại:
  ```typescript
  // API response format
  {
    id: 1,
    option: "withdraw",
    amount: 100.5,
    hash: "0x...",
    status: "success",
    created_at: "2025-01-01T00:00:00.000Z",
    node: "ETH"
  }
  
  // Cần map sang format hiện tại
  {
    id: 1,
    type: "Rút", // hoặc "Nạp" dựa vào option
    amount: "100.5 USDT",
    transactionId: "0x...",
    status: "Complete", // hoặc "Lỗi" dựa vào status
    time: "11:23:45 24/02/2025" // format từ created_at
  }
  ```

### 4. Validation Rules

**Withdraw Form**:
- Network: Required, phải là một trong các network có sẵn
- Coin: Required, phải là một trong các coin có sẵn
- Address: 
  - Required
  - Không được trống
  - Nên validate format địa chỉ ví (tùy network)
- Amount:
  - Required
  - Phải là số > 0
  - Phải >= 0.00000001
  - Không được vượt quá số dư hiện tại

---

## 🐛 Potential Issues & Solutions

### Issue 1: Endpoint Path Discrepancy
**Problem**: Documentation ghi `/api/v1/wallets/transaction-history` nhưng axiosClient đã có baseURL `/api/v1`

**Solution**: Dùng `/wallets/transaction-history` trong code (axiosClient sẽ tự thêm prefix)

### Issue 2: Network/Coin có thể là string hoặc number
**Problem**: API chấp nhận cả `net_id` (number) và `net_symbol` (string)

**Solution**: 
- Trong UI, user chọn từ dropdown nên có cả `net_id` và `net_symbol`
- Nên dùng `net_id` hoặc `net_symbol` một cách nhất quán
- Có thể tạo helper function để normalize

### Issue 3: Transaction History Status Mapping
**Problem**: API trả về `status: "success"` nhưng UI hiện tại dùng `"Complete"` và `"Lỗi"`

**Solution**: Tạo mapping function:
```typescript
const mapStatus = (status: string): "Complete" | "Lỗi" => {
  if (status === "success") return "Complete";
  return "Lỗi";
}
```

### Issue 4: Transaction History Type Mapping
**Problem**: API dùng `option: "withdraw" | "deposit"` nhưng UI dùng `type: "Nạp" | "Rút"`

**Solution**: Tạo mapping function:
```typescript
const mapTransactionType = (option: string): string => {
  if (option === "withdraw") return "Rút";
  if (option === "deposit") return "Nạp";
  return option;
}
```

---

## 📝 Tóm tắt

| API Endpoint | Status | Priority | Notes |
|-------------|--------|----------|-------|
| POST /wallets/withdraw | ❌ Missing | 🔴 High | Cần implement form rút tiền |
| GET /wallets/transaction-history | ❌ Missing | 🟡 Medium | Cần thay fake data bằng API |

**Next Steps**:
1. ✅ Thêm TypeScript interfaces vào `WalletService.ts`
2. ✅ Implement `withdrawFunds()` function
3. ✅ Implement `getTransactionHistory()` function
4. ✅ Build withdraw form page
5. ✅ Update wallet page để dùng real transaction history
6. ✅ Add error handling và validation
7. ✅ Test với API thực tế

