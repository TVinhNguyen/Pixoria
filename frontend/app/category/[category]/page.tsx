"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CategoryImageGrid from "@/components/category-image-grid"
import { handleGetCategoryBySlug } from "@/lib/api-action/api-categories"

interface CategoryResponse {
  id: number
  name: string
  slug: string
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        setLoading(true)
        
        // Only fetch the category details for the title
        const response = await handleGetCategoryBySlug(categorySlug)
        
        if (response) {
          setCategoryData(response)
        }
      } catch (error) {
        console.error("Error fetching category data:", error)
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
        
        {/* Use our specialized category image grid that directly handles the API calls */}
        <CategoryImageGrid categorySlug={categorySlug} imagesPerPage={20} />
      </main>
      
      <Footer />
    </div>
  )
}