"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Search, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { searchByImage, searchByText } from "@/services/visual-search"

export default function Hero() {
  const [query, setQuery] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    try {
      if (uploadedImage && uploadedFile) {
        // Search by image
        const results = await searchByImage(uploadedFile)
        console.log("Image search results:", results)
        // In a real app, you would update the UI with these results
      } else if (query) {
        // Search by text
        const results = await searchByText(query)
        console.log("Text search results:", results)
        // In a real app, you would update the UI with these results
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

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
    setUploadedImage(null)
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
    <section
      className="pt-32 pb-20 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={dropZoneRef}
    >
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
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

            {/* Hidden file input */}
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
  )
}

