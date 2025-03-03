import Header from "@/components/header"
import Hero from "@/components/hero"
import Categories from "@/components/categories"
import ImageGrid from "@/components/image-grid"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <Hero />
      <Categories />
      <ImageGrid />
      <Footer />
    </main>
  )
}

