'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Generate random particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {mounted && particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `twinkle ${2 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center space-y-8 text-center">
          {/* Ghost SVG with floating animation */}
          <div
            className="relative"
            style={{
              animation: 'float 3s ease-in-out infinite'
            }}
          >
             <img src={`/illustrations/ghost/ghost-not-found.svg`} alt="NOT FOUND" /> 

            {/* Glow effect */}
            <div
              className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full"
              style={{
                animation: 'pulse-glow 2s ease-in-out infinite'
              }}
            />
          </div>

          {/* 404 Text with gradient */}
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-in fade-in slide-in-from-bottom-4 duration-700">
              404
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              {'Boo! Page Not Found'}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {'Looks like this page got spooked away. The ghost couldn\'t find what you\'re looking for!'}
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Link href="/">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                {'Back to Home'}
              </Button>
            </Link>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary/10 blur-xl"
            style={{
              animation: 'floatSlow 6s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-20 h-20 md:w-32 md:h-32 rounded-full bg-accent/10 blur-xl"
            style={{
              animation: 'floatSlow 8s ease-in-out infinite',
              animationDelay: '1s'
            }}
          />
        </div>
      </div>
    </div>
  )
}
