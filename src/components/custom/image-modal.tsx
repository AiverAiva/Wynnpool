"use client"

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Download, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface ImageItem {
  src: string
  alt: string
  size: string
  aspectRatio: number
  id: string
  width?: number
  height?: number
}

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  image: ImageItem | null
}

export default function ImageModal({ isOpen, onClose, image }: ImageModalProps) {
  const [imgSrc, setImgSrc] = useState<string>("")

  useEffect(() => {
    // Set the image source when the modal opens or image changes
    if (image && image.src) {
      setImgSrc(image.src)
    }
  }, [image, isOpen])

  if (!image) return null

  // Extract filename from path
  const filename = image.src.split("/").pop() || "image"

  // Format size description
//   const getSizeDescription = (size: string) => {
//     switch (size) {
//       case "1x1":
//         return "Standard (1×1)"
//       case "1x2":
//         return "Tall (1×2)"
//       case "2x1":
//         return "Wide (2×1)"
//       case "3x1":
//         return "Very Wide (3×1)"
//       default:
//         return size
//     }
//   }

  const handleDownload = () => {
    // Create a link element
    const link = document.createElement("a")
    link.href = image.src
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: filename,
          text: "Check out this image",
          url: image.src,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.origin + image.src)
      alert("Image URL copied to clipboard!")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black border-none flex flex-col">
        {/* Close button - absolute positioned */}
        <DialogClose className="absolute top-4 right-4 z-50 rounded-full p-1.5 bg-black/50 text-white hover:bg-black/70">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Image container - takes up most of the space */}
        <div className="relative flex-1 w-full h-[calc(95vh-120px)] flex items-center justify-center">
          {/* Use a regular img tag instead of Next.js Image for better modal compatibility */}
          <img src={imgSrc || "/placeholder.svg"} alt={image.alt} className="max-w-full max-h-full object-contain" />
        </div>

        {/* Footer with details and buttons */}
        <div className="bg-black/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-white text-lg font-medium truncate">{filename}</h3>
            <div className="text-gray-400 text-sm">
              {image.width} × {image.height} px    
              {/* • {getSizeDescription(image.size)} • Aspect Ratio:{" "} */}
              {/* {image.aspectRatio.toFixed(2)} */}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 hover:text-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 hover:text-white"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
