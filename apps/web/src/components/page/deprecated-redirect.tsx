'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type RedirectPageProps = {
  redirectTo: string
}

export default function DeprecatedRedirect({ redirectTo }: RedirectPageProps) {
  const router = useRouter()
  const [seconds, setSeconds] = useState(5)
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    if (seconds <= 0) {
      router.push(redirectTo)
      return
    }

    const timer = setTimeout(() => {
      setSeconds((s) => s - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [seconds, redirectTo, router])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {mounted &&
          particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-primary/20"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `twinkle ${2 + p.delay}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
        <div className="space-y-8 max-w-xl">
          {/* Icon / illustration */}
          <div
            className="relative mx-auto w-48"
            style={{ animation: 'float 3s ease-in-out infinite' }}
          >
            {/* <img
              src="/illustrations/ghost/ghost-redirect.svg"
              alt="Redirecting"
            /> */}
            <div
              className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-3xl"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
              Page Deprecated
            </h1>

            <p className="text-muted-foreground text-base md:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              This page is no longer available. You are being redirected to:
            </p>

            <p className="break-all font-mono text-sm md:text-base text-primary animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {redirectTo}
            </p>

            <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
              Redirecting in <span className="font-semibold">{seconds}</span>s
            </p>
          </div>

          {/* CTA */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
            <Link href={redirectTo}>
              <Button size="lg" className="group">
                Go now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
