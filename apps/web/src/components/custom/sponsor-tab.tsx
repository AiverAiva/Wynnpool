"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function SponsoredWhale() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "fixed bottom-0 left-4 md:left-8 z-50 transition-all duration-500 ease-out",
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg shadow-lg",
        "cursor-pointer select-none overflow-hidden",
        isHovered ? "w-80 h-30 md:w-96 md:h-32" : "w-40 h-10 md:w-48 md:h-12",
        //h44 h48
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-2 md:p-3 h-full">
        {!isHovered ? (
          // Collapsed state
          <div className="flex items-center justify-center h-full">
            <span className="text-xs md:text-sm font-medium whitespace-nowrap">
              Sponsored by <span className="font-bold">Whale</span>
            </span>
          </div>
        ) : (
          // Expanded state
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2">
              <Image
                src="/sponsors/whale.png"
                alt="Whale"
                width={28}
                height={28}
                className="rounded-full md:w-8 md:h-8"
                loading="lazy"
              />
              <div>
                <h3 className="font-bold text-base md:text-lg">Whale</h3>
                {/* <p className="text-blue-100 text-xs">Keeping this site alive</p> */}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-2 text-xs md:text-sm py-2">
              <p className="text-blue-50 leading-relaxed">
                This website is currently sponsored by <span className="font-bold">Whale</span> to help keep it running
                and accessible for everyone.
              </p>

              {/* <div className="flex flex-wrap gap-1 md:gap-2">
                <span className="bg-blue-500/30 px-2 py-1 rounded text-xs"></span>
                <span className="bg-blue-500/30 px-2 py-1 rounded text-xs"></span>
                <span className="bg-blue-500/30 px-2 py-1 rounded text-xs"></span>
              </div> */}
            </div>

            {/* <div className="pt-2 md:pt-3 pb-1 border-t border-blue-400/30">
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white text-xs underline transition-colors duration-200"
              >
                Learn more about <span className="font-bold">Whale</span> →
              </a>
            </div> */}
          </div>
        )}
      </div>
    </div>
  )
}
