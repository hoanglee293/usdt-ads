'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, X, Mail, Phone, MessageCircle, Copy, CheckCircle, Calendar, User, Shield, Award, Clock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { handleLogout } from '@/services/AuthService';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lang/useLang';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile, loading, error } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  const { t } = useLang();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const onLogoutClick = async () => {
    await handleLogout();
    setIsOpen(false);
    logout();
  }

  if (loading) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-theme-gray-200 transition-colors border-none cursor-pointer"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 p-4">
            <div className="text-center text-gray-500 dark:text-theme-gray-100/70">{t('user.loading')}</div>
          </div>
        )}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-theme-gray-200 transition-colors border-none cursor-pointer"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 p-4">
            <div className="text-center text-red-500 dark:text-red-400">{t('user.loadError')}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-theme-gray-200 transition-colors border-none cursor-pointer"
        aria-label="User menu"
      >
        <UserIcon className="w-5 h-4 sm:w-6 sm:h-5 text-pink-500 dark:text-pink-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-theme-gray-200 rounded-lg shadow-xl border border-gray-200 dark:border-theme-gray-100 overflow-hidden z-50">
          {/* Content */}
          <div className="p-2 max-h-96 overflow-y-auto">
            {/* Email */}
            <div className="flex items-center gap-4 cursor-pointer hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 p-2 rounded-lg" onClick={() => {router.push('/my-profile'); setIsOpen(false)}}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.display_name}
                  className="w-16 h-16 rounded-full border-2 border-white dark:border-theme-gray-100 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-theme-gray-100 flex items-center justify-center bg-theme-gray-100 dark:bg-theme-gray-100/30">
                  <User className="w-8 h-8 text-theme-black-100 dark:text-theme-gray-100" />
                  
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg text-theme-black-100 dark:text-theme-gray-100">{profile.display_name}</p>
                <p className="text-sm opacity-90 text-gray-500 dark:text-theme-gray-100/70">{profile.email}</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="p-2 bg-gray-50 dark:bg-theme-gray-100/20 border-t border-gray-200 dark:border-theme-gray-100">
            <button
              onClick={() => onLogoutClick()}
              className="w-full py-2 px-4 bg-pink-500 dark:bg-pink-600 text-white border-none rounded-lg hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors text-sm font-medium cursor-pointer"
            >
              {t('user.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

