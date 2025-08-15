"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function SponsoredWhale() {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleClick = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div
            className={cn(
                "fixed bottom-0 left-4 md:left-8 z-50 transition-all duration-500 ease-out",
                "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg shadow-lg",
                "cursor-pointer select-none overflow-hidden",
                isExpanded ? "w-80 md:w-96 h-52 md:h-36" : "w-36 md:w-48 h-10 md:h-12",
                //h-56 md
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            onClick={handleClick}
        >
            <div className={cn("transition-all duration-500 ease-out h-full", isExpanded ? "p-4" : "p-2 md:p-3")}>
                {!isExpanded ? (
                    // Collapsed state
                    <div className="flex items-center justify-center h-full">
                        <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                            Sponsored by <span className="font-bold">Whale</span>
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between h-full">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/sponsors/whale.png"
                                    alt="Whale"
                                    width={28}
                                    height={28}
                                    className="rounded-full md:w-8 md:h-8"
                                />
                                <div>
                                    <h3 className="font-bold text-base md:text-lg">Whale</h3>
                                    <p className="text-blue-100 text-xs">Keeping this site alive</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p className="text-blue-50 leading-relaxed">
                                    This website is currently sponsored by <span className="font-bold">Whale</span> to help keep it
                                    running and accessible for everyone.
                                </p>

                                {/* <div className="flex flex-wrap gap-1.5">
                  <span className="bg-blue-500/30 px-2 py-1 rounded text-xs">Web Hosting</span>
                  <span className="bg-blue-500/30 px-2 py-1 rounded text-xs">Free Access</span>
                  <span className="bg-blue-500/30 px-2 py-1 rounded text-xs">Community</span>
                </div> */}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-blue-400/30 md:hidden">
                            {/* <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white text-xs underline transition-colors duration-200 block"
              >
                Learn more about <span className="font-bold">Whale</span> →
              </a> */}
                            <p className="text-blue-300 text-xs opacity-75 md:hidden mt-1">Tap to close</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
