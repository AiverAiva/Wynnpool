"use client"

import { useRef, useEffect, useCallback } from "react"
import gsap from "gsap"

export interface Region {
  id: string
  label: string
  shortLabel?: string
  disabled?: boolean
}

interface RegionTabsProps {
  regions: Region[]
  activeRegion: string
  onRegionChange: (id: string) => void
}

export function RegionTabs({
  regions,
  activeRegion,
  onRegionChange,
}: RegionTabsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollTarget = useRef(0)
  const chaseTween = useRef<gsap.core.Tween | null>(null)
  const snapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get scrollLeft value that centers an item
  const getItemCenterOffset = useCallback((item: HTMLElement) => {
    const track = trackRef.current
    if (!track) return 0
    const trackRect = track.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const trackCenter = trackRect.width / 2
    const itemCenter =
      itemRect.left + itemRect.width / 2 - trackRect.left + track.scrollLeft
    return itemCenter - trackCenter
  }, [])

  // Update visual properties based on distance from center
  const updateVisuals = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const trackRect = track.getBoundingClientRect()
    const centerX = trackRect.left + trackRect.width / 2
    const items = track.querySelectorAll<HTMLElement>("[data-region-id]")

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect()
      const itemCenter = itemRect.left + itemRect.width / 2
      const distance = Math.abs(itemCenter - centerX)
      const maxDist = trackRect.width / 2
      const normalized = distance / maxDist

      // Opacity: quadratic falloff
      const opacity = Math.max(0.08, 1 - Math.pow(normalized, 1.5) * 0.92)
      item.style.opacity = String(opacity)

      // Font size: 22px at center → 14px at edge
      const fontSize = Math.max(14, 22 - normalized * 8)
      item.style.fontSize = `${fontSize}px`

      // Font weight: 700 at center → 500 at edge
      item.style.fontWeight = normalized < 0.15 ? "700" : "500"
    })
  }, [])

  // Continuously chase scrollTarget with GSAP
  const startChase = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    if (chaseTween.current) chaseTween.current.kill()

    chaseTween.current = gsap.to(track, {
      scrollLeft: scrollTarget.current,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: updateVisuals,
      overwrite: true,
    })
  }, [updateVisuals])

  // Snap to nearest item
  const snapToNearest = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const trackRect = track.getBoundingClientRect()
    const centerX = trackRect.left + trackRect.width / 2
    const items = track.querySelectorAll<HTMLElement>("[data-region-id]")
    let closestEl: HTMLElement | null = null
    let closestDist = Infinity

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.dataset.disabled === "true") continue
      const itemRect = item.getBoundingClientRect()
      const itemCenter = itemRect.left + itemRect.width / 2
      const dist = Math.abs(itemCenter - centerX)
      if (dist < closestDist) {
        closestDist = dist
        closestEl = item
      }
    }

    if (closestEl === null) return

    const target = getItemCenterOffset(closestEl)
    const maxScroll = track.scrollWidth - track.clientWidth
    scrollTarget.current = Math.max(0, Math.min(target, maxScroll))

    if (chaseTween.current) chaseTween.current.kill()

    const regionId = closestEl.dataset.regionId!
    gsap.to(track, {
      scrollLeft: scrollTarget.current,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: updateVisuals,
      onComplete: () => {
        onRegionChange(regionId)
      },
    })
  }, [getItemCenterOffset, updateVisuals, onRegionChange])

  // Wheel handler
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (snapTimeout.current) clearTimeout(snapTimeout.current)

      // Sync target with actual position to avoid drift
      scrollTarget.current = track.scrollLeft

      const maxScroll = track.scrollWidth - track.clientWidth
      scrollTarget.current = Math.max(
        0,
        Math.min(scrollTarget.current + e.deltaY * 1.2, maxScroll),
      )

      startChase()

      snapTimeout.current = setTimeout(snapToNearest, 150)
    }

    track.addEventListener("wheel", handleWheel, { passive: false })
    return () => track.removeEventListener("wheel", handleWheel)
  }, [startChase, snapToNearest])

  // Touch/drag snap on end
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const handleTouchStart = () => {
      if (chaseTween.current) chaseTween.current.kill()
      if (snapTimeout.current) clearTimeout(snapTimeout.current)
    }

    const handleTouchEnd = () => {
      snapTimeout.current = setTimeout(snapToNearest, 80)
    }

    track.addEventListener("touchstart", handleTouchStart, { passive: true })
    track.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      track.removeEventListener("touchstart", handleTouchStart)
      track.removeEventListener("touchend", handleTouchEnd)
    }
  }, [snapToNearest])

  // Click to select
  const handleClick = useCallback(
    (item: HTMLElement) => {
      const track = trackRef.current
      if (!track) return

      onRegionChange(item.dataset.regionId!)

      const target = getItemCenterOffset(item)
      const maxScroll = track.scrollWidth - track.clientWidth
      scrollTarget.current = Math.max(0, Math.min(target, maxScroll))

      if (chaseTween.current) chaseTween.current.kill()

      gsap.to(track, {
        scrollLeft: scrollTarget.current,
        duration: 0.8,
        ease: "power3.out",
        onUpdate: updateVisuals,
      })
    },
    [getItemCenterOffset, updateVisuals, onRegionChange],
  )

  // Center active item on mount and when activeRegion changes
  useEffect(() => {
    const track = trackRef.current
    if (!track || !activeRegion) return

    // Use setTimeout to ensure DOM has rendered the items
    const timer = setTimeout(() => {
      const activeItem = track.querySelector<HTMLElement>(
        `[data-region-id="${activeRegion}"]`,
      )
      if (activeItem) {
        const offset = getItemCenterOffset(activeItem)
        track.scrollLeft = offset
        scrollTarget.current = offset
        updateVisuals()
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [activeRegion, regions, getItemCenterOffset, updateVisuals])

  return (
    <div className="relative w-full max-w-[700px] mx-auto h-14 overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[180px] z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[180px] z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide items-center h-full"
        style={{ padding: "0 calc(50% - 40px)" }}
      >
        {regions.map((region) => (
          <button
            key={region.id}
            data-region-id={region.id}
            data-disabled={region.disabled ? "true" : undefined}
            disabled={region.disabled}
            onClick={(e) => handleClick(e.currentTarget)}
            className="flex-none whitespace-nowrap cursor-pointer select-none text-muted-foreground px-1 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.01em",
              opacity: 0.12,
              transition: "none",
            }}
          >
            <span className="sm:hidden">{region.shortLabel || region.label}</span>
            <span className="hidden sm:inline">{region.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
