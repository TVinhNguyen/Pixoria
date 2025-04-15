"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import useFetchImages, { type ImageData } from "../hooks/use-FetchImages"
import { handleLike, handleDownload } from "@/lib/api-action/image-actions"
import Image from "next/image"
import Link from "next/link"
import Masonry from "react-masonry-css"
import { Download, Heart, Share2, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CollectionModal from "./modal/collection-modal"
import ToastNotification from "./modal/message-modal"
import { set } from "date-fns"

interface ImageGridProps {
  imagesPerPage: number
  searchResults?: ImageData[]
}

export default function ImageGrid({ imagesPerPage, searchResults }: ImageGridProps) {
  // State không thay đổi
  const [currentPage, setCurrentPage] = useState(1)
  const [displayedImages, setDisplayedImages] = useState<ImageData[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isUsingSearchResults, setIsUsingSearchResults] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  // State cho modal bộ sưu tập
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  // chỗ này được dùng để set mấy cái toast
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info" | "warning">("success")
  const [toastMessage, setToastMessage] = useState({title: "", description: "", duration: 0})

  const setNotification = (variant: "success" | "error" | "info" | "warning", title: string, description: string, duration: number) => {
    setToastVariant(variant)
    setToastMessage({ title, description, duration })
    setToastOpen(true)
  }

  // Hook fetch ảnh
  const {
    images: fetchedImages,
    totalPages,
    isLoading,
  } = useFetchImages(!searchResults || searchResults.length === 0 ? currentPage : 1, imagesPerPage)

  // useEffect cho kết quả tìm kiếm
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setDisplayedImages(searchResults)
      setIsUsingSearchResults(true)
      setHasMore(false)
    } else {
      setIsUsingSearchResults(false)
    }
  }, [searchResults])

  // useEffect cho việc fetch ảnh thông thường
  useEffect(() => {
    if (!isUsingSearchResults && !isLoading && fetchedImages.length > 0) {
      setDisplayedImages((prev) => {
        const existingIds = new Set(prev.map((img) => img.id))
        const newImages = fetchedImages.filter((img) => !existingIds.has(img.id))
        return [...prev, ...newImages]
      })
      setHasMore(currentPage < totalPages)
    }
  }, [fetchedImages, currentPage, totalPages, isLoading, isUsingSearchResults])

  // Observer cho infinite scrolling
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
    [isLoading, hasMore, isUsingSearchResults],
  )

  // Reset khi chuyển chế độ
  useEffect(() => {
    if (!isUsingSearchResults) {
      setDisplayedImages([])
      setCurrentPage(1)
    }
  }, [isUsingSearchResults])

  // Xử lý like và download
  const handleImageLike = async (imageId: number) => {
    try {
      const response = await handleLike(imageId)

      // Cập nhật state local nếu like thành công
      if (response && (response.status === "success" || response.likes)) {
        setDisplayedImages((prevImages) =>
          prevImages.map((img) => (img.id === imageId ? { ...img, likes: response.likes, is_liked: true } : img)),
        )
      } else if (response && response.status === "already_liked") {
        toast.info("Bạn đã thích ảnh này rồi!")
      }
    } catch (error) {
      console.error("Lỗi khi thích ảnh:", error)
    }
  }

  const handleImageDownload = async (imageId: number, imageSrc: string) => {
    try {
      const apiResponse = await handleDownload(imageId)
      const header = new Headers({ "Access-Control-Allow-Origin": "*" })
      const response = await fetch(imageSrc, {headers: header})
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `image-${imageId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      if (apiResponse && (apiResponse.status === "success" || apiResponse.downloads)) {
        setDisplayedImages((prevImages) =>
          prevImages.map((img) => (img.id === imageId ? { ...img, downloads: apiResponse.downloads } : img)),
        )
      }
      setNotification("success", "Success", "Image is downloaded successfully!", 3000)
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error)
      setNotification("error", "Error", "Failed to download the image. Please try again!", 3000)
    }
  }

  // Xử lý thêm vào bộ sưu tập
  const handleAddToCollection = (image: ImageData) => {
    setSelectedImage(image)
    setCollectionModalOpen(true)
  }

  const handleShare = (imageSrc: string) => {
    navigator.clipboard.writeText(window.location.origin + imageSrc)
    setNotification("success", "Success", "Image's link is saved to clipboard!", 3000)
  }

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

              // Lấy đường dẫn ảnh, ưu tiên file (API mới) rồi đến src (tương thích cũ)
              const imageSrc = image.file || image.src || ""

              // Đảm bảo luôn có dữ liệu tác giả, nếu không có thì dùng dữ liệu mặc định
              const author = image.author || {
                user_id: 0,
                username: image.username || "photographer",
                name: "Photographer",
                avatar: null,
              }

              // Tạo chữ cái đầu cho avatar fallback
              const avatarInitial = author.name ? author.name.charAt(0).toUpperCase() : "P"

              return (
                <div
                  key={`${image.id}-${index}`}
                  className="mb-4 group relative overflow-hidden"
                  ref={!isUsingSearchResults && isLastElement ? lastImageElementRef : undefined}
                >
                  <div className="aspect-auto rounded-lg overflow-hidden">
                    <Image
                      src={imageSrc || "/placeholder.svg"}
                      width={500}
                      height={500}
                      alt={image.alt || image.title || "Image"}
                      className="rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 w-full h-auto object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Image loading failed:", imageSrc)
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  </div>

                  {/* Overlay với gradient và hiệu ứng mượt mà */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex flex-col justify-between p-4">
                    {/* Phần trên - các nút tương tác */}
                    <div className="self-end flex space-x-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-black/20 backdrop-blur-sm"
                        onClick={() => handleImageDownload(image.id, imageSrc)}
                      >
                        <Download className="h-5 w-5" />
                        {image.downloads > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                            {image.downloads > 99 ? "99+" : image.downloads}
                          </span>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-black/20 backdrop-blur-sm"
                        onClick={() => handleImageLike(image.id)}
                      >
                        <Heart className={`h-5 w-5 ${image.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                        {image.likes > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                            {image.likes > 99 ? "99+" : image.likes}
                          </span>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-black/20 backdrop-blur-sm"
                        onClick={() => handleAddToCollection(image)}
                      >
                        <FolderPlus className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-black/20 backdrop-blur-sm"
                        onClick={() => handleShare(imageSrc)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Phần dưới - thông tin tác giả */}
                    <Link
                      href={`/profile/${author.username}`}
                      className="flex items-center space-x-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150 hover:bg-black/20 p-2 rounded-lg backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar className="h-8 w-8 border-2 border-white/50">
                        <AvatarImage src={author.avatar || "/default-avatar.png"} alt={author.name} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">{avatarInitial}</AvatarFallback>
                      </Avatar>
                      <div className="text-white">
                        <h4 className="text-sm font-medium leading-none">{author.name}</h4>
                        {author.username && <p className="text-xs text-gray-300">@{author.username}</p>}
                      </div>
                    </Link>
                  </div>
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

        {/* Loading spinner cho infinite scroll */}
        {isLoading && !isUsingSearchResults && displayedImages.length > 0 && (
          <div className="flex justify-center my-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Collection Modal Component */}
        {selectedImage && (
          <CollectionModal
            isOpen={collectionModalOpen}
            onClose={() => setCollectionModalOpen(false)}
            imageId={selectedImage.id}
            imageUrl={selectedImage.file || selectedImage.src}
          />
        )}

        <ToastNotification
          variant={toastVariant}
          title={toastMessage.title}
          description={toastMessage.description}
          isOpen={toastOpen}
          onClose={() => setToastOpen(false)}
          duration={toastMessage.duration}
        />
      </div>
    </section>
  )
}

