'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import React from 'react'
import { useLang } from '@/lang/useLang'

export default function WhitepaperPage() {
  const { t } = useLang()

  return (
    <div className="w-full min-h-svh flex sm:py-12 py-20 lg:pt-28 justify-center items-start px-2 sm:px-4 md:px-6 bg-[#FFFCF9] dark:bg-black flex-1">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-secondary mb-3 sm:mb-4">
            {t('whitepaper.title')}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#FE645F] to-[#C68AFE] mx-auto"></div>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Section 1: Giới Thiệu */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section1.title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 indent-4 sm:indent-8">
              {t('whitepaper.section1.intro')}
            </p>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-6 sm:mt-8 mb-3 sm:mb-4">
              {t('whitepaper.section1.marketProblems.title')}
            </h3>
            <ul className="list-disc list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 ml-4">
              <li className="indent-4">
                <strong>{t('whitepaper.section1.marketProblems.item1').split(' - ')[0]}</strong> - {t('whitepaper.section1.marketProblems.item1').split(' - ')[1]}
              </li>
              <li className="indent-4">
                <strong>{t('whitepaper.section1.marketProblems.item2').split(' - ')[0]}</strong> - {t('whitepaper.section1.marketProblems.item2').split(' - ')[1]}
              </li>
              <li className="indent-4">
                <strong>{t('whitepaper.section1.marketProblems.item3').split(' - ')[0]}</strong> - {t('whitepaper.section1.marketProblems.item3').split(' - ')[1]}
              </li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-6 sm:mt-8 mb-3 sm:mb-4">
              {t('whitepaper.section1.solution.title')}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 font-bold">✅</span>
                <span><strong>{t('whitepaper.section1.solution.item1').split(' - ')[0]}</strong> - {t('whitepaper.section1.solution.item1').split(' - ')[1]}</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 font-bold">✅</span>
                <span><strong>{t('whitepaper.section1.solution.item2').split(' - ')[0]}</strong> - {t('whitepaper.section1.solution.item2').split(' - ')[1]}</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 font-bold">✅</span>
                <span><strong>{t('whitepaper.section1.solution.item3').split(' - ')[0]}</strong> - {t('whitepaper.section1.solution.item3').split(' - ')[1]}</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 font-bold">✅</span>
                <span><strong>{t('whitepaper.section1.solution.item4').split(' - ')[0]}</strong> - {t('whitepaper.section1.solution.item4').split(' - ')[1]}</span>
              </li>
            </ul>
          </section>

          {/* Section 2: Mô Hình Hoạt Động */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section2.title')}
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section2.cycle.title')}
            </h3>
            <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8 rounded-xl mb-4 sm:mb-6 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="relative">
                {/* Top Flow: User Journey (Left to Right) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-6 text-xs sm:text-sm md:text-base">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-[#FE645F] to-[#C68AFE] text-white rounded-lg font-semibold shadow-md">
                    {t('whitepaper.section2.cycle.step1')}
                  </div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FE645F] dark:text-[#C68AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-semibold">
                    {t('whitepaper.section2.cycle.step2')}
                  </div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FE645F] dark:text-[#C68AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg font-semibold">
                    {t('whitepaper.section2.cycle.step3')}
                  </div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FE645F] dark:text-[#C68AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg font-semibold">
                    {t('whitepaper.section2.cycle.step4')}
                  </div>
                </div>

                {/* Vertical Connection Arrows */}
                <div className="flex justify-between items-center mb-3 sm:mb-6 px-4 sm:px-[10vw]">
                  {/* Left Arrow Up */}
                  <div className="flex flex-col items-center">
                    <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#FE645F] dark:text-[#C68AFE]" />
                  </div>
                  {/* Right Arrow Down */}
                  <div className="flex flex-col items-center">
                    <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-[#C68AFE] dark:text-[#FE645F]" />
                  </div>
                </div>

                {/* Bottom Flow: Revenue Cycle (Right to Left) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-lg font-semibold shadow-md">
                    {t('whitepaper.section2.cycle.step7')}
                  </div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#C68AFE] dark:text-[#FE645F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  <div className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg font-semibold">
                    {t('whitepaper.section2.cycle.step6')}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section2.process.title')}
            </h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#FE645F] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h4 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section2.process.step1.title')}
                </h4>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section2.process.step1.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step1.item2')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step1.item3')}</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#C68AFE] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h4 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section2.process.step2.title')}
                </h4>
                <ul className="list-disc outside list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section2.process.step2.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step2.item2')}</li>
                  <ul className="list-disc outside list-inside ml-6 sm:ml-8 mt-2 space-y-1">
                    <li className="indent-4">{t('whitepaper.section2.process.step2.package1')}</li>
                    <li className="indent-4">{t('whitepaper.section2.process.step2.package2')}</li>
                    <li className="indent-4">{t('whitepaper.section2.process.step2.package3')}</li>
                    <li className="indent-4">{t('whitepaper.section2.process.step2.package4')}</li>
                  </ul>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#FE645F] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h4 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section2.process.step3.title')}
                </h4>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section2.process.step3.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step3.item2')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step3.item3')}</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#C68AFE] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h4 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section2.process.step4.title')}
                </h4>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section2.process.step4.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section2.process.step4.item2')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Hệ Thống Staking & Nhiệm Vụ */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section3.title')}
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section3.packages.title')}
            </h3>
            <div className="overflow-x-auto mb-4 sm:mb-6">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden text-xs sm:text-sm mb-3">
                <thead>
                  <tr className="bg-gradient-to-r from-[#FE645F] to-[#C68AFE] text-white">
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section3.packages.table.package')}</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section3.packages.table.capital')}</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section3.packages.table.videosPerDay')}</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section3.packages.table.devices')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packageFree')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">10 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">5</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">20</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packageBasic')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">10-250 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">100</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">20</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packageMid1')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">251-750 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">400</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">40</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packageMid2')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">751 - 1,250 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">900</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">60</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packageMid3')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">1,251 - 2,000 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">2,000</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">100</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">{t('whitepaper.section3.packages.packagePremium')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">2,001 - 3,500 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">10,000</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">500</td>
                  </tr>
                </tbody>
              </table>
              <span className="text-sm sm:text-base text-theme-red-200 font-semibold italic">{t('whitepaper.section3.maxParticipationNote')}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section3.penalty.title')}
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-2 sm:mb-3">
                {t('whitepaper.section3.penalty.description')}
              </p>
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300">
                <strong>{t('whitepaper.section3.penalty.example').split(': ')[0]}:</strong> {t('whitepaper.section3.penalty.example').split(': ')[1]}
              </p>
            </div>
          </section>

          {/* Section 5: Chương Trình Giới Thiệu */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section5.title')}
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section5.commission.title')}
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-2 sm:mb-3">
                <strong>{t('whitepaper.section5.commission.description').split(': ')[0]}:</strong> {t('whitepaper.section5.commission.description').split(': ')[1]}
              </p>
              <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4 mb-2">
                <li className="indent-4">{t('whitepaper.section5.commission.level1')}</li>
                <li className="indent-4">{t('whitepaper.section5.commission.level2')}</li>
              </ul>
              <span className="text-sm sm:text-base text-theme-red-200 font-semibold italic">{t('whitepaper.section5.commission.totalCommissionNote')}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section5.milestones.title')}
            </h3>
            <div className="overflow-x-auto mb-4 sm:mb-6">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#FE645F] to-[#C68AFE] text-white">
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section5.milestones.table.people')}</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section5.milestones.table.regularReward')}</th>
                    <th className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('whitepaper.section5.milestones.table.vipReward')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">5</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">10 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">25 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">10</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">15 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">30 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">20</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">30 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">60 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">35</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">50 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">100 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">50</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">75 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">150 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">75</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">100 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 font-semibold px-2 sm:px-4 py-2 sm:py-3">200 USDT</td>
                  </tr>
                  <tr className="bg-theme-pink-100">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">100</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">150 USDT</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3 font-semibold">300 USDT</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 space-y-2">
              <div className="text-base sm:text-xl text-theme-red-200 font-semibold italic">{t('whitepaper.section5.milestones.totalRewardsNote')}</div>
              <p className="text-xs sm:text-sm text-theme-black-100 dark:text-gray-300 italic">
                <strong>{t('whitepaper.section5.milestones.condition').split(': ')[0]}:</strong> {t('whitepaper.section5.milestones.condition').split(': ')[1]}
              </p>
            </div>
          </section>

          {/* Section 6: Nguồn Doanh Thu & Tính Bền Vững */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section6.title')}
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section6.revenue.title')}
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-2 sm:mb-3">
                <strong>{t('whitepaper.section6.revenue.description')}</strong>
              </p>
              <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                <li className="indent-4">{t('whitepaper.section6.revenue.item1')}</li>
                <li className="indent-4">{t('whitepaper.section6.revenue.item2')}</li>
              </ul>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section6.liquidity.title')}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300">
                {t('whitepaper.section6.liquidity.description')}
              </p>
            </div>
          </section>

          {/* Section 7: Bảo Mật & Minh Bạch */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section7.title')}
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section7.security.title')}
            </h3>
            <ul className="list-disc list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 ml-4">
              <li className="indent-4"><strong>{t('whitepaper.section7.security.item1').split(': ')[0]}:</strong> {t('whitepaper.section7.security.item1').split(': ')[1]}</li>
              <li className="indent-4"><strong>{t('whitepaper.section7.security.item2').split(': ')[0]}:</strong> {t('whitepaper.section7.security.item2').split(': ')[1]}</li>
              <li className="indent-4"><strong>{t('whitepaper.section7.security.item3').split(': ')[0]}:</strong> {t('whitepaper.section7.security.item3').split(': ')[1]}</li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section7.transparency.title')}
            </h3>
            <ul className="list-disc list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 ml-4">
              <li className="indent-4">{t('whitepaper.section7.transparency.item1')}</li>
              <li className="indent-4">{t('whitepaper.section7.transparency.item2')}</li>
              <li className="indent-4">{t('whitepaper.section7.transparency.item3')}</li>
            </ul>
          </section>

          {/* Section 8: Lộ Trình Phát Triển */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section8.title')}
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#FE645F] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section8.phase1.title')}
                </h3>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section8.phase1.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section8.phase1.item2')}</li>
                  <li className="indent-4">{t('whitepaper.section8.phase1.item3')}</li>
                  <li className="indent-4">{t('whitepaper.section8.phase1.item4')}</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 border-l-4 border-[#C68AFE] pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-theme-black-100 dark:text-white mb-2 sm:mb-3">
                  {t('whitepaper.section8.phase2.title')}
                </h3>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-theme-black-100 dark:text-gray-300 ml-4">
                  <li className="indent-4">{t('whitepaper.section8.phase2.item1')}</li>
                  <li className="indent-4">{t('whitepaper.section8.phase2.item2')}</li>
                  <li className="indent-4">{t('whitepaper.section8.phase2.item3')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 9: Thông Điệp Cốt Lõi */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section9.title')}
            </h2>
            <div className="bg-gradient-to-r from-[#FE645F] to-[#C68AFE] p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 text-white">
              <p className="text-base sm:text-lg leading-relaxed italic">
                &quot;{t('whitepaper.section9.message')}&quot;
              </p>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-theme-black-100 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
              {t('whitepaper.section9.responsibility.title')}
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-theme-black-100 dark:text-gray-300">
                {t('whitepaper.section9.responsibility.description')}
              </p>
            </div>
          </section>

          {/* Section 11: Kết Luận */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-black-100 dark:text-white mb-4 sm:mb-6">
              {t('whitepaper.section11.title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 indent-4 sm:indent-8">
              {t('whitepaper.section11.paragraph1')}
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-theme-black-100 dark:text-gray-300 mb-4 sm:mb-6 indent-4 sm:indent-8 font-semibold">
              {t('whitepaper.section11.paragraph2')}
            </p>
          </section>

          {/* Footer Note */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-4 sm:pt-6 mt-8 sm:mt-12">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center italic">
              {t('whitepaper.footer.note')}
            </p>
            <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>{t('whitepaper.footer.website')} <span className="text-gray-400 dark:text-gray-500">{t('whitepaper.footer.updating')}</span></p>
              <p>{t('whitepaper.footer.email')} <span className="text-gray-400 dark:text-gray-500">{t('whitepaper.footer.updating')}</span></p>
              <p>{t('whitepaper.footer.telegram')} <span className="text-gray-400 dark:text-gray-500">{t('whitepaper.footer.updating')}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

