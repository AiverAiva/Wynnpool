'use client';

import './ScrollDownIndicator.css'
import { useEffect, useState } from "react"

export function ScrollDownIndicator() {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // fade out when user scrolls > 20px
            setHidden(window.scrollY > 20)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div
            className={`
        fixed left-1/2 bottom-8 -translate-x-1/2
        flex flex-col items-center justify-center
        transition-opacity duration-500
        ${hidden ? "opacity-0 pointer-events-none" : "opacity-65"}
      `}
        >
            {/* Mouse Shape */}
            <div className="w-5 h-9 rounded-full border-2 border-foreground flex items-start justify-center">
                <div className="w-[2px] h-2 rounded-full bg-foreground animate-wheel mt-1" />
            </div>
        </div>
    )
}