import Link from "next/link"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function ProfileNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-4xl text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/explore">Explore Photos</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
