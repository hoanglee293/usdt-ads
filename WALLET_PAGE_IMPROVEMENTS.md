# 💡 Ý tưởng cập nhật Wallet Page

## 📋 Tổng quan
Dựa trên layout hiện tại và các API có sẵn, đây là các cải tiến đề xuất cho trang Wallet.

---

## 🎯 Các tính năng cần bổ sung

### 1. **Hiển thị số dư thực từ API** ⭐⭐⭐
**Vấn đề hiện tại:**
- Số dư đang hardcode: `"Số dư: 1000 USDT"`

**Giải pháp:**
- ✅ Sử dụng API `getBalance(coin_id)` để lấy số dư thực
- ✅ Thêm dropdown chọn coin (USDT, BTC, ETH...) từ `getListCoins()`
- ✅ Hiển thị 3 loại số dư:
  - `balance` - Số dư chính
  - `balance_gift` - Số dư quà tặng
  - `balance_reward` - Số dư thưởng
- ✅ Loading state khi fetch balance
- ✅ Error handling nếu không lấy được số dư

**UI đề xuất:**
```
┌─────────────────────────────────────────┐
│  [Logo]  Số dư: 1,234.56 USDT  [Logo]  │
│         (Quà: 100.00 | Thưởng: 50.00)  │
└─────────────────────────────────────────┘
```

---

### 2. **Hiển thị địa chỉ ví theo network** ⭐⭐⭐
**Vấn đề hiện tại:**
- Chọn network nhưng không hiển thị địa chỉ ví của user

**Giải pháp:**
- ✅ Khi chọn network → gọi `handleCheckNetwork(network_symbol)` hoặc `getMyWallets()`
- ✅ Hiển thị địa chỉ ví (nếu có) hoặc nút "Tạo ví" (nếu chưa có)
- ✅ Hiển thị địa chỉ với format đẹp và nút copy
- ✅ Link đến blockchain explorer (nếu có `net_scan`)

**UI đề xuất:**
```
┌─────────────────────────────────────────┐
│  Chọn mạng lưới: [SOL ▼]                │
│                                         │
│  Địa chỉ ví:                            │
│  ┌───────────────────────────────────┐ │
│  │ s4y1234....5678pump  [Copy] [🔗] │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Hoặc nếu chưa có ví:                   │
│  [➕ Tạo ví cho SOL]                    │
└─────────────────────────────────────────┘
```

---

### 3. **Tự động tạo ví nếu chưa có** ⭐⭐⭐
**Vấn đề hiện tại:**
- User chọn network nhưng chưa có ví → không có hướng dẫn

**Giải pháp:**
- ✅ Khi chọn network → check xem đã có ví chưa
- ✅ Nếu chưa có → hiển thị AlertDialog/Button "Tạo ví"
- ✅ Click "Tạo ví" → gọi `createWallet(network_id)`
- ✅ Hiển thị loading state khi đang tạo
- ✅ Sau khi tạo thành công → hiển thị địa chỉ ví mới
- ✅ Error handling: "Ví đã tồn tại", "Network không hợp lệ", etc.

**Flow:**
```
User chọn network → Check wallet → Chưa có?
  ↓
Hiển thị: [➕ Tạo ví cho SOL]
  ↓
User click → AlertDialog xác nhận
  ↓
Call createWallet() → Loading...
  ↓
Success → Hiển thị địa chỉ ví mới
```

---

### 4. **Dropdown chọn Coin để xem số dư** ⭐⭐
**Vấn đề hiện tại:**
- Chỉ hiển thị số dư USDT (hardcode)

**Giải pháp:**
- ✅ Thêm dropdown chọn coin từ `getListCoins()`
- ✅ Khi chọn coin → gọi `getBalance(coin_id)`
- ✅ Cập nhật số dư theo coin đã chọn
- ✅ Default: USDT (coin_id = 1 hoặc coin đầu tiên)

**UI đề xuất:**
```
┌─────────────────────────────────────────┐
│  Chọn coin: [USDT ▼]                    │
│  [Logo]  Số dư: 1,234.56 USDT  [Logo]  │
└─────────────────────────────────────────┘
```

---

### 5. **Cải thiện UX cho nút Nạp/Rút** ⭐⭐
**Vấn đề hiện tại:**
- Nút Nạp/Rút chưa có chức năng

**Giải pháp:**
- ✅ Validate: User phải có ví cho network đã chọn
- ✅ Nếu chưa có ví → Disable nút hoặc hiển thị tooltip
- ✅ Click "Nạp" → Mở Dialog/Sheet với form nạp tiền
- ✅ Click "Rút" → Mở Dialog/Sheet với form rút tiền
- ✅ Hiển thị địa chỉ ví để nạp tiền vào

**UI đề xuất:**
```
[Nạp] [Rút]  (nếu chưa có ví → disabled + tooltip)
```

---

### 6. **Hiển thị danh sách ví của user** ⭐
**Tính năng bổ sung:**
- ✅ Gọi `getMyWallets()` khi load page
- ✅ Hiển thị danh sách các network đã có ví
- ✅ Quick switch giữa các network
- ✅ Badge hiển thị network nào đang active

**UI đề xuất:**
```
┌─────────────────────────────────────────┐
│  Ví của bạn:                            │
│  [SOL ✓] [BNB] [ETH]                    │
│  (SOL đang được chọn)                   │
└─────────────────────────────────────────┘
```

---

### 7. **Loading States & Error Handling** ⭐⭐⭐
**Cải thiện:**
- ✅ Skeleton loading cho balance
- ✅ Loading spinner cho network dropdown
- ✅ Error toast messages rõ ràng
- ✅ Retry button khi fetch fail
- ✅ Empty states khi chưa có dữ liệu

---

### 8. **Responsive & Mobile Optimization** ⭐
**Cải thiện:**
- ✅ Mobile: Hiển thị bảng transactions (hiện đang `hidden sm:block`)
- ✅ Mobile: Compact layout cho số dư
- ✅ Touch-friendly buttons

---

## 🏗️ Cấu trúc code đề xuất

### State Management:
```typescript
const [selectedNetwork, setSelectedNetwork] = useState<string>('')
const [selectedCoin, setSelectedCoin] = useState<number>(1) // Default USDT
const [selectedNetworkSymbol, setSelectedNetworkSymbol] = useState<string>('')
const [walletAddress, setWalletAddress] = useState<string | null>(null)
const [isCreatingWallet, setIsCreatingWallet] = useState(false)
const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false)
```

### React Query Hooks:
```typescript
// 1. Networks
const { data: networksResponse, isLoading: isLoadingNetworks } = useQuery(...)

// 2. Coins
const { data: coinsResponse, isLoading: isLoadingCoins } = useQuery(...)

// 3. Balance (refetch khi coin_id thay đổi)
const { data: balanceResponse, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
  queryKey: ['balance', selectedCoin],
  queryFn: () => getBalance(selectedCoin),
  enabled: !!selectedCoin
})

// 4. My Wallets
const { data: myWalletsResponse, refetch: refetchMyWallets } = useQuery({
  queryKey: ['my-wallets'],
  queryFn: getMyWallets
})

// 5. Check Wallet Network (khi chọn network)
const { data: walletCheckResponse, refetch: refetchWalletCheck } = useQuery({
  queryKey: ['wallet-check', selectedNetworkSymbol],
  queryFn: () => handleCheckNetwork(selectedNetworkSymbol),
  enabled: !!selectedNetworkSymbol
})
```

### Mutations:
```typescript
// Create Wallet
const createWalletMutation = useMutation({
  mutationFn: (network_id: number) => createWallet(network_id),
  onSuccess: (data) => {
    toast.success('Tạo ví thành công!')
    setWalletAddress(data.data.uwn_public_key)
    refetchMyWallets()
    refetchWalletCheck()
  },
  onError: (error: any) => {
    const message = error?.response?.data?.message || 'Không thể tạo ví'
    toast.error(message)
  }
})
```

---

## 📝 Implementation Priority

### Phase 1 - Core Features (High Priority) ⭐⭐⭐
1. ✅ Hiển thị số dư thực từ API `getBalance()`
2. ✅ Hiển thị địa chỉ ví khi chọn network
3. ✅ Tự động tạo ví nếu chưa có
4. ✅ Loading states & Error handling

### Phase 2 - Enhanced UX (Medium Priority) ⭐⭐
5. ✅ Dropdown chọn coin
6. ✅ Cải thiện nút Nạp/Rút
7. ✅ Hiển thị danh sách ví

### Phase 3 - Polish (Low Priority) ⭐
8. ✅ Mobile optimization
9. ✅ Empty states
10. ✅ Animations & transitions

---

## 🎨 UI Components cần sử dụng

### Từ `src/ui/`:
- ✅ `Dialog` - Cho form tạo ví, nạp/rút tiền
- ✅ `AlertDialog` - Xác nhận tạo ví
- ✅ `Button` - Các nút action
- ✅ `CustomSelect` - Dropdown (đã có)
- ✅ `toast` (sonner) - Thông báo

### Components mới (optional):
- `WalletAddressCard` - Card hiển thị địa chỉ ví
- `BalanceCard` - Card hiển thị số dư với breakdown
- `NetworkBadge` - Badge hiển thị network

---

## 🔄 User Flow đề xuất

### Flow 1: User mới (chưa có ví)
```
1. Load page → Fetch networks, coins, balance
2. User chọn network (ví dụ: SOL)
3. Check wallet → Chưa có ví
4. Hiển thị: [➕ Tạo ví cho SOL]
5. User click → AlertDialog xác nhận
6. Call createWallet() → Loading
7. Success → Hiển thị địa chỉ ví mới
8. Enable nút Nạp/Rút
```

### Flow 2: User đã có ví
```
1. Load page → Fetch networks, coins, balance, my-wallets
2. User chọn network (ví dụ: SOL)
3. Check wallet → Đã có ví
4. Hiển thị địa chỉ ví với nút copy
5. Nút Nạp/Rút enabled
6. User có thể nạp/rút tiền
```

### Flow 3: Xem số dư coin khác
```
1. User chọn coin từ dropdown (ví dụ: BTC)
2. Call getBalance(coin_id)
3. Update số dư hiển thị
4. Hiển thị breakdown: balance, gift, reward
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Page Load │
└──────┬──────┘
       │
       ├─→ getListNetworks()
       ├─→ getListCoins()
       ├─→ getBalance(coin_id=1) // Default USDT
       └─→ getMyWallets()
       
┌─────────────┐
│ Select Network│
└──────┬──────┘
       │
       └─→ handleCheckNetwork(network_symbol)
            │
            ├─→ Có ví? → Hiển thị address
            └─→ Chưa có? → Hiển thị "Tạo ví"
            
┌─────────────┐
│ Create Wallet│
└──────┬──────┘
       │
       └─→ createWallet(network_id)
            │
            ├─→ Success → Update UI
            └─→ Error → Show toast
```

---

## ✅ Checklist Implementation

### Core Features
- [ ] Integrate `getBalance()` API
- [ ] Add coin selector dropdown
- [ ] Display real balance with breakdown
- [ ] Integrate `handleCheckNetwork()` or `getMyWallets()`
- [ ] Display wallet address when network selected
- [ ] Add "Create Wallet" functionality
- [ ] Add loading states
- [ ] Add error handling

### UI/UX
- [ ] Wallet address card component
- [ ] Balance card with breakdown
- [ ] Create wallet dialog/alert
- [ ] Copy address functionality
- [ ] Link to blockchain explorer
- [ ] Disable Nạp/Rút if no wallet
- [ ] Tooltips and help text

### Polish
- [ ] Skeleton loaders
- [ ] Empty states
- [ ] Mobile responsive
- [ ] Animations
- [ ] Error retry buttons

---

## 🚀 Next Steps

1. **Review & Approve** - Xem xét các ý tưởng trên
2. **Prioritize** - Chọn features cần implement trước
3. **Implement** - Bắt đầu code theo priority
4. **Test** - Test các tính năng mới
5. **Iterate** - Cải thiện dựa trên feedback

---

## 💬 Notes

- Tất cả APIs đã sẵn sàng trong `WalletService.ts`
- Có thể sử dụng Dialog/AlertDialog từ `src/ui/`
- React Query đã được setup sẵn
- Toast notifications đã có sẵn (sonner)

