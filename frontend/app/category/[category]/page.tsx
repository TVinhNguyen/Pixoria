"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ImageGrid from "@/components/image-grid"
import API_BASE_URL from "@/lib/api-config"

export default function CategoryPage() {
  const params = useParams()
  const categoryName = params.category as string
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchCategoryImages() {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/images/category/${categoryName}/`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch category images")
        }
        
        const data = await response.json()
        setImages(data)
      } catch (error) {
        console.error("Error fetching category images:", error)
        setError("Failed to load images for this category")
      } finally {
        setLoading(false)
      }
    }

    if (categoryName) {
      fetchCategoryImages()
    }
  }, [categoryName])

  const formatCategoryTitle = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {formatCategoryTitle(categoryName)} Photos
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
          <ImageGrid images={images} />
        )}
      </main>
      
      <Footer />
    </div>
  )
}