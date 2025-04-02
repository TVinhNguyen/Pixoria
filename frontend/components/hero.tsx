"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Search, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Download, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Masonry from "react-masonry-css"
import SliderGallery from "./SliderGallery"
import { searchByImage, searchByText, searchByImageUrl, VisualSearchResult } from "@/lib/api-action/visual-search"

interface ImageData {
  id: number
  src: string
  alt: string
  width: number
  height: number
  title?: string
  description?: string
  likes?: number
  downloads?: number
}

export default function Hero() {
  const [query, setQuery] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchResults, setSearchResults] = useState<ImageData[]>([]) 
  const [hasSearched, setHasSearched] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [featuredImages, setFeaturedImages] = useState<ImageData[]>([
    {
      id: 1,
      src: "images/nature.jpg",
      alt: "Cảnh thiên nhiên tuyệt đẹp",
      width: 1920,
      height: 1080,
      title: "Khám phá thiên nhiên tuyệt đẹp",
      description: "Tìm kiếm hình ảnh phong cảnh với góc nhìn độc đáo và màu sắc rực rỡ."
    },
    {
      id: 2,
      src: "images/workspace.jpg",
      alt: "Không gian làm việc sáng tạo",
      width: 1920,
      height: 1080,
      title: "Không gian làm việc sáng tạo",
      description: "Những bức ảnh về không gian làm việc hiện đại và sáng tạo giúp truyền cảm hứng."
    },
    {
      id: 3,
      src: "images/city.jpg",
      alt: "Đô thị hiện đại",
      width: 1920,
      height: 1080,
      title: "Khám phá đô thị hiện đại",
      description: "Những góc nhìn độc đáo về cuộc sống đô thị và kiến trúc hiện đại."
    },
    {
      id: 4,
      src: "images/portrait.jpg",
      alt: "Chân dung nghệ thuật",
      width: 1920,
      height: 1080,
      title: "Chân dung nghệ thuật",
      description: "Bộ sưu tập ảnh chân dung ấn tượng với cách tiếp cận sáng tạo và đầy cảm xúc."
    },
    {
      id: 5,
      src: "images/food.jpg",
      alt: "Ẩm thực sáng tạo",
      width: 1920,
      height: 1080,
      title: "Khám phá ẩm thực sáng tạo",
      description: "Những hình ảnh ẩm thực đẹp mắt và hấp dẫn từ khắp nơi trên thế giới."
    }
  ])
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setHasSearched(true)

    try {
      let results: VisualSearchResult[] = [];
      
      if (uploadedImage && uploadedFile) {
        // Search by image
        results = await searchByImage(uploadedFile)
        console.log("Image search results:", results)
      } else if (query) {
        // Search by text
        results = await searchByText(query)
        console.log("Text search results:", results)
      }
      
      // Chuyển đổi và đảm bảo id luôn là number
      const formattedResults = results.map(result => ({
        id: typeof result.id === 'string' ? parseInt(result.id, 10) || Math.floor(Math.random() * 100000) : (result.id || Math.floor(Math.random() * 100000)),
        src: result.url || result.src || "",
        alt: result.title || "Search result",
        width: result.width || 500,
        height: result.height || 500,
        title: result.title || "",
        description: result.description || "",
        likes: result.likes || 0,
        downloads: 0
      }));
      
      console.log("Formatted results:", formattedResults);
      setSearchResults(formattedResults)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // Các hàm xử lý file và kéo thả - giữ nguyên

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // Create a preview URL for the image
    const imageUrl = URL.createObjectURL(file)
    setUploadedImage(imageUrl)
    setUploadedFile(file)
    // Clear the text search when an image is uploaded
    setQuery("")
  }

  
  const handleUploadClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click()
  }

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (searchResults.length > 0) {
      setSearchResults([]);
      console.log("Đã xóa kết quả tìm kiếm liên quan");
      
      // Nếu bạn muốn giữ lại flag hasSearched là true, hãy comment dòng dưới đây
      setHasSearched(false); 
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsDragging(true)
      }
    },
    [isDragging],
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        processFile(file)
      }
    }
  }, [])

  return (
    <>
      <section
        className="pt-32 pb-20 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={dropZoneRef}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text max-w-4xl mx-auto leading-normal pb-1">
          Discover the perfect image
          </h1>


          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            Free high-resolution photos you can use anywhere
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-500 dark:text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for free photos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-28 py-6 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg focus:ring-2 focus:ring-purple-500"
                disabled={!!uploadedImage || isSearching}
              />
              <div className="absolute right-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 font-medium rounded-full p-2"
                  title="Upload an image to search"
                  disabled={isSearching}
                >
                  <Upload className="h-5 w-5" />
                  <span className="sr-only">Upload image</span>
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 transition-colors text-white font-medium rounded-full px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(!query && !uploadedImage) || isSearching}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                aria-label="Upload an image to search"
              />
            </div>

            {/* Image preview */}
            {uploadedImage && (
              <div className="mt-4 relative inline-block">
                <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden border-2 border-purple-500">
                  <Image
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded image for search"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearUploadedImage}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all"
                    aria-label="Remove uploaded image"
                    disabled={isSearching}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {isSearching ? "Searching for similar images..." : "Search for similar images"}
                </p>
              </div>
            )}
          </form>

          {/* Drag overlay */}
          {isDragging && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-2xl font-bold mb-2">Drop your image here</h3>
                <p className="text-gray-600 dark:text-gray-400">Drop an image to search for similar photos</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {!hasSearched && (
        <div className="container mx-auto py-8 px-4">
          <h2 className="text-2xl font-bold mb-6">Bộ sưu tập nổi bật</h2>
          <SliderGallery images={featuredImages} />
        </div>
      )}
      {/* Hiển thị kết quả tìm kiếm - trực tiếp trong Hero thay vì dùng ImageGrid */}
      {hasSearched && (
        <div className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto py-8">
            <h2 className="text-2xl font-bold mb-6 px-4">
              {isSearching 
                ? "Đang tìm kiếm..." 
                : searchResults.length > 0 
                  ? `Kết quả tìm kiếm (${searchResults.length})` 
                  : "Không tìm thấy kết quả nào"}
            </h2>
            
            {/* Hiển thị loading khi đang tìm kiếm */}
            {isSearching && (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Hiển thị kết quả tìm kiếm sử dụng Masonry trực tiếp */}
            {!isSearching && searchResults.length > 0 && (
              <Masonry
                breakpointCols={{
                  default: 4,
                  1100: 3,
                  700: 2,
                  500: 1,
                }}
                className="flex w-auto px-4"
                columnClassName="bg-clip-padding px-2"
              >
                {searchResults.map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="mb-4 group relative overflow-hidden"
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
                  </div>
                ))}
              </Masonry>
            )}
            
            {/* Hiển thị thông báo khi không tìm thấy kết quả */}
            {!isSearching && hasSearched && searchResults.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Không tìm thấy hình ảnh nào phù hợp. Vui lòng thử lại với từ khóa khác.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}