'use client'

import React from 'react'
import Link from 'next/link'
import { Network, Box, Users, Smartphone, Megaphone, Monitor, DollarSign } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useLang } from '@/lang/useLang'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { t } = useLang()
  const router = useRouter()
  // Hero Section Observers - Giảm threshold và rootMargin cho mobile
  const { elementRef: logoRef, isIntersecting: logoInView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: titleRef, isIntersecting: titleInView } = useIntersectionObserver<HTMLHeadingElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: subtitleRef, isIntersecting: subtitleInView } = useIntersectionObserver<HTMLParagraphElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: ctaRef, isIntersecting: ctaInView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  // Features Grid Observers - Giảm threshold cho mobile
  const { elementRef: feature1Ref, isIntersecting: feature1InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature2Ref, isIntersecting: feature2InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: centerTitleRef, isIntersecting: centerTitleInView } = useIntersectionObserver<HTMLHeadingElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature3Ref, isIntersecting: feature3InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature4Ref, isIntersecting: feature4InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  // How USDA Works Section Observers
  const { elementRef: sectionTitleRef, isIntersecting: sectionTitleInView } = useIntersectionObserver<HTMLHeadingElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: panel1Ref, isIntersecting: panel1InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: panel2Ref, isIntersecting: panel2InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: panel3Ref, isIntersecting: panel3InView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  // Image Observers - Giảm threshold để trigger sớm hơn trên mobile
  const { elementRef: bgImageRef, isIntersecting: bgImageInView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.05,
    rootMargin: '0px'
  });

  const { elementRef: feature1ImageRef, isIntersecting: feature1ImageInView } = useIntersectionObserver<HTMLImageElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature2ImageRef, isIntersecting: feature2ImageInView } = useIntersectionObserver<HTMLImageElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature3ImageRef, isIntersecting: feature3ImageInView } = useIntersectionObserver<HTMLImageElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  const { elementRef: feature4ImageRef, isIntersecting: feature4ImageInView } = useIntersectionObserver<HTMLImageElement>({
    threshold: 0.1,
    rootMargin: '0px'
  });

  return (
    <div className="relative min-h-screen container mx-auto overflow-hidden bg-transparent dark:bg-black py-24 lg:py-32 xl:py-48 px-4 sm:px-6">

      {/* SVG Gradients Definitions */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FE645F" />
            <stop offset="100%" stopColor="#C68AFE" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          ref={bgImageRef}
          className="absolute top-1/2 left-1/2 mt-[-14vh] -translate-x-1/2 -translate-y-1/2 w-[120%] sm:w-full h-full rounded-full opacity-30 sm:opacity-50 md:opacity-100"
        >
          <img
            src="/bg-main.png"
            alt="bg-main"
            className={`w-full h-full object-contain animate-float-slow transition-opacity duration-1000 ${bgImageInView ? 'in-view opacity-100' : 'opacity-30 sm:opacity-50 dark:opacity-10'}`}
          />
        </div>

        {/* Top Section - Logo, Title, Subtitle, CTA */}
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16 md:mb-24 lg:mb-32 max-w-4xl w-full px-4">
          {/* Logo */}
          <div
            ref={logoRef}
            className={`mb-4 sm:mb-6 md:mb-8 animate-scale-in ${logoInView ? 'in-view' : ''}`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative">
              <img
                src="/logo.png"
                alt="USDA Logo"
                className={`relative w-full h-full object-contain transition-all duration-500 animate-bounce-gentle ${logoInView ? 'in-view' : ''}`}
              />
            </div>
          </div>
          <button onClick={() => router.push('/whitepaper')} className='w-fit mx-auto cursor-pointer sm:w-auto px-6 sm:px-10  border-none outline-none py-1 sm:py-1.5 bg-[#a976fb] text-white font-bold text-xs sm:text-sm md:text-base rounded-full hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 uppercase tracking-wide mb-4'>{t('home.learnMore')}</button>

          {/* Main Title */}
          <h1
            ref={titleRef}
            className={`text-2xl sm:text-3xl uppercase mt-5 md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-gradient-secondary leading-tight overflow-visible animate-fade-in-up px-2 ${titleInView ? 'in-view' : ''}`}
          >
            {t('home.title')}
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className={`text-xs sm:text-sm md:text-base lg:text-lg text-theme-black-100 dark:text-gray-300 mb-6 sm:mb-8 md:mb-10 font-medium max-w-2xl animate-fade-in-up-delayed px-2 ${subtitleInView ? 'in-view' : ''}`}
          >
            {t('home.subtitle')}
          </p>

          {/* CTA Button */}
          <div
            ref={ctaRef}
            className={`animate-fade-in-up-more-delayed w-full sm:w-auto cursor-pointer ${ctaInView ? 'in-view' : ''}`}
          >
            <button 
              onClick={() => router.push('/make-money')}
              className="uiverse w-full min-w-2xl sm:w-full text-xs sm:text-sm md:text-base lg:text-lg uppercase tracking-wide"
            >
              <div className="wrapper">
                <span>{t('home.joinNow')}</span>
                <div className="circle circle-12"></div>
                <div className="circle circle-11"></div>
                <div className="circle circle-10"></div>
                <div className="circle circle-9"></div>
                <div className="circle circle-8"></div>
                <div className="circle circle-7"></div>
                <div className="circle circle-6"></div>
                <div className="circle circle-5"></div>
                <div className="circle circle-4"></div>
                <div className="circle circle-3"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-1"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Central Section with Features */}
        <div className="relative w-full pb-12 sm:pb-16 md:pb-20 px-2 sm:px-4">
          {/* Mobile/Tablet: Stack vertically or 2 columns */}
          {/* Desktop: 3x3 Grid */}
          <div className="relative">
            {/* Mobile Layout: 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:hidden">
              {/* Center Title - Mobile - Full Width */}
              <div className="col-span-2 text-center mb-4 sm:mb-6">
                <h2
                  ref={centerTitleRef}
                  className={`text-xl sm:text-2xl uppercase font-bold text-gradient-secondary animate-scale-in ${centerTitleInView ? 'in-view' : ''}`}
                >
                  {t('home.introTitle')}
                </h2>
              </div>

              {/* Feature 1: Công nghệ */}
              <div
                ref={feature1Ref}
                className={`flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up ${feature1InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      ref={feature1ImageRef}
                      src="/block-chain.png"
                      alt="tech"
                      className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-500 animate-float ${feature1ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#fe645f] to-[#c4cf2b] rounded-full px-3 sm:px-4 py-2 text-white shadow-lg w-full text-center min-h-28 flex items-center justify-center flex-col gap-2">
                  <span className="font-bold text-xs sm:text-sm   underline underline-offset-4">{t('home.features.technology.title')}</span>
                  <span className="text-xs sm:text-sm font-inter leading-relaxed">
                    {t('home.features.technology.description')}
                  </span>
                </div>
              </div>

              {/* Feature 2: Thiết bị */}
              <div
                ref={feature2Ref}
                className={`flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up ${feature2InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  <img
                    ref={feature2ImageRef}
                    src="/phone.png"
                    alt="tech"
                    className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-500 animate-float-fast ${feature2ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                  />
                </div>
                <div className="bg-gradient-to-br from-[#e7807d] to-[#59e7a5] rounded-full px-3 sm:px-4 py-2 text-white shadow-lg w-full text-center min-h-28 flex items-center justify-center flex-col gap-2">
                  <span className="font-bold text-xs sm:text-sm   underline underline-offset-4">{t('home.features.device.title')}</span>
                  <span className="text-xs sm:text-sm font-inter leading-relaxed">
                    {t('home.features.device.description')}
                  </span>
                </div>
              </div>

              {/* Feature 3: Blockchain */}
              <div
                ref={feature3Ref}
                className={`flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up ${feature3InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  <div className="relative">
                    <img
                      ref={feature3ImageRef}
                      src="/ai-block-chain.png"
                      alt="tech"
                      className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-500 animate-pulse-glow ${feature3ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#97c762] to-[#582ce8] rounded-full px-3 sm:px-4 py-2 text-white shadow-lg w-full text-center min-h-28 flex items-center justify-center flex-col gap-2">
                  <span className="font-bold text-xs sm:text-sm   underline underline-offset-4">{t('home.features.blockchain.title')}</span>
                  <span className="text-xs sm:text-sm font-inter leading-relaxed">
                    {t('home.features.blockchain.description')}
                  </span>
                </div>
              </div>

              {/* Feature 4: Cộng đồng */}
              <div
                ref={feature4Ref}
                className={`flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up ${feature4InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  <img
                    ref={feature4ImageRef}
                    src="/socical.png"
                    alt="tech"
                    className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-500 animate-bounce-gentle ${feature4ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                  />
                </div>
                <div className="bg-gradient-to-br from-[#5fdcfe] to-[#c50f92] rounded-full px-3 sm:px-4 py-2 text-white shadow-lg w-full text-center min-h-28 flex items-center justify-center flex-col gap-2">
                  <span className="font-bold text-xs sm:text-sm   underline underline-offset-4">{t('home.features.community.title')}</span>
                  <span className="text-xs sm:text-sm font-inter leading-relaxed">
                    {t('home.features.community.description')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tablet/Desktop Layout: 3x3 Grid */}
            <div className="hidden md:grid md:grid-cols-3 md:grid-rows-3 gap-6 md:gap-8 lg:gap-10">
              {/* Feature 1: Công nghệ - Top Right */}
              <div
                ref={feature1Ref}
                className={`col-start-2 row-start-1 flex flex-col items-center gap-4 md:gap-6 animate-fade-in-down ${feature1InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      ref={feature1ImageRef}
                      src="/block-chain.png"
                      alt="tech"
                      className={`w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain transition-all duration-500 animate-float ${feature1ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-4 md:px-6 py-2 text-white shadow-lg justify-start items-start max-w-lg text-center md:text-left">
                  <span className="font-bold text-sm md:text-base   underline underline-offset-4">{t('home.features.technology.title')}</span>
                  <span className="text-sm md:text-base font-inter leading-relaxed">
                    : {t('home.features.technology.description')}
                  </span>
                </div>
              </div>

              {/* Feature 2: Thiết bị - Middle Left */}
              <div
                ref={feature2Ref}
                className={`col-start-1 row-start-2 flex flex-col items-center gap-4 md:gap-6 animate-fade-in-right ${feature2InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                  <img
                    ref={feature2ImageRef}
                    src="/phone.png"
                    alt="tech"
                    className={`w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain transition-all duration-500 animate-float-fast ${feature2ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                  />
                </div>
                <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-4 md:px-6 py-2 text-white shadow-lg max-w-lg text-center md:text-left">
                  <span className="font-bold text-sm md:text-base   underline underline-offset-4">{t('home.features.device.title')}</span>
                  <span className="text-sm md:text-base font-inter leading-relaxed">
                    : {t('home.features.device.description')}
                  </span>
                </div>
              </div>

              {/* Center Title */}
              <div className="text-center col-start-2 row-start-2 flex justify-center items-center w-full">
                <h2
                  ref={centerTitleRef}
                  className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gradient-secondary max-w-80 animate-scale-in ${centerTitleInView ? 'in-view' : ''}`}
                >
                  {t('home.introTitle')}
                </h2>
              </div>

              {/* Feature 3: Blockchain - Middle Right */}
              <div
                ref={feature3Ref}
                className={`col-start-3 row-start-2 flex flex-col items-center gap-4 md:gap-6 justify-center animate-fade-in-left ${feature3InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                  <div className="relative">
                    <img
                      ref={feature3ImageRef}
                      src="/ai-block-chain.png"
                      alt="tech"
                      className={`w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain transition-all duration-500 animate-pulse-glow ${feature3ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-4 md:px-6 py-2 text-white shadow-lg max-w-lg text-center md:text-left">
                  <span className="font-bold text-sm md:text-base   underline underline-offset-4">{t('home.features.blockchain.title')}</span>
                  <span className="text-sm md:text-base font-inter leading-relaxed">
                    : {t('home.features.blockchain.description')}
                  </span>
                </div>
              </div>

              {/* Feature 4: Cộng đồng - Bottom Center */}
              <div
                ref={feature4Ref}
                className={`col-start-2 row-start-3 flex flex-col items-center gap-4 md:gap-6 animate-fade-in-up ${feature4InView ? 'in-view' : ''}`}
              >
                <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                  <img
                    ref={feature4ImageRef}
                    src="/socical.png"
                    alt="tech"
                    className={`w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain transition-all duration-500 animate-bounce-gentle ${feature4ImageInView ? 'in-view opacity-100 scale-100' : 'opacity-70 scale-90'}`}
                  />
                </div>
                <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-4 md:px-6 py-2 text-white shadow-lg max-w-lg text-center md:text-left">
                  <span className="font-bold text-sm md:text-base   underline underline-offset-4">{t('home.features.community.title')}</span>
                  <span className="text-sm md:text-base font-inter leading-relaxed">
                    : {t('home.features.community.description')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* How USDA Works Section */}
      <div className="w-full max-w-7xl mx-auto mt-12 sm:mt-16 md:mt-24 lg:mt-32 xl:mt-40 px-4 sm:px-6">
        {/* Section Title */}
        <h2
          ref={sectionTitleRef}
          className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gradient-secondary w-full text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 uppercase  animate-fade-in-up px-2 ${sectionTitleInView ? 'in-view' : ''}`}
        >
          {t('home.howItWorks.title')}
        </h2>

        {/* Three Panels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
          {/* Panel 1: Advertising Revenue */}
          <div
            ref={panel1Ref}
            className={`relative rounded-xl hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-purple-500/20 transition-all animate-fade-in-up ${panel1InView ? 'in-view' : ''}`}
            style={{
              background: '#100720',
              borderRadius: '1rem',
            }}
          >
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(255,94,247,1) 17.8%, rgba(2,245,255,1) 100.2%)',
                filter: 'blur(15px)',
                zIndex: 0,
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
              }}
            />
            <div className="relative z-10 p-5 sm:p-6 md:px-5 md:py-10 lg:py-12 dark:!bg-black bg-white rounded-2xl flex flex-col gap-2 items-center text-center">
            {/* Icon with Dollar Sign */}
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                    <Megaphone
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                      style={{
                        stroke: 'url(#icon-gradient)',
                      }}
                      strokeWidth={1.5}
                      fill="none"
                    />
                  </div>
                  {/* Sound waves */}
                  <div className="absolute -right-1 sm:-right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
                    <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-gradient-to-b from-[#FE645F] to-[#C68AFE] rounded-full"></div>
                    <div className="w-0.5 sm:w-1 h-4 sm:h-6 bg-gradient-to-b from-[#FE645F] to-[#C68AFE] rounded-full"></div>
                    <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-gradient-to-b from-[#FE645F] to-[#C68AFE] rounded-full"></div>
                  </div>
                  {/* Dollar sign badge */}
                  <div className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE] flex items-center justify-center shadow-md">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-theme-black-100 dark:text-white mb-3 sm:mb-4">
              {t('home.howItWorks.advertisingRevenue.title')}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-theme-black-100 dark:text-white leading-relaxed font-medium">
              {t('home.howItWorks.advertisingRevenue.description')}
            </p>
            </div>
          </div>

          {/* Panel 2: Invest in Device System */}
          <div
            ref={panel2Ref}
            className={`relative z-20  hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-purple-500/20 transition-all animate-fade-in-up-delayed ${panel2InView ? 'in-view' : ''}`}
            style={{
              background: '#100720',
              borderRadius: '1rem',
            }}
          >
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(255,94,247,1) 17.8%, rgba(2,245,255,1) 100.2%)',
                filter: 'blur(15px)',
                zIndex: 0,
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
              }}
            />
            <div className="relative z-10 p-5 sm:p-6 md:px-5 md:py-10 lg:py-12 dark:!bg-black bg-white rounded-2xl flex flex-col gap-2 items-center text-center">
            {/* Icon with Computer and Phone */}
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center relative">
                <Monitor
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 absolute"
                  style={{
                    stroke: 'url(#icon-gradient)',
                  }}
                  strokeWidth={1.5}
                  fill="none"
                />
                <Smartphone
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 absolute -right-1 sm:-right-2 -bottom-1 sm:-bottom-2"
                  style={{
                    stroke: 'url(#icon-gradient)',
                  }}
                  strokeWidth={1.5}
                  fill="none"
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-theme-black-100 dark:text-white mb-3 sm:mb-4">
              {t('home.howItWorks.investDeviceSystem.title')}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-theme-black-100 dark:text-white leading-relaxed font-medium">
              {t('home.howItWorks.investDeviceSystem.description')}
            </p>
            </div>
          </div>

          {/* Panel 3: Community Development & USDA Coin */}
          <div
            ref={panel3Ref}
            className={`relative hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-purple-500/20 transition-all animate-fade-in-up-more-delayed sm:col-span-2 md:col-span-1 ${panel3InView ? 'in-view' : ''}`}
            style={{
              background: '#100720',
              borderRadius: '1rem',
            }}
          >
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(255,94,247,1) 17.8%, rgba(2,245,255,1) 100.2%)',
                filter: 'blur(15px)',
                zIndex: 0,
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
              }}
            />
            <div className="relative z-10 p-5 sm:p-6 md:px-5 md:py-10 lg:py-12 dark:!bg-black bg-white rounded-2xl flex flex-col gap-2 items-center text-center">
            {/* Icon with Network/Community */}
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center relative">
                <div className="relative">
                  <Users
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                    style={{
                      stroke: 'url(#icon-gradient)',
                    }}
                    strokeWidth={1.5}
                    fill="none"
                  />
                  {/* Network dots */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE]"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE]"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE]"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE]"></div>
                  </div>
                  {/* Dollar sign badge */}
                  <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#FE645F] to-[#C68AFE] flex items-center justify-center shadow-md">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-theme-black-100 dark:text-white mb-3 sm:mb-4">
              {t('home.howItWorks.communityDevelopment.title')}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-theme-black-100 dark:text-white leading-relaxed font-medium">
              {t('home.howItWorks.communityDevelopment.description')}
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}