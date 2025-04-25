"use client"

import Header from "@/components/header"
import Hero from "@/components/hero"
import Categories from "@/components/categories"
import ImageGrid from "@/components/image-grid"
import Footer from "@/components/footer"

// ❌ Xoá dòng này:
// import PaginationSettings from "@/components/pagination-settings"

export default function Home() {
  // ❌ Xoá các state liên quan đến pagination:
  // const [paginationType, setPaginationType] = useState<"traditional" | "infinite">("traditional")
  // const [imagesPerPage, setImagesPerPage] = useState(12)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <Hero />
      <Categories />
      {/*
        Gọi ImageGrid với một số ảnh mỗi trang cố định,
        bên trong ImageGrid bạn có thể dùng cơ chế infinite scroll
      */}
      <ImageGrid imagesPerPage={12} />
      <Footer />

      {/* ❌ Bỏ hẳn phần PaginationSettings:
      <PaginationSettings
        paginationType={paginationType}
        onPaginationTypeChange={setPaginationType}
        imagesPerPage={imagesPerPage}
        onImagesPerPageChange={setImagesPerPage}
      />
      */}
    </main>
  )
}
