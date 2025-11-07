# Phân tích API Documentation - Wallet Service

## 📋 Tổng quan
File documentation mô tả 6 API endpoints chính cho hệ thống ví (Wallet):

### 1. **GET /wallets/list-coins** - Danh sách Coin
- **Mục đích**: Lấy danh sách các loại coin
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "message": "Get list coins successfully",
    "data": [...]
  }
  ```

### 2. **GET /wallets/list-networks** - Danh sách Network
- **Mục đích**: Lấy danh sách các mạng lưới (SOL, BNB, ETH...)
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "message": "Get list networks successfully",
    "data": [...]
  }
  ```

### 3. **GET /wallets/my-wallet** - Danh sách ví của User
- **Mục đích**: Lấy danh sách các ví theo mạng lưới của user
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "message": "Get my wallets successfully",
    "data": {
      "SOL": "s4y1234567890abcdef...",
      "BNB": null,
      "ETH": null
    }
  }
  ```

### 4. **GET /wallets/check-wallet-network?network=SOL** - Kiểm tra ví theo network
- **Mục đích**: Kiểm tra xem user đã có ví cho network cụ thể chưa
- **Query params**: `network` (required)
- **Response Success**: 
  ```json
  {
    "statusCode": 200,
    "message": "Check wallet network successfully",
    "data": {
      "address": "s4y1234567890abcdef..." // hoặc null
    }
  }
  ```
- **Error Messages**:
  - `400 Bad Request: Network parameter is required`
  - `400 Bad Request: Network not found`

### 5. **POST /wallets/create-wallet** - Tạo ví mới
- **Mục đích**: Tạo ví cho một network cụ thể
- **Request Body**: 
  ```json
  {
    "network_id": 1
  }
  ```
- **Response Success**: 
  ```json
  {
    "statusCode": 201,
    "message": "Wallet created successfully",
    "data": {
      "uwn_id": 123,
      "uwn_user_id": 142857,
      "uwn_network_id": 1,
      "uwn_public_key": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
- **Error Messages**:
  - `400 Bad Request: Network not found`
  - `400 Bad Request: Wallet already exists for this network`
  - `400 Bad Request: Wallet seed not configured`
  - `400 Bad Request: Invalid wallet seed`

### 6. **GET /wallets/balance?coin_id={coin_id}** - Lấy số dư coin
- **Mục đích**: Lấy số dư USDT (hoặc coin khác) của user
- **Query params**: `coin_id` (required, must be number)
- **Response Success**: 
  ```json
  {
    "statusCode": 200,
    "message": "Get balance successfully",
    "data": {
      "id": 123,
      "wallet_type": "crypto",
      "coin_id": 1,
      "balance": 100.5,
      "balance_gift": 10.0,
      "balance_reward": 5.5
    }
  }
  ```
- **Error Messages**:
  - `400 Bad Request: Coin ID is required and must be a number`
  - `404 Not Found: Balance not found for this coin`

---

## 🔍 So sánh với Implementation hiện tại

### ✅ Đã implement:
1. ✅ `getListCoins()` - **NHƯNG SAI HTTP METHOD** (dùng POST thay vì GET)
2. ✅ `getListNetworks()` - ✅ Đúng (GET)
3. ✅ `handleCheckNetwork()` - ✅ Đúng (GET với query param)
4. ✅ `createWallet()` - ✅ Đúng (POST với network_id)

### ❌ Chưa implement:
1. ❌ `getMyWallets()` - API GET /wallets/my-wallet
2. ❌ `getBalance()` - API GET /wallets/balance?coin_id={coin_id}

---

## 🐛 Vấn đề phát hiện

### 1. **Lỗi HTTP Method trong getListCoins**
```typescript
// ❌ SAI - Đang dùng POST
export const getListCoins = async () => {
  const response = await axiosClient.post('/wallets/list-coins');
  ...
}

// ✅ ĐÚNG - Nên dùng GET
export const getListCoins = async () => {
  const response = await axiosClient.get('/wallets/list-coins');
  ...
}
```

### 2. **Thiếu TypeScript interfaces**
- Chưa có interface cho:
  - `Coin` type
  - `MyWalletResponse` type
  - `BalanceResponse` type
  - `CreateWalletResponse` type
  - `CheckWalletNetworkResponse` type

### 3. **Thiếu error handling chi tiết**
- Chưa handle các error messages cụ thể từ API
- Chưa có type-safe error handling

### 4. **Thiếu API functions**
- `getMyWallets()` - để lấy danh sách ví của user
- `getBalance(coin_id)` - để lấy số dư coin

---

## 📝 Khuyến nghị

### 1. **Sửa lỗi HTTP Method**
```typescript
// Sửa getListCoins từ POST → GET
export const getListCoins = async () => {
  const response = await axiosClient.get('/wallets/list-coins');
  return response.data;
}
```

### 2. **Thêm TypeScript Interfaces**
```typescript
// Thêm vào WalletService.ts hoặc file types riêng
interface Coin {
  coin_id: number;
  coin_name: string;
  coin_symbol: string;
  coin_logo?: string;
  // ... các fields khác
}

interface MyWalletResponse {
  statusCode: number;
  message: string;
  data: {
    [network: string]: string | null; // SOL: "address..." hoặc null
  };
}

interface BalanceResponse {
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

interface CreateWalletResponse {
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

interface CheckWalletNetworkResponse {
  statusCode: number;
  message: string;
  data: {
    address: string | null;
  };
}
```

### 3. **Thêm các API functions còn thiếu**
```typescript
// Lấy danh sách ví của user
export const getMyWallets = async () => {
  try {
    const response = await axiosClient.get('/wallets/my-wallet');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Lấy số dư coin
export const getBalance = async (coin_id: number) => {
  try {
    const response = await axiosClient.get(`/wallets/balance?coin_id=${coin_id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

### 4. **Cải thiện Error Handling**
- Tạo custom error types cho từng loại lỗi
- Handle các error messages cụ thể từ API
- Thêm error messages tiếng Việt cho user

### 5. **Validation**
- Validate `coin_id` phải là number trước khi gọi API
- Validate `network` parameter không được empty
- Validate `network_id` phải là number và > 0

---

## 📊 Tóm tắt

| API Endpoint | Status | HTTP Method | Issues |
|-------------|--------|-------------|--------|
| GET /wallets/list-coins | ⚠️ Implemented | ❌ POST (sai) | Cần sửa thành GET |
| GET /wallets/list-networks | ✅ OK | ✅ GET | Không có |
| GET /wallets/my-wallet | ❌ Missing | - | Cần implement |
| GET /wallets/check-wallet-network | ✅ OK | ✅ GET | Không có |
| POST /wallets/create-wallet | ✅ OK | ✅ POST | Không có |
| GET /wallets/balance | ❌ Missing | - | Cần implement |

---

## 🎯 Action Items

1. ✅ Sửa `getListCoins()` từ POST → GET
2. ✅ Thêm `getMyWallets()` function
3. ✅ Thêm `getBalance(coin_id)` function
4. ✅ Thêm TypeScript interfaces cho tất cả responses
5. ✅ Cải thiện error handling với type safety
6. ✅ Thêm validation cho input parameters

