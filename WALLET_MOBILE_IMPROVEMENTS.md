# 📱 Đề Xuất Cải Thiện Mobile cho Wallet Page

## 📋 Phân Tích Hiện Trạng

### Vấn Đề Hiện Tại:

1. **Transaction Table (8 cột) - Không tối ưu cho mobile:**
   - Bảng có 8 cột: STT, THỜI GIAN, TYPE, SỐ TIỀN, FROM ADDRESS, TO ADDRESS, TRANSACTION ID, STATUS
   - Trên mobile, bảng sẽ bị overflow hoặc text quá nhỏ
   - Khó đọc và tương tác trên màn hình nhỏ
   - Scroll ngang không user-friendly

2. **Layout & Spacing:**
   - `pt-24` có thể quá lớn trên mobile (chiếm nhiều không gian)
   - `p-6` (24px) padding có thể giảm trên mobile
   - `max-w-7xl` container quá rộng cho mobile
   - Gaps giữa sections chưa tối ưu

3. **Balance Section:**
   - Logo + Balance + Logo layout có thể compact hơn trên mobile
   - Font size `text-2xl` có thể quá lớn
   - Dropdown coin selector có thể cải thiện

4. **Network Selection & Wallet Address:**
   - `max-w-56` và `max-w-2xl` có thể điều chỉnh
   - Wallet address display có thể compact hơn

5. **Buttons (Nạp/Rút):**
   - `max-w-56` có thể full-width trên mobile
   - `gap-4` có thể điều chỉnh
   - `h-12` có thể giảm xuống `h-11` trên mobile

6. **Table Styles:**
   - `max-h-[60vh] sm:max-h-[65.5vh]` - có thể điều chỉnh
   - Font sizes `text-xs sm:text-sm lg:text-base` - cần review
   - Padding `px-2 py-2 sm:px-3` - có thể tối ưu

---

## 🎯 Đề Xuất Cải Thiện

### 1. **Transaction Table → Card Layout trên Mobile** ⭐⭐⭐

#### Vấn đề:
- Bảng 8 cột không thể hiển thị tốt trên mobile
- Scroll ngang không user-friendly

#### Giải pháp:
- **Desktop (≥768px)**: Giữ nguyên bảng
- **Mobile (<768px)**: Chuyển sang Card Layout

#### Mobile Card Design:
```tsx
// Mỗi transaction là một card
┌─────────────────────────────────┐
│ Type: Rút | Status: Complete   │
│ ───────────────────────────────│
│ Số tiền: 100.00 USDT           │
│ Thời gian: 10:30 25/12/2024    │
│ ───────────────────────────────│
│ From: 0x1234....5678 [Copy]    │
│ To: 0xabcd....efgh [Copy]      │
│ ───────────────────────────────│
│ TX ID: 0x9876....4321 [Copy]   │
│              [View Details >]   │
└─────────────────────────────────┘
```

#### Implementation:
```tsx
const isMobile = useIsMobile()

{isMobile ? (
  // Card Layout
  <div className="space-y-3">
    {transactions.map((tx) => (
      <TransactionCard key={tx.id} transaction={tx} />
    ))}
  </div>
) : (
  // Table Layout (existing)
  <div className={tableContainerStyles}>
    <table className={tableStyles}>...</table>
  </div>
)}
```

---

### 2. **Compact Balance Section trên Mobile** ⭐⭐

#### Hiện tại:
```tsx
<div className='flex items-end justify-center mb-3'>
  <img src="/logo.png" className='w-10 h-10' />
  <div className='flex flex-col items-center mx-4'>
    <span>Chọn coin: [Dropdown]</span>
    <span className='text-2xl'>Số dư: 1000.00 USDT</span>
  </div>
  <img src="/logo.png" className='w-10 h-10' />
</div>
```

#### Đề xuất Mobile:
```tsx
// Mobile: Stack vertically, compact hơn
<div className='flex flex-col items-center mb-4'>
  <div className='flex items-center gap-2 mb-2'>
    <span className='text-xs font-medium text-theme-red-100'>Coin:</span>
    <CustomSelect ... className="w-20 text-xs" />
  </div>
  <div className='flex items-center gap-2'>
    <img src="/logo.png" className='w-8 h-8' />
    <span className='text-lg sm:text-xl md:text-2xl font-bold text-pink-500'>
      {formatBalance(balance)} {coinSymbol}
    </span>
    <img src="/logo.png" className='w-8 h-8' />
  </div>
  {(balance_gift > 0 || balance_reward > 0) && (
    <span className='text-xs text-gray-600 mt-1'>
      (Quà: {balance_gift} | Thưởng: {balance_reward})
    </span>
  )}
</div>
```

**Lý do:**
- Logo nhỏ hơn: `w-8 h-8` thay vì `w-10 h-10`
- Font size responsive: `text-lg` mobile → `text-xl` tablet → `text-2xl` desktop
- Stack layout tiết kiệm không gian ngang

---

### 3. **Responsive Container & Padding** ⭐⭐

#### Hiện tại:
```tsx
<div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9]'>
  <div className='w-full max-w-7xl'>...</div>
</div>
```

#### Đề xuất:
```tsx
<div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-24 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9]'>
  <div className='w-full max-w-7xl'>...</div>
</div>
```

**Lý do:**
- `pt-16` (64px) trên mobile thay vì `pt-24` (96px) - tiết kiệm không gian
- `px-3` (12px) trên mobile thay vì `p-6` (24px)
- `py-4` (16px) trên mobile cho padding dọc

---

### 4. **Network Selection & Wallet Address - Mobile Optimized** ⭐⭐

#### Network Selection:
```tsx
<div className='mb-4 sm:mb-6 flex flex-col items-center justify-center'>
  <label className='block mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-theme-red-100'>
    Chọn mạng lưới
  </label>
  <CustomSelect
    className="w-full max-w-xs sm:max-w-56 text-sm"
    ...
  />
</div>
```

#### Wallet Address Card:
```tsx
// Mobile: Compact hơn
<div className='mb-4 sm:mb-6 w-full px-3 sm:px-0'>
  {hasWallet ? (
    <div className='w-full p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
      <label className='text-xs sm:text-sm font-medium text-theme-red-100 mb-1.5'>
        Địa chỉ ví {networkSymbol}:
      </label>
      <div className='flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200'>
        <span className='text-xs sm:text-sm text-yellow-600 italic flex-1 break-all'>
          {formatAddress(walletAddress)}
        </span>
        <button className='...'>
          <Copy className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
        </button>
      </div>
    </div>
  ) : (
    // Create wallet button - full width on mobile
    <div className='w-full p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
      <p className='text-xs sm:text-sm text-yellow-800 mb-2 sm:mb-3 text-center'>
        Bạn chưa có ví cho {networkName} ({networkSymbol})
      </p>
      <Button className='w-full h-10 sm:h-12 ...'>
        ...
      </Button>
    </div>
  )}
</div>
```

---

### 5. **Deposit/Withdraw Buttons - Stack trên Mobile** ⭐⭐

#### Hiện tại:
```tsx
<div className='flex items-center justify-center gap-4 mb-10'>
  <Button className='w-full max-w-56 ...'>Nạp</Button>
  <Button className='w-full max-w-56 ...'>Rút</Button>
</div>
```

#### Đề xuất:
```tsx
<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-10 px-3 sm:px-0'>
  <Button className='w-full sm:max-w-56 h-11 sm:h-12 text-base sm:text-lg ...'>
    Nạp
  </Button>
  <Button className='w-full sm:max-w-56 h-11 sm:h-12 text-base sm:text-lg ...'>
    Rút
  </Button>
</div>
```

**Lý do:**
- Stack vertically trên mobile (`flex-col`)
- Full width trên mobile (`w-full`)
- Height nhỏ hơn: `h-11` mobile → `h-12` desktop
- Font size: `text-base` mobile → `text-lg` desktop

---

### 6. **Transaction Card Component** ⭐⭐⭐

#### Component mới:
```tsx
interface TransactionCardProps {
  transaction: Transaction
}

function TransactionCard({ transaction }: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.type === 'Rút' 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {transaction.type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.status === 'Complete'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {transaction.status}
          </span>
        </div>
        <span className="text-xs text-gray-500">#{transaction.id}</span>
      </div>
      
      {/* Amount & Time */}
      <div className="mb-2">
        <div className="text-base font-semibold text-gray-900">
          {transaction.amount}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {transaction.time}
        </div>
      </div>
      
      {/* Quick Info (Collapsed by default) */}
      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1 mt-2"
        >
          Xem chi tiết <ChevronDown className="w-3 h-3" />
        </button>
      )}
      
      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <AddressRow 
            label="From" 
            address={transaction.fromAddress} 
          />
          <AddressRow 
            label="To" 
            address={transaction.toAddress} 
          />
          <AddressRow 
            label="TX ID" 
            address={transaction.transactionId} 
          />
          <button
            onClick={() => setShowDetails(false)}
            className="text-xs text-gray-500 hover:text-gray-600 flex items-center gap-1 mt-2"
          >
            Thu gọn <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function AddressRow({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium text-gray-600 min-w-[60px]">
        {label}:
      </span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs text-yellow-600 italic break-all">
          {formatAddress(address)}
        </span>
        <button
          onClick={() => handleCopy(address, label.toLowerCase())}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
```

---

### 7. **Empty State & Loading States** ⭐

#### Empty State:
```tsx
{transactions.length === 0 && (
  <div className="text-center py-12 px-4">
    <div className="text-gray-400 mb-2">
      <Wallet className="w-12 h-12 mx-auto" />
    </div>
    <p className="text-sm text-gray-500">
      Chưa có giao dịch nào
    </p>
  </div>
)}
```

#### Loading State (Mobile Cards):
```tsx
{isLoadingTransactionHistory ? (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-32 w-full rounded-lg" />
    ))}
  </div>
) : ...}
```

---

### 8. **Sheet Modal cho Transaction Details (Optional)** ⭐

#### Nếu muốn chi tiết hơn:
- Click vào card → Mở Sheet với đầy đủ thông tin
- Có thể thêm link đến blockchain explorer
- Có thể thêm QR code cho addresses

```tsx
<Sheet open={selectedTransaction !== null} onOpenChange={...}>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Chi tiết giao dịch</SheetTitle>
    </SheetHeader>
    {/* Full transaction details */}
  </SheetContent>
</Sheet>
```

---

## 📐 Responsive Breakpoints

Sử dụng Tailwind breakpoints:
- **Mobile**: `< 640px` (default)
- **sm**: `≥ 640px` (small tablets)
- **md**: `≥ 768px` (tablets - switch to table layout)
- **lg**: `≥ 1024px`
- **2xl**: `≥ 1536px`

**Hook sử dụng:**
```tsx
import { useIsMobile } from '@/ui/use-mobile'

const isMobile = useIsMobile() // < 768px
```

---

## 🎨 Design Mockup

### Mobile Layout (<768px):
```
┌─────────────────────────────┐
│     [Logo] Balance [Logo]   │
│   Chọn coin: [USDT ▼]       │
│                             │
│  Chọn mạng lưới:            │
│  [SOL ▼]                    │
│                             │
│  Địa chỉ ví:                │
│  ┌───────────────────────┐  │
│  │ 0x1234....5678 [Copy] │  │
│  └───────────────────────┘  │
│                             │
│  [Nạp] (full width)         │
│  [Rút] (full width)         │
│                             │
│  ┌───────────────────────┐  │
│  │ Rút | Complete        │  │
│  │ 100.00 USDT           │  │
│  │ 10:30 25/12/2024      │  │
│  │ [Xem chi tiết >]      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Nạp | Complete       │  │
│  │ 50.00 USDT           │  │
│  │ ...                  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Desktop Layout (≥768px):
- Giữ nguyên bảng hiện tại
- Tất cả sections hiển thị ngang
- Buttons side-by-side

---

## ✅ Implementation Checklist

### Phase 1 - Core Mobile Improvements ⭐⭐⭐
- [ ] Thêm `useIsMobile` hook
- [ ] Tạo `TransactionCard` component
- [ ] Chuyển table → cards trên mobile
- [ ] Responsive container padding (`px-3 sm:px-4 md:px-6`)
- [ ] Responsive top padding (`pt-16 sm:pt-20 md:pt-24`)

### Phase 2 - Layout Optimizations ⭐⭐
- [ ] Compact balance section trên mobile
- [ ] Stack buttons vertically trên mobile
- [ ] Responsive font sizes
- [ ] Responsive logo sizes
- [ ] Optimize wallet address card

### Phase 3 - UX Enhancements ⭐
- [ ] Empty state cho transactions
- [ ] Loading skeletons cho cards
- [ ] Expand/collapse transaction details
- [ ] Sheet modal cho full details (optional)
- [ ] Touch-friendly spacing

---

## 🔧 Code Changes Summary

### 1. Import hook:
```tsx
import { useIsMobile } from '@/ui/use-mobile'
```

### 2. Main container:
```tsx
<div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-24 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9]'>
```

### 3. Balance section:
```tsx
// Responsive logo sizes, font sizes, layout
```

### 4. Buttons:
```tsx
<div className='flex flex-col sm:flex-row ...'>
```

### 5. Transactions:
```tsx
{isMobile ? (
  <div className="space-y-3">
    {transactions.map(tx => <TransactionCard key={tx.id} transaction={tx} />)}
  </div>
) : (
  // Existing table
)}
```

---

## 📊 Expected Results

1. ✅ **Better Mobile UX**: Cards dễ đọc và tương tác hơn bảng
2. ✅ **Space Efficient**: Tiết kiệm không gian màn hình
3. ✅ **Touch Friendly**: Buttons và interactive elements lớn hơn
4. ✅ **Responsive**: Hoạt động tốt từ mobile đến desktop
5. ✅ **Performance**: Lazy load details, chỉ hiển thị khi cần

---

## 🚀 Next Steps

1. **Review & Approve** - Xem xét các đề xuất
2. **Implement Phase 1** - Core mobile improvements
3. **Test** - Test trên các device sizes khác nhau
4. **Iterate** - Cải thiện dựa trên feedback
5. **Polish** - Thêm animations và transitions

---

## 💬 Notes

- Giữ nguyên desktop experience (bảng)
- Mobile-first approach cho các components mới
- Sử dụng existing UI components (Sheet, Skeleton, etc.)
- Follow design patterns từ Header component
- Test trên real devices nếu có thể

