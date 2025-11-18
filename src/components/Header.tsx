'use client'

import { BellRing, SettingsIcon, Menu } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'
import UserDropdown from './UserDropdown'
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/ui/use-mobile';

export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const listMenu = [
    {
      name: 'Tham gia kiếm tiền',
      href: '/make-money',
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
    }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="fixed top-0 md:top-4 md:bg-transparent bg-theme-pink-100/80 left-0 right-0 z-50 flex justify-between items-center h-14 md:h-16 px-3 sm:px-4 md:px-6 2xl:gap-24 gap-4 md:gap-16">
      {/* Logo Section */}
      <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
        <img
          src="/logo.png"
          alt="logo"
          className='w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain'
        />
        <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-sm md:text-base'>
          USDT ADS
        </span>
      </div>

      {/* Desktop Menu */}
      {!isMobile && (
        <div className="hidden md:flex items-center 2xl:gap-16 gap-6 bg-theme-pink-100/80 px-4 py-4 flex-1 justify-center rounded-full">
          {listMenu.map((item) => (
            <Link href={item.href} key={item.name}>
              <div className={`text-sm font-inter font-medium rounded-full flex-1 text-center ${pathname === item.href ? 'text-pink-500' : 'text-theme-black-100'}`}>
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className='flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10'>
        {/* Right Side Icons */}
        <div className='flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10'>
          <SettingsIcon className='w-4 h-4 sm:w-5 sm:h-5 text-pink-500 mx-1' />
          <BellRing className='w-4 h-4 sm:w-5 sm:h-5 text-pink-500 mx-1' />
          {/* Mobile Menu Icon and Dropdown */}

          {isMobile && (
            <div className="relative" ref={menuRef}>
              {isMenuOpen && (
                <div className="absolute right-0 top-[100%] mt-3 sm:mt-4 w-[70vw] sm:w-64 md:w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="py-1 sm:py-2">
                    {listMenu.map((item) => (
                      <Link
                        href={item.href}
                        key={item.name}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-inter font-medium cursor-pointer hover:bg-theme-gray-100 active:bg-theme-gray-100 transition-colors touch-manipulation ${pathname === item.href ? 'text-pink-500 bg-pink-50' : 'text-theme-black-100'
                            }`}
                        >
                          {item.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 sm:p-2 rounded-full bg-transparent hover:bg-pink-100 active:bg-pink-200 transition-colors border-none touch-manipulation"
                aria-label="Menu"
              >
                <Menu className="w-6 h-5 sm:w-7 pt-1 sm:h-6 text-pink-500" />
              </button>
            </div>
          )}
          <UserDropdown />
        </div>


      </div>
    </div>
  )
}
