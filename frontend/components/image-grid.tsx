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
  searchResults?: ImageData[]; 
}

export default function ImageGrid({ paginationType, imagesPerPage, searchResults }: ImageGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedImages, setDisplayedImages] = useState<ImageData[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Theo dõi xem có đang sử dụng kết quả tìm kiếm hay không
  const [isUsingSearchResults, setIsUsingSearchResults] = useState(false);
  
  // Chỉ fetch dữ liệu khi không có kết quả tìm kiếm
  const { images: fetchedImages, totalPages, isLoading } = useFetchImages(
    (!searchResults || searchResults.length === 0) ? currentPage : 1, 
    imagesPerPage
  );

  // Xử lý khi searchResults thay đổi
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      console.log("Using search results:", searchResults);
      setDisplayedImages(searchResults);
      setIsUsingSearchResults(true);
      setHasMore(false); // Không cần phân trang với kết quả tìm kiếm
    } else {
      setIsUsingSearchResults(false);
    }
  }, [searchResults]);

  // Xử lý khi fetchedImages thay đổi (chỉ khi không dùng searchResults)
  useEffect(() => {
    // Chỉ cập nhật từ fetchedImages khi không dùng kết quả tìm kiếm
    if (!isUsingSearchResults && !isLoading && fetchedImages && fetchedImages.length > 0) {
      console.log("Using fetched images:", fetchedImages);
      
      if (paginationType === "infinite") {
        // For infinite scroll, append new images
        setDisplayedImages((prev) => {
          // Tránh trùng lặp dựa trên ID
          const existingIds = new Set(prev.map(img => img.id));
          const newImages = fetchedImages.filter(img => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      } else {
        // For traditional pagination, replace images
        setDisplayedImages(fetchedImages);
      }
      
      // Check if we've reached the end
      setHasMore(currentPage < totalPages);
    }
  }, [fetchedImages, currentPage, totalPages, paginationType, isLoading, isUsingSearchResults]);

  // Log để debug
  useEffect(() => {
    console.log("Is using search results:", isUsingSearchResults);
    console.log("Images from hook:", fetchedImages);
    console.log("Search results:", searchResults);
    console.log("Current displayed images:", displayedImages);
  }, [fetchedImages, displayedImages, searchResults, isUsingSearchResults]);

  // Reference for the last image element for infinite scroll
  const lastImageElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isUsingSearchResults) return; // Không áp dụng infinite scroll cho kết quả tìm kiếm
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && paginationType === "infinite") {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, paginationType, isUsingSearchResults],
  );

  // Reset images and page when pagination type changes or khi chuyển từ search results sang normal browsing
  useEffect(() => {
    if (!isUsingSearchResults) {
      setDisplayedImages([]);
      setCurrentPage(1);
    }
  }, [paginationType, isUsingSearchResults]);

  const handlePageChange = (page: number) => {
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  }

  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Calculate start and end of page range to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Add the page range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always include last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Loading skeleton for traditional pagination or initial load */}
        {isLoading && !isUsingSearchResults && paginationType === "traditional" && (
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
              // For the last item in infinite scroll, add a ref
              const isLastElement = index === displayedImages.length - 1;
              
              return (
                <div
                  key={`${image.id}-${index}`}
                  className="mb-4 group relative overflow-hidden"
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
        {isLoading && !isUsingSearchResults && paginationType === "infinite" && (
          <div className="flex justify-center my-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Pagination Controls - Only show for traditional pagination and not search results */}
        {!isUsingSearchResults && paginationType === "traditional" && totalPages > 1 && (
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