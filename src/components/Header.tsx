'use client'

import { BellRing, SettingsIcon, Menu, Globe, Moon, Sun, User, ChevronDown, ChevronUp, X, Coins, Wallet, Users, Award } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'
import UserDropdown from './UserDropdown'
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/ui/use-mobile';
import { useLang } from '@/lang/useLang';
import { useTheme } from '@/theme/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { handleLogout } from '@/services/AuthService';
import { useQueryClient } from '@tanstack/react-query';

// Mobile User Section Component
const MobileUserSection: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profile, loading, error } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  const { t } = useLang();
  const queryClient = useQueryClient();

  const onLogoutClick = async () => {
    try {
      await handleLogout();
      queryClient.clear();
      logout();
      onClose();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      queryClient.clear();
      logout();
      onClose();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-2">
        <div className="text-center text-gray-500 dark:text-theme-gray-100/70 text-sm">
          {t('user.loading')}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="px-3 sm:px-4 py-2">
        <div className="text-center text-red-500 dark:text-red-400 text-sm">
          {t('user.loadError')}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-2">
      {/* User Profile Info */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 p-2 rounded-lg touch-manipulation"
        onClick={() => {
          router.push('/my-profile');
          onClose();
        }}
      >
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.display_name}
            className="w-10 h-10 rounded-full border-2 border-white dark:border-theme-gray-100 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-white dark:border-theme-gray-100 flex items-center justify-center bg-theme-gray-100 dark:bg-theme-gray-100/30">
            <User className="w-7 h-7 text-theme-black-100 dark:text-theme-gray-100" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-theme-black-100 dark:text-theme-gray-100 truncate">
              {profile.display_name}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push('/my-profile/kyc');
                onClose();
              }}
              className={`text-xs font-inter font-semibold border-none outline-none cursor-pointer bg-transparent hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 rounded-lg px-2 py-1 flex-shrink-0 ${
                profile.verify ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {profile.verify ? t('user.verified') : t('user.notVerified')}
            </button>
          </div>
          <p className="text-xs opacity-90 text-gray-500 dark:text-theme-gray-100/70 truncate">
            {profile.email}
          </p>
        </div>
      </div>
      
      {/* Logout Button */}
      <button
        onClick={onLogoutClick}
        className="w-full mt-2 py-2.5 px-4 bg-pink-500 dark:bg-pink-600 text-white border-none rounded-lg hover:bg-pink-600 dark:hover:bg-pink-700 active:bg-pink-700 dark:active:bg-pink-800 transition-colors text-sm font-medium cursor-pointer touch-manipulation"
      >
        {t('user.logout')}
      </button>
    </div>
  );
};

export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isLangSectionOpen, setIsLangSectionOpen] = useState(false);
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
      icon: Coins,
    },
    {
      name: t('header.wallet'),
      href: '/wallet',
      icon: Wallet,
    },
    {
      name: t('header.referral'),
      href: '/referral/smart',
      icon: Users,
    },
    {
      name: t('header.influencerRewards'),
      href: '/referral/kol',
      icon: Award,
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
          {/* Language Switcher - Desktop Only */}
          {!isMobile && (
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer rounded-full bg-transparent hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation"
                aria-label="Language"
              >
                <span className="text-base sm:text-lg">{langFlags[lang] || '🌐'}</span>
                <span className="text-xs sm:text-sm font-inter font-medium text-pink-500 dark:text-pink-400 uppercase">
                  {lang}
                </span>
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
          )}
          {/* Dark Mode Toggle - Desktop Only */}
          {!isMobile && (
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
          )}
          {/* <BellRing className='w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400 mx-1' /> */}
          {/* Mobile Menu Icon and Dropdown */}
          {isMobile && (
            <>
              {/* Backdrop */}
              {isMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
              )}
              <div className="relative" ref={menuRef}>
                {isMenuOpen && (
                  <div className="fixed inset-0 top-0 bg-white dark:bg-theme-gray-200 z-50 overflow-y-auto">
                    {/* Dropdown Header with Logo and Close Button */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-theme-gray-100">
                      <Link href="/" className='flex items-center gap-1.5 sm:gap-2' onClick={() => setIsMenuOpen(false)}>
                        <img
                          src="/logo.png"
                          alt="logo"
                          className='w-10 h-10 sm:w-12 sm:h-12 object-contain'
                        />
                        <span className='tracking-[-0.02em] leading-[150%] inline-block font-orbitron text-transparent !bg-clip-text [background:linear-gradient(180deg,_#fe645f,_#c68afe)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] font-bold text-sm'>
                          USDT ADS
                        </span>
                      </Link>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 rounded-full bg-transparent hover:bg-pink-100 dark:hover:bg-theme-gray-200 active:bg-pink-200 dark:active:bg-theme-gray-200/50 transition-colors border-none touch-manipulation"
                        aria-label="Close menu"
                      >
                        <X className="w-6 h-6 text-pink-500 dark:text-pink-400" />
                      </button>
                    </div>
                    <div className="p-2 sm:py-2">
                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-theme-gray-100 my-1"></div>
                      
                      {/* Language Switcher Section */}
                      <div className="px-3 sm:px-4 py-2">
                        <button
                          onClick={() => setIsLangSectionOpen(!isLangSectionOpen)}
                          className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer border-none text-xs font-inter font-semibold text-gray-500 dark:text-theme-gray-100/70 uppercase hover:bg-theme-gray-100 rounded-lg transition-colors touch-manipulation dark:text-gray-700"
                        >
                          <span>{t('header.language') || 'Language'}</span>
                          {isLangSectionOpen ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        {isLangSectionOpen && (
                          <div className="mt-2">
                            {langConfig.listLangs.map((langOption) => (
                              <button
                                key={langOption.code}
                                onClick={() => {
                                  setLang(langOption.code);
                                }}
                                className={`w-full px-3 py-1.5 mb-1 cursor-pointer border-none text-sm font-inter font-medium text-left hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 transition-colors flex items-center gap-3 rounded-lg touch-manipulation ${
                                  lang === langOption.code
                                    ? 'text-pink-500 dark:text-pink-400 bg-pink-50'
                                    : 'text-theme-black-100 dark:text-theme-gray-100'
                                }`}
                              >
                                <span className="text-lg text-theme-black-100">{langFlags[langOption.code] || '🌐'}</span>
                                <span className="flex-1 text-theme-black-100">{t(`languages.${langOption.code}`)}</span>
                                {lang === langOption.code && (
                                  <span className="text-pink-500 dark:text-pink-400 text-xs">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-theme-gray-100 my-1"></div>
                      
                      {/* Theme Toggle Section */}
                      <button
                        onClick={toggleTheme}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-none outline-none bg-transparent font-inter font-medium text-left hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 active:bg-theme-gray-100 dark:active:bg-theme-gray-100/30 transition-colors touch-manipulation flex items-center gap-3 text-theme-black-100 dark:text-theme-gray-100"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                            <span className="flex-1">{t('header.lightMode') || 'Light Mode'}</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                            <span className="flex-1">{t('header.darkMode') || 'Dark Mode'}</span>
                          </>
                        )}
                      </button>
                      
                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-theme-gray-100 my-1"></div>
                      
                      {/* User Profile Section - Import UserDropdown content */}
                      <MobileUserSection onClose={() => setIsMenuOpen(false)} />
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
            </>
          )}
          {/* UserDropdown - Desktop Only */}
          {!isMobile && <UserDropdown />}
        </div>


      </div>
      
      {/* Bottom Navigation Bar - Mobile Only */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-theme-gray-200 border-t border-gray-200 dark:border-theme-gray-100 safe-area-bottom">
          <div className="flex items-center justify-around px-1 py-1.5">
            {listMenu.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.name}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0 min-w-0"
                >
                  <div
                    className={`w-full flex flex-col items-center justify-center gap-1 py-1.5 px-0 rounded-lg transition-all touch-manipulation ${
                      isActive
                        ? 'text-pink-500 dark:text-pink-400'
                        : 'text-theme-black-100 dark:text-theme-gray-100'
                    }`}
                  >
                    <IconComponent 
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    <span className={`text-[10px] sm:text-xs font-inter font-medium truncate w-full text-center ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
