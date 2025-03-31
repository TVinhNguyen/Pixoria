"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import useFetchImages from "../hooks/use-FetchImages"
import Image from "next/image"
import Masonry from "react-masonry-css"
import { Download, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
  imagesPerPage: number
  searchResults?: ImageData[]
}

export default function ImageGrid({ imagesPerPage, searchResults }: ImageGridProps) {
  // Trang hiện tại (dùng cho fetch API phân trang)
  const [currentPage, setCurrentPage] = useState(1)
  // Mảng ảnh thực tế đang hiển thị
  const [displayedImages, setDisplayedImages] = useState<ImageData[]>([])
  // Kiểm soát còn dữ liệu để load tiếp không
  const [hasMore, setHasMore] = useState(true)
  // Quan sát phần tử cuối cùng để kích hoạt load thêm
  const observer = useRef<IntersectionObserver | null>(null)

  // Đánh dấu đang dùng kết quả tìm kiếm (nếu có)
  const [isUsingSearchResults, setIsUsingSearchResults] = useState(false)

  // Hook fetch ảnh (chỉ fetch khi không có searchResults)
  const { images: fetchedImages, totalPages, isLoading } = useFetchImages(
    !searchResults || searchResults.length === 0 ? currentPage : 1,
    imagesPerPage
  )

  // Xử lý khi searchResults thay đổi
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      // Nếu có kết quả tìm kiếm, hiển thị luôn chúng
      setDisplayedImages(searchResults)
      setIsUsingSearchResults(true)
      setHasMore(false) // Không dùng infinite scroll khi tìm kiếm
    } else {
      // Nếu không có searchResults, chuyển về fetch API
      setIsUsingSearchResults(false)
    }
  }, [searchResults])

  // Xử lý khi fetchedImages thay đổi (chỉ áp dụng khi không dùng searchResults)
  useEffect(() => {
    if (!isUsingSearchResults && !isLoading && fetchedImages.length > 0) {
      // Thêm ảnh mới vào cuối mảng (infinite scroll)
      setDisplayedImages((prev) => {
        const existingIds = new Set(prev.map((img) => img.id))
        const newImages = fetchedImages.filter((img) => !existingIds.has(img.id))
        return [...prev, ...newImages]
      })
      // Kiểm tra còn trang tiếp không
      setHasMore(currentPage < totalPages)
    }
  }, [fetchedImages, currentPage, totalPages, isLoading, isUsingSearchResults])

  // IntersectionObserver callback để load thêm khi cuộn tới cuối
  const lastImageElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isUsingSearchResults) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [isLoading, hasMore, isUsingSearchResults]
  )

  // Mỗi khi reset từ searchResults về “bình thường”, xoá displayedImages
  useEffect(() => {
    if (!isUsingSearchResults) {
      setDisplayedImages([])
      setCurrentPage(1)
    }
  }, [isUsingSearchResults])

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Loading skeleton trong lần fetch đầu tiên */}
        {isLoading && !isUsingSearchResults && displayedImages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: imagesPerPage }).map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="w-full h-[300px] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Image grid */}
        {displayedImages.length > 0 && (
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
              const isLastElement = index === displayedImages.length - 1
              return (
                <div
                  key={`${image.id}-${index}`}
                  className="mb-4 group relative overflow-hidden"
                  // Gán ref để infinite scroll nếu là item cuối
                  ref={!isUsingSearchResults && isLastElement ? lastImageElementRef : undefined}
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
                        console.error("Image loading failed:", image.src)
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg"
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
                  {image.title && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium">{image.title}</h3>
                      {image.description && (
                        <p className="text-xs text-gray-500">{image.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </Masonry>
        )}

        {/* Không có ảnh */}
        {!isLoading && displayedImages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Không tìm thấy hình ảnh nào.</p>
          </div>
        )}

        {/* Loading spinner cho infinite scroll (khi đang load thêm) */}
        {isLoading && !isUsingSearchResults && displayedImages.length > 0 && (
          <div className="flex justify-center my-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </section>
  )
}
