"use client"; // 👈 Add this at the very top

import React, { useEffect, useRef } from "react";

// Reusable BentoItem component
const BentoItem = ({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);
    };

    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={itemRef} className={`bento-item ${className}`}>
      {children}
    </div>
  );
};

// Main Component
export const CyberneticBentoGrid = () => {
  return (
    <div className="main-container">
      <div className="w-full max-w-6xl z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">
          Core Features
        </h1>
        <div className="bento-grid">
          <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Yield Tokenization</h2>
              <p className="mt-2 text-gray-400">
                Split your tokens into Principal (PT) and Yield (YT) to unlock new DeFi strategies.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Trade future yield today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Fixed-rate lending & borrowing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Yield speculation & hedging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Capital-efficient strategies</span>
                </div>
              </div>
            </div>
          </BentoItem>

          <BentoItem>
            <h2 className="text-xl font-bold text-white">Automated Risk Management</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Protect your assets with the AI-powered YT Auto-Converter, which swaps yield into principal when thresholds are hit.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">AI Monitoring</span>
                <span className="text-xs text-green-400">24/7 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Risk Threshold</span>
                <span className="text-xs text-yellow-400">Customizable</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Auto-Conversion</span>
                <span className="text-xs text-blue-400">Instant</span>
              </div>
            </div>
          </BentoItem>

          <BentoItem className="row-span-3" >
            <h2 className="text-xl font-bold text-white">Secure Price Oracle</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Get accurate, tamper-resistant token prices with built-in validation and emergency circuit breakers.
            </p>
            <div className="mt-3 space-y-3">
              <div className="bg-neutral-800 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Price Accuracy</span>
                  <span className="text-xs text-green-400">99.9%</span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-1">
                  <div className="bg-green-400 h-1 rounded-full" style={{width: '99%'}}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-300">✓ Multi-source aggregation</div>
                <div className="text-xs text-gray-300">✓ Deviation detection</div>
                <div className="text-xs text-gray-300">✓ Emergency pause mechanism</div>
                <div className="text-xs text-gray-300">✓ Decentralized validation</div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-2">
                <div className="text-xs text-gray-400">Latest Update</div>
                <div className="text-xs text-green-400">2 seconds ago</div>
              </div>
            </div>
          </BentoItem>

          <BentoItem className="row-span-2">
            <h2 className="text-xl font-bold text-white">Decentralized Trading</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Swap PT and YT seamlessly on the integrated AMM, with fair pricing and liquidity rewards.
            </p>
            <div className="mt-3 space-y-2">
              <div className="bg-neutral-800 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">Trading Pairs</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-300">ALGO/PT-ALGO</span>
                    <span className="text-xs text-green-400">+2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-300">YT-ALGO/ALGO</span>
                    <span className="text-xs text-red-400">-0.8%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-400">24h Volume</div>
                  <div className="text-sm text-white font-semibold">$2.4M</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">LP Rewards</div>
                  <div className="text-sm text-green-400 font-semibold">12.5% APY</div>
                </div>
              </div>
            </div>
          </BentoItem>

          <BentoItem className="col">
            <h2 className="text-xl font-bold text-white">Staking & Rewards</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Stake your tokens to earn steady, time-based rewards while contributing to protocol security.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Current APY</span>
                <span className="text-sm text-green-400 font-semibold">8.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Staked</span>
                <span className="text-sm text-white font-semibold">45.2M ALGO</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Reward Period</span>
                <span className="text-sm text-blue-400 font-semibold">Daily</span>
              </div>
              <div className="bg-neutral-800 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">Security Score</div>
                <div className="text-base text-green-400 font-bold">A+</div>
              </div>
            </div>
          </BentoItem>

          <BentoItem>
            <h2 className="text-xl font-bold text-white">Standardized Wrapping</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Convert various yield-bearing tokens into a unified SY token, making them interoperable across the ecosystem.
            </p>
            <div className="mt-3 space-y-2">
              <div className="text-xs text-gray-300">Supported Assets:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-800 rounded px-2 py-1">
                  <span className="text-xs text-blue-400">stALGO</span>
                </div>
                <div className="bg-neutral-800 rounded px-2 py-1">
                  <span className="text-xs text-green-400">gALGO</span>
                </div>
                <div className="bg-neutral-800 rounded px-2 py-1">
                  <span className="text-xs text-purple-400">xALGO</span>
                </div>
                <div className="bg-neutral-800 rounded px-2 py-1">
                  <span className="text-xs text-orange-400">+12 more</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400">Conversion Fee</span>
                <span className="text-xs text-green-400">0.1%</span>
              </div>
            </div>
          </BentoItem>
        </div>
      </div>
    </div>
  );
};
