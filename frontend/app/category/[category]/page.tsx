"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ImageGrid from "@/components/image-grid"
import { handleGetCategoryBySlug, handleGetImagesByCategory } from "@/lib/api-action/api-categories"
import { ImageData } from "@/hooks/use-FetchImages"

interface CategoryResponse {
  id: number
  name: string
  slug: string
}

interface CategoryImagesResponse {
  count: number
  next: string | null
  previous: string | null
  results: {
    category: CategoryResponse
    images: ImageData[]
  }
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string
  const [images, setImages] = useState<ImageData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        setLoading(true)
        
        // Get category images using handleGetImagesByCategory function
        const response = await handleGetImagesByCategory(categorySlug)
        
        // Handle the paginated response structure
        if (response) {
          if (response.results && response.results.category) {
            setCategoryData(response.results.category)
          }
          
          if (response.results && response.results.images) {
            setImages(response.results.images)
          }
        } else {
          throw new Error("Invalid data format received from API")
        }
      } catch (error) {
        console.error("Error fetching category data:", error)
        setError("Failed to load data for this category")
      } finally {
        setLoading(false)
      }
    }

    if (categorySlug) {
      fetchCategoryData()
    }
  }, [categorySlug])

  const getCategoryTitle = () => {
    if (categoryData && categoryData.name) {
      return categoryData.name
    }
    return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {getCategoryTitle()} Photos
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No images found in this category</p>
          </div>
        ) : (
          <ImageGrid imagesPerPage={20} searchResults={images} />
        )}
      </main>
      
      <Footer />
    </div>
  )
}