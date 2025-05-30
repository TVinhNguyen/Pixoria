"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { type ImageData } from "../hooks/use-FetchImages"
import { handleLike, handleDownload } from "@/lib/api-action/image-actions"
import { handleGetImagesByCategory } from "@/lib/api-action/api-categories"
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

interface CategoryImageGridProps {
  categorySlug: string
  imagesPerPage?: number
}

export default function CategoryImageGrid({ categorySlug, imagesPerPage = 20 }: CategoryImageGridProps) {
  const [images, setImages] = useState<ImageData[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  
  // Collection modal state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info" | "warning">("success")
  const [toastMessage, setToastMessage] = useState({ title: "", description: "", duration: 0 })

  const setNotification = (
    variant: "success" | "error" | "info" | "warning",
    title: string,
    description: string,
    duration: number,
  ) => {
    setToastVariant(variant)
    setToastMessage({ title, description, duration })
    setToastOpen(true)
  }

  // Observer for infinite scrolling
  const lastImageElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  // Fetch images for the category
  useEffect(() => {
    async function fetchCategoryImages() {
      try {
        setLoading(true)
        const response = await handleGetImagesByCategory(categorySlug, currentPage, imagesPerPage)
        
        if (response && response.results) {
          // Set category name if available
          if (response.results.category && response.results.category.name) {
            setCategoryName(response.results.category.name)
          }
          
          // Set images if available
          if (response.results.images && response.results.images.length > 0) {
            setImages(prevImages => 
              currentPage === 1 
                ? response.results.images 
                : [...prevImages, ...response.results.images]
            )
          }
          
          // Calculate total pages and check if there are more pages
          if (response.count) {
            const total = Math.ceil(response.count / imagesPerPage)
            setTotalPages(total)
            setHasMore(currentPage < total)
          } else {
            setHasMore(false)
          }
        } else {
          throw new Error("Invalid response format from API")
        }
      } catch (error) {
        console.error("Error fetching category images:", error)
        setError("Failed to load images for this category")
      } finally {
        setLoading(false)
      }
    }

    if (categorySlug) {
      fetchCategoryImages()
    }
  }, [categorySlug, currentPage, imagesPerPage])

  // Handling like functionality
  const handleImageLike = async (imageId: number) => {
    try {
      // Find the current image
      const currentImage = images.find((img) => img.id === imageId)

      // If the image is already liked, we want to unlike it
      const isUnliking = currentImage?.is_liked

      const response = await handleLike(imageId)

      if (response && (response.status === "success" || response.likes !== undefined)) {
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  likes: response.likes,
                  is_liked: isUnliking ? false : true,
                }
              : img,
          ),
        )

        // Show appropriate toast message
        if (isUnliking) {
          setNotification("info", "Unliked", "You've removed your like from this image", 2000)
        } else {
          setNotification("success", "Liked", "You've liked this image!", 2000)
        }
      } else if (response && response.status === "already_liked") {
        toast.info("You've already liked this image!")
      }
    } catch (error) {
      console.error("Error when liking/unliking image:", error)
      setNotification("error", "Error", "Failed to update like status. Please try again!", 3000)
    }
  }

  // Handling download functionality
  const handleImageDownload = async (imageId: number, imageSrc: string) => {
    try {
      const apiResponse = await handleDownload(imageId)
      const header = new Headers({ "Access-Control-Allow-Origin": "*" })
      const response = await fetch(imageSrc, { headers: header })
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
        setImages((prevImages) =>
          prevImages.map((img) => (img.id === imageId ? { ...img, downloads: apiResponse.downloads } : img)),
        )
      }
      setNotification("success", "Success", "Image is downloaded successfully!", 3000)
    } catch (error) {
      console.error("Error downloading image:", error)
      setNotification("error", "Error", "Failed to download the image. Please try again!", 3000)
    }
  }

  // Handle add to collection
  const handleAddToCollection = (image: ImageData) => {
    setSelectedImage(image)
    setCollectionModalOpen(true)
  }

  // Handle share image link
  const handleShare = (imageSrc: string) => {
    navigator.clipboard.writeText(window.location.origin + imageSrc)
    setNotification("success", "Success", "Image's link is saved to clipboard!", 3000)
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Loading skeleton */}
        {loading && images.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: imagesPerPage || 20 }).map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="w-full h-[300px] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}

        {/* No images found message */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">Không tìm thấy hình ảnh nào.</p>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 && (
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
            {images.map((image, index) => {
              const isLastElement = index === images.length - 1
              const imageSrc = image.file || image.src || ""

              const author = image.author || {
                user_id: 0,
                username: image.username || "photographer",
                name: "Photographer",
                avatar: null,
              }

              // Create initial for avatar fallback
              const avatarInitial = author.name ? author.name.charAt(0).toUpperCase() : "P"

              return (
                <div
                  key={`${image.id}-${index}`}
                  className="mb-4 group relative overflow-hidden"
                  ref={isLastElement ? lastImageElementRef : undefined}
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

                  {/* Overlay with gradient and smooth transition */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex flex-col justify-between p-4">
                    {/* Top part - interaction buttons */}
                    <div className="self-end flex space-x-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-black/20 backdrop-blur-sm"
                        onClick={() => handleImageDownload(image.id, imageSrc)}
                      >
                        <Download className="h-5 w-5" />
                        {image.downloads > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
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

                    {/* Bottom part - author info */}
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

        {/* Loading spinner for infinite scroll */}
        {loading && images.length > 0 && (
          <div className="flex justify-center my-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Collection Modal */}
        {selectedImage && (
          <CollectionModal
            isOpen={collectionModalOpen}
            onClose={() => setCollectionModalOpen(false)}
            imageId={selectedImage.id}
            imageUrl={selectedImage.file || selectedImage.src}
          />
        )}

        {/* Toast Notification */}
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