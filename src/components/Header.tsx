import { BellRing, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import UserDropdown from './UserDropdown'
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  console.log(pathname)
  const listMenu = [
    {
      name: 'Hướng dẫn kiếm tiền',
      href: '/guide',
    },
    {
      name: 'Tham gia kiếm tiền',
      href: '/join',
    },
    {
      name: 'Nhận phần thưởng',
      href: '/reward',
    },
    {
      name: 'Nạp/ Rút',
      href: '/wallet',
    },
    {
      name: 'Referral',
      href: '/referral',
    },
    {
      name: 'Xem thêm',
      href: '/referral',
    },
  ]
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-between items-center h-16 px-6 2xl:gap-24 gap-16">
      <div className='flex items-center'>
        <img src="/logo.png" alt="logo" className='w-16 h-16 object-contain' />
        <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-base'>USDT ADS</span>
      </div>
      <div className="flex items-center 2xl:gap-16 gap-6 bg-theme-pink-100/80 px-4 py-4 flex-1 justify-center rounded-full">
        {listMenu.map((item) => (
          <Link href={item.href} key={item.name}>
            <div className={`text-sm font-inter font-medium rounded-full flex-1 text-center ${pathname === item.href ? 'text-pink-500' : 'text-theme-black-100'}`}>{item.name}</div>
          </Link>
        ))}
      </div>
      <div className='flex items-center gap-10'>
        <SettingsIcon className='w-5 h-5 text-pink-500' />
        <BellRing className='w-5 h-5 text-pink-500' />
        <UserDropdown />
      </div>
    </div>
  )
}
