"use client";

import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";

type MotionContextType = {
    isReducedMotion: boolean;
    setReducedMotion: (v: boolean) => void;
};

const MotionContext = createContext<MotionContextType>({
    isReducedMotion: false,
    setReducedMotion: () => { },
});

export function MotionSettingsProvider({ children }: PropsWithChildren) {
    const [isReducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        // 1. detect OS-level reduced motion preference
        const prefersReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // 2. read manual override
        const saved = localStorage.getItem("reducedMotion");

        if (saved === "true") {
            setReducedMotion(true);
        } else if (prefersReduced) {
            setReducedMotion(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("reducedMotion", isReducedMotion ? "true" : "false");
    }, [isReducedMotion]);

    return (
        <MotionContext.Provider
            value={{
                isReducedMotion,
                setReducedMotion,
            }}
        >
            {children}
        </MotionContext.Provider>
    );
}

export function useMotionSettings() {
    return useContext(MotionContext);
}
