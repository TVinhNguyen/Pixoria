"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Download, Heart, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import API_BASE_URL from "@/lib/api-config";

// Constants for pagination
const IMAGES_PER_PAGE = 12;

export default function CollectionImagesModal({
  isOpen,
  onClose,
  username,
  collectionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  collectionId: string;
}) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const { toast } = useToast();
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchImages = async (page: number = 1) => {
      if (!collectionId) return;
      
      if (page === 1) {
        setLoading(true);
        setError(null);
        setImages([]);
      } else {
        setLoadingMore(true);
      }

      try {
        // Fetch collection data once on initial load
        if (page === 1) {
          let url = '';
          if (username && username.trim() !== '') {
            url = `${API_BASE_URL}/profile/${username}/collections/${collectionId}/`;
          } else {
            url = `${API_BASE_URL}/collections/${collectionId}/`;
          }

          const collectionResponse = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!collectionResponse.ok) {
            throw new Error("Failed to fetch collection details");
          }

          const collectionData = await collectionResponse.json();
          setCollectionData(collectionData);
          
          // Calculate pagination values
          const totalImages = collectionData.images.length;
          const startIdx = 0;
          const endIdx = Math.min(IMAGES_PER_PAGE, totalImages);
          const currentPageImageIds = collectionData.images.slice(startIdx, endIdx);
          const newHasMore = endIdx < totalImages;
          
          // Only fetch the current page of images
          if (currentPageImageIds.length === 0) {
            setImages([]);
            setHasMore(false);
            setLoading(false);
            return;
          }
          
          // Fetch details for the current page images only
          const imagePromises = currentPageImageIds.map(async (imageId: number) => {
            const imageResponse = await fetch(`${API_BASE_URL}/images/${imageId}/?public=true`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image with ID: ${imageId}`);
            }
            
            return await imageResponse.json();
          });
          
          const imageResults = await Promise.all(imagePromises);
          setImages(imageResults);
          setHasMore(newHasMore);
        } else {
          // For pagination, use the already loaded collection data
          if (!collectionData) return;
          
          const totalImages = collectionData.images.length;
          const startIdx = (page - 1) * IMAGES_PER_PAGE;
          const endIdx = Math.min(startIdx + IMAGES_PER_PAGE, totalImages);
          const currentPageImageIds = collectionData.images.slice(startIdx, endIdx);
          const newHasMore = endIdx < totalImages;
          
          if (currentPageImageIds.length === 0) {
            setHasMore(false);
            setLoadingMore(false);
            return;
          }
          
          // Fetch details for the current page images
          const imagePromises = currentPageImageIds.map(async (imageId: number) => {
            const imageResponse = await fetch(`${API_BASE_URL}/images/${imageId}/?public=true`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image with ID: ${imageId}`);
            }
            
            return await imageResponse.json();
          });
          
          const imageResults = await Promise.all(imagePromises);
          setImages(prev => [...prev, ...imageResults]);
          setHasMore(newHasMore);
        }
      } catch (err: any) {
        console.error("Error fetching images:", err);
        setError(err.message || "Failed to load images");
      } finally {
        if (page === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    if (isOpen && collectionId) {
      fetchImages(1);
    }
  }, [isOpen, collectionId, username]);

  const loadMoreImages = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage);
  };

  // Local function to handle image fetching with pagination
  const fetchImages = async (page: number = 1) => {
    if (!collectionId || !collectionData) return;
    
    setLoadingMore(true);
    
    try {
      const totalImages = collectionData.images.length;
      const startIdx = (page - 1) * IMAGES_PER_PAGE;
      const endIdx = Math.min(startIdx + IMAGES_PER_PAGE, totalImages);
      const currentPageImageIds = collectionData.images.slice(startIdx, endIdx);
      const newHasMore = endIdx < totalImages;
      
      if (currentPageImageIds.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Fetch details for the current page images
      const imagePromises = currentPageImageIds.map(async (imageId: number) => {
        const imageResponse = await fetch(`${API_BASE_URL}/images/${imageId}/?public=true`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image with ID: ${imageId}`);
        }
        
        return await imageResponse.json();
      });
      
      const imageResults = await Promise.all(imagePromises);
      setImages(prev => [...prev, ...imageResults]);
      setHasMore(newHasMore);
    } catch (err: any) {
      console.error("Error fetching more images:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load more images",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">
              {collectionData ? collectionData.name : "Collection"}
            </h3>
            {collectionData && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {collectionData.images.length} images
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                This collection has no images
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-lg"
                  >
                    <Image
                      src={image.file || image.image || "/placeholder.svg"}
                      alt={image.title || "Collection image"}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <Link href={`/preview/${image.id}`}>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end p-3">
                        <div className="w-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h4 className="font-medium truncate">
                            {image.title || "Untitled"}
                          </h4>
                          <div className="flex justify-between items-center mt-1">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center">
                                <Heart size={14} className="mr-1" />
                                {image.likes_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreImages}
                    disabled={loadingMore}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
