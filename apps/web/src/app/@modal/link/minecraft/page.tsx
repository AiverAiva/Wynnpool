"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Server, Key, Link2, AlertCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CopyText } from "@/components/custom/CopyText"
import { useRouter } from "next/navigation"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

interface AccountLinkingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (code: string) => void
}

export default function AccountLinkingModal({ isOpen, onClose, onComplete }: AccountLinkingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [value, setValue] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter();

  const serverAddress = "verify.wynnpool.com"
  const totalSteps = 2

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otpCode]
    newOtp[index] = value.toUpperCase()
    setOtpCode(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").toUpperCase().slice(0, 6)
    const newOtp = [...otpCode]

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i]
    }

    setOtpCode(newOtp)
    setError("")

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((code) => !code)
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    otpRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async () => {
    // prefer value if typed via InputOTP component, otherwise fallback to otpCode
    const code = (value || otpCode.join("")).toString()
    if (code.length !== 6 || /\D/.test(code)) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      // Send POST to /api/link/minecraft with JSON payload { code }
      const res = await fetch('/api/link/minecraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Verification failed. Please try again.')
        return
      }

      const data = await res.json().catch(() => ({}))
      // on success, call onComplete and close modal
      onComplete(code)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setOtpCode(["", "", "", "", "", ""])
    setError("")
  }

  const handleClose = () => {
    router.back()
    resetModal()
    onClose()
  }

  return (
    <Dialog open onOpenChange={() => router.back()}>
      {/* open={isOpen} onOpenChange={handleClose} */}
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Link2 className="h-5 w-5 text-primary" />
            Link Your Minecraft Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      i + 1 <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={cn(
                        "w-12 h-0.5 mx-2 transition-colors",
                        i + 1 < currentStep ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Server className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Join the Verification Server</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect to our Minecraft server to receive your verification code
                  </p>
                </div>

                <Card className="bg-muted/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Server Address:</span>
                        <CopyText text={serverAddress} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-500">Instructions:</p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Copy the server address above</li>
                        <li>Open Minecraft and add this server</li>
                        <li>Join the server with your Minecraft username</li>
                        <li>You'll receive a 6-digit verification code</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Server Preview Image */}
                {/* <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-md flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Server className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">Server Preview</p>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Key className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Enter Verification Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code you received in the Minecraft server
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {/* Use a fieldset to disable all inputs while verifying */}
                    <fieldset disabled={isVerifying} className="border-0 p-0 m-0">
                      <InputOTP
                        maxLength={6}
                        value={value}
                        onChange={(val) => {
                          // accept only digits and trim to maxLength
                          const sanitized = val.replace(/\D/g, '').slice(0, 6)
                          setValue(sanitized)

                          // also keep otpCode array in sync for existing handlers
                          const next = ['', '', '', '', '', '']
                          for (let i = 0; i < sanitized.length; i++) next[i] = sanitized[i]
                          setOtpCode(next)
                          setError('')
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </fieldset>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive justify-center">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="text-center">
                    <Button
                      onClick={handleVerify}
                      disabled={otpCode.join("").length !== 6 || isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Verify & Link Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-500">Didn't receive a code?</p>
                      <p className="text-xs text-muted-foreground">
                        Make sure you joined the server with your exact Minecraft username. You can go back to step 1 to
                        try again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-border/50">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-transparent">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              {currentStep < totalSteps && (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
