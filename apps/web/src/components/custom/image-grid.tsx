"use client"

import { useEffect, useState } from "react"
import NextImage from "next/image" // Renamed to avoid conflict
import { Maximize2 } from "lucide-react"
import ImageModal from "./image-modal"
import imagePaths from '@/data/imageList.json';

// Define image size categories
type ImageSize = "1x1" | "1x2" | "2x1" | "3x1"

interface ImageItem {
  src: string
  alt: string
  size: ImageSize
  aspectRatio: number
  id: string
  width?: number
  height?: number
}

export default function ImageGrid() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [grid, setGrid] = useState<(ImageItem | null)[][]>([])
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load and analyze images
  useEffect(() => {
    const loadImages = async () => {
      setLoading(true)

      try {
        const imagePromises = imagePaths.map((path) => {
          return new Promise<ImageItem>((resolve) => {
            // Use the global window.Image constructor explicitly
            const imgElement = new window.Image()
            imgElement.src = path
            imgElement.crossOrigin = "anonymous"

            imgElement.onload = () => {
              // Make sure we have valid dimensions before calculating aspect ratio
              const width = imgElement.width || 1
              const height = imgElement.height || 1
              const aspectRatio = width / height
              let size: ImageSize

              // Determine size category based on aspect ratio
              if (aspectRatio >= 2.4) {
                size = "3x1" // Very wide images (aspect ratio ~2)
              } else if (aspectRatio >= 1.3) {
                size = "2x1" // Wide images (aspect ratio ~1.5)
              } else if (aspectRatio <= 0.6) {
                size = "1x2" // Tall images (aspect ratio ~0.7)
              } else {
                size = "1x1" // Normal/square-ish images (default case)
              }

              resolve({
                src: path,
                alt: `Image ${path.split("/").pop()}`,
                size,
                aspectRatio,
                id: Math.random().toString(36).substring(2, 9),
                width,
                height,
              })
            }

            imgElement.onerror = () => {
              // If image fails to load, resolve with default values
              console.error(`Failed to load image: ${path}`)
              resolve({
                src: "/placeholder.svg",
                alt: `Image ${path.split("/").pop()} (failed to load)`,
                size: "1x1",
                aspectRatio: 1,
                id: Math.random().toString(36).substring(2, 9),
                width: 100,
                height: 100,
              })
            }
          })
        })

        const loadedImages = await Promise.all(imagePromises)
        setImages(loadedImages)
      } catch (error) {
        console.error("Error loading images:", error)
        // Set empty array to avoid undefined
        setImages([])
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  // Generate the grid layout
  useEffect(() => {
    if (loading || images.length === 0) return

    // Sort images by size to place larger ones first
    const sortedImages = [...images].sort((a, b) => {
      const sizeOrder: Record<ImageSize, number> = {
        "3x1": 0,
        "2x1": 1,
        "1x2": 2,
        "1x1": 3,
      }
      return sizeOrder[a.size] - sizeOrder[b.size]
    })

    // Initialize empty grid (10 rows x 3 columns)
    const newGrid: (ImageItem | null)[][] = Array(20)
      .fill(null)
      .map(() => Array(3).fill(null))

    // Place images in the grid
    sortedImages.forEach((image) => {
      placeImageInGrid(newGrid, image)
    })

    setGrid(newGrid)
  }, [images, loading])

  // Function to place an image in the grid
  const placeImageInGrid = (grid: (ImageItem | null)[][], image: ImageItem) => {
    const rows = grid.length
    const cols = 3 // Fixed at 3 columns

    // Determine width and height based on image size
    let width = 1
    let height = 1

    if (image.size === "2x1") width = 2
    if (image.size === "3x1") width = 3
    if (image.size === "1x2") height = 2

    for (let row = 0; row <= rows - height; row++) {
      for (let col = 0; col <= cols - width; col++) {
        let canPlace = true

        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (col + c >= cols || row + r >= rows || grid[row + r][col + c] !== null) {
              canPlace = false
              break
            }
          }
          if (!canPlace) break
        }

        if (canPlace) {
          for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
              grid[row + r][col + c] = image
            }
          }
          return
        }
      }
    }
  }

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  // Render the grid
  const renderGrid = () => {
    if (!grid || grid.length === 0) return null

    // Track which cells have been rendered
    const renderedCells = new Set<string>()

    return (
      <div className="grid grid-cols-3 gap-2">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Skip empty cells
            if (!cell) return null

            const cellKey = `${rowIndex}-${colIndex}`
            if (renderedCells.has(cellKey)) return null

            // Make sure cell has all required properties
            if (!cell.size || !cell.id || !cell.src) {
              console.error("Invalid cell data:", cell)
              return null
            }

            // Mark all cells this image occupies as rendered
            let width = 1
            let height = 1

            if (cell.size === "2x1") width = 2
            if (cell.size === "3x1") width = 3
            if (cell.size === "1x2") height = 2

            for (let r = 0; r < height; r++) {
              for (let c = 0; c < width; c++) {
                renderedCells.add(`${rowIndex + r}-${colIndex + c}`)
              }
            }

            // Calculate the appropriate span classes
            const colSpanClass = width === 3 ? "col-span-3" : width === 2 ? "col-span-2" : "col-span-1"
            const rowSpanClass = height === 1 ? "row-span-1" : height === 2 ? "row-span-2" : "row-span-3"

            return (
              <div
                key={cell.id}
                className={`${colSpanClass} ${rowSpanClass} relative overflow-hidden rounded-lg group cursor-pointer`}
                style={{
                  minHeight: height === 1 ? "300px" : height === 2 ? "610px" : "920px",
                }}
                onClick={() => handleImageClick(cell)}
              >
                <NextImage
                  src={cell.src || "/placeholder.svg"}
                  alt={cell.alt || "Image"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={`(max-width: 768px) 100vw, ${width === 3 ? "100vw" : width === 2 ? "66vw" : "33vw"}`}
                />
                {/* Overlay with maximize icon on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Maximize2 className="text-white w-10 h-10" />
                  </div>
                </div>
              </div>
            )
          }),
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="text-white text-center py-20">Loading images...</div>
  }

  return (
    <div className="image-grid-container">
      {renderGrid()}
      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} image={selectedImage} />
    </div>
  )
}
