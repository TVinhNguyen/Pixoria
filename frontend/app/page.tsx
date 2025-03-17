"use client"

import { useState } from "react"
import Header from "@/components/header"
import Hero from "@/components/hero"
import Categories from "@/components/categories"
import ImageGrid from "@/components/image-grid"
import Footer from "@/components/footer"
import PaginationSettings from "@/components/pagination-settings"

export default function Home() {
  const [paginationType, setPaginationType] = useState<"traditional" | "infinite">("traditional")
  const [imagesPerPage, setImagesPerPage] = useState(12)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <Hero />
      <Categories />
      <ImageGrid paginationType={paginationType} imagesPerPage={imagesPerPage} />
      <Footer />
      <PaginationSettings
        paginationType={paginationType}
        onPaginationTypeChange={setPaginationType}
        imagesPerPage={imagesPerPage}
        onImagesPerPageChange={setImagesPerPage}
      />
    </main>
  )
}

