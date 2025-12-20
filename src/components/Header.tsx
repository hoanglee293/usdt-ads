'use client'

import { BellRing, SettingsIcon, Menu, Globe, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'
import UserDropdown from './UserDropdown'
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/ui/use-mobile';
import { useLang } from '@/lang/useLang';
import { useTheme } from '@/theme/useTheme';

export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const { t, lang, setLang, langConfig } = useLang();
  const { theme, toggleTheme } = useTheme();

  // Language flags mapping
  const langFlags: Record<string, string> = {
    'kr': '🇰🇷',
    'en': '🇺🇸',
    'vi': '🇻🇳',
    'ja': '🇯🇵',
    'zh': '🇨🇳',
  };

  // Get current language info
  const currentLang = langConfig.listLangs.find(l => l.code === lang) || langConfig.listLangs[0];

  const listMenu = [
    {
      name: t('header.makeMoney'),
      href: '/make-money',
    },
    {
      name: t('header.wallet'),
      href: '/wallet',
    },
    {
      name: t('header.referral'),
      href: '/referral/smart',
    },
    {
      name: t('header.influencerRewards'),
      href: '/referral/kol',
    }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };

    if (isMenuOpen || isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isLangMenuOpen]);

  return (
    <div className="fixed top-0 md:top-4 md:bg-transparent bg-transparent left-0 right-0 z-50 flex justify-between items-center h-14 md:h-16 px-3 sm:px-4 md:px-6 2xl:gap-24 gap-4 md:gap-16">
      {/* Logo Section */}
      <Link href="/" className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
        <img
          src="/logo.png"
          alt="logo"
          className='w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain'
        />
        <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-sm md:text-base'>
          USDT ADS
        </span>
      </Link>

      {/* Desktop Menu */}
      {!isMobile && (
        <div className="hidden md:flex items-center 2xl:gap-16 gap-6 bg-theme-pink-100/80 dark:bg-[#1B1B1B]/60 px-10 py-4  justify-center rounded-full">
          {listMenu.map((item) => (
            <Link href={item.href} key={item.name}>
              <div className={`text-sm font-inter font-medium rounded-full cursor-pointer hover:!text-theme-orange-100 flex-1 text-center ${pathname === item.href ? 'text-theme-orange-100 dark:text-theme-orange-100 font-semibold' : 'text-theme-black-100 dark:text-theme-gray-100'}`}>
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className='flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10'>
        {/* Right Side Icons */}
        <div className='flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10'>
          {/* Language Switcher */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer rounded-full bg-transparent hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation"
              aria-label="Language"
            >
              <span className="text-base sm:text-lg">{langFlags[lang] || '🌐'}</span>
              {!isMobile && (
                <span className="text-xs sm:text-sm font-inter font-medium text-pink-500 dark:text-pink-400 uppercase">
                  {lang}
                </span>
              )}
              {isMobile && (
                <Globe className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              )}
            </button>
            {isLangMenuOpen && (
              <div className="absolute right-0 top-[100%] mt-2 w-48 sm:w-52 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 overflow-hidden z-50 animate-fade-in-down">
                <div className="py-1">
                  {langConfig.listLangs.map((langOption) => (
                    <button
                      key={langOption.code}
                      onClick={() => {
                        setLang(langOption.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 sm:py-3 cursor-pointer border-none text-sm sm:text-base font-inter font-medium text-left hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 transition-colors flex items-center gap-3 ${
                        lang === langOption.code
                          ? 'text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-theme-gray-100/30'
                          : 'text-theme-black-100 dark:text-theme-gray-100 bg-white dark:bg-theme-gray-200'
                      }`}
                    >
                      <span className="text-lg sm:text-xl">{langFlags[langOption.code] || '🌐'}</span>
                      <span className="flex-1">{t(`languages.${langOption.code}`)}</span>
                      {lang === langOption.code && (
                        <span className="text-pink-500 dark:text-pink-400 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:px-2.5 sm:pt-2.5 sm:pb-2 cursor-pointer rounded-full bg-transparent hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 mx-1" />
            )}
          </button>
          {/* <BellRing className='w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400 mx-1' /> */}
          {/* Mobile Menu Icon and Dropdown */}

          {isMobile && (
            <div className="relative" ref={menuRef}>
              {isMenuOpen && (
                <div className="absolute right-0 top-[100%] mt-3 sm:mt-4 w-[70vw] sm:w-64 md:w-56 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 overflow-hidden z-50">
                  <div className="py-1 sm:py-2">
                    {listMenu.map((item) => (
                      <Link
                        href={item.href}
                        key={item.name}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-inter font-medium cursor-pointer hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 active:bg-theme-gray-100 dark:active:bg-theme-gray-100/30 transition-colors touch-manipulation ${pathname === item.href ? 'text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-theme-gray-100/30' : 'text-theme-black-100 dark:text-theme-gray-100'
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
                className="p-1.5 sm:p-2 rounded-full bg-transparent hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation"
                aria-label="Menu"
              >
                <Menu className="w-6 h-5 sm:w-7 pt-1 sm:h-6 text-pink-500 dark:text-pink-400" />
              </button>
            </div>
          )}
          <UserDropdown />
        </div>


      </div>
    </div>
  )
}
