"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import useFetchImages from "../hooks/use-FetchImages";
import Image from "next/image"
import Masonry from "react-masonry-css"
import { Download, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ImageData {
  id: number
  src: string
  alt: string
  width: number
  height: number
  title?: string
  description?: string
  created_at?: string
  likes?: number
  downloads?: number
}

interface ImageGridProps {
  paginationType: "traditional" | "infinite"
  imagesPerPage: number
}

export default function ImageGrid({ paginationType, imagesPerPage }: ImageGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [displayedImages, setDisplayedImages] = useState<ImageData[]>([])
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  
  // Use the custom hook to fetch images
  const { images, totalPages, isLoading } = useFetchImages(currentPage, imagesPerPage)

  // Log để debug
  useEffect(() => {
    console.log("Images from hook:", images);
    console.log("Current displayed images:", displayedImages);
  }, [images, displayedImages]);

  // Reference for the last image element for infinite scroll
  const lastImageElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && paginationType === "infinite") {
          setCurrentPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [isLoading, hasMore, paginationType],
  )

  // Update displayed images when images from hook change
  useEffect(() => {
    if (!isLoading && images && images.length > 0) {
      if (paginationType === "infinite") {
        // For infinite scroll, append new images
        setDisplayedImages((prev) => {
          // Tránh trùng lặp dựa trên ID
          const existingIds = new Set(prev.map(img => img.id));
          const newImages = images.filter(img => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      } else {
        // For traditional pagination, replace images
        setDisplayedImages(images);
      }
      
      // Check if we've reached the end
      setHasMore(currentPage < totalPages)
    }
  }, [images, currentPage, totalPages, paginationType, isLoading])

  // Reset images and page when pagination type changes
  useEffect(() => {
    setDisplayedImages([])
    setCurrentPage(1)
  }, [paginationType])

  const handlePageChange = (page: number) => {
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
    setCurrentPage(page)
  }

  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range to show
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add the page range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Debug info */}
       

        {/* Loading skeleton for traditional pagination or initial load */}
        {isLoading && paginationType === "traditional" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: imagesPerPage }).map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="w-full h-[300px] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Image grid */}
        {(displayedImages.length > 0 || !isLoading) && (
          <Masonry
            breakpointCols={{
              default: 4,
              1100: 3,
              700: 2,
              500: 1,
            }}
            className="flex w-auto"
            columnClassName="bg-clip-padding px-2"
          >
            {displayedImages.map((image, index) => {
              // For the last item in infinite scroll, add a ref
              const isLastElement = index === displayedImages.length - 1;
              
              return (
                <div
                  key={`${image.id}-${index}`}
                  className="mb-4 group relative overflow-hidden"
                  ref={isLastElement ? lastImageElementRef : undefined}
                >
                  <div className="aspect-auto rounded-lg overflow-hidden">
                    <Image
                      src={image.src}
                      width={500}
                      height={500}
                      alt={image.alt || image.title || "Image"}
                      className="rounded-lg shadow-md transition-shadow duration-300 w-full h-auto object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Image loading failed:", image.src);
                        // Fallback to placeholder on error
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="flex space-x-2">
                      <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                        <Download className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Optional: Show image details */}
                  {image.title && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium">{image.title}</h3>
                      {image.description && <p className="text-xs text-gray-500">{image.description}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </Masonry>
        )}

        {/* No images found */}
        {!isLoading && displayedImages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Không tìm thấy hình ảnh nào.</p>
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {isLoading && paginationType === "infinite" && (
          <div className="flex justify-center my-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Pagination Controls - Only show for traditional pagination */}
        {paginationType === "traditional" && totalPages > 1 && (
          <div className="mt-12">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) handlePageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="px-4 py-2">...</span>
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page as number)
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) handlePageChange(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </section>
  )
}