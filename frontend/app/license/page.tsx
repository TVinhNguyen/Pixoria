import { Check, X } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function LicensePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="relative w-full h-[400px] md:h-[300px] mt-16 ">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-center text-white text-center px-4 pt-32 pb-20 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text max-w-4xl mx-auto leading-normal pb-1">Some Rules To Follow</h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300"> Discover what's more about our license and how you can use our photos and videos. </p>
        </div>
      </div>

      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-8">
          <Link href="/about-us" className="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"> About Us </Link>
          <Link href="/license" className="text-sm font-medium border-b-2 border-black dark:border-white pb-1"> License </Link>
        </div>
      </div>

      <div className="pt-0">
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple Legal Terms</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400"> You can download and use all photos and videos for free on our platform. </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2"> What is allowed? <span className="text-yellow-500">👍</span> </h2>

            <div className="space-y-4">
              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-green-500 mt-1">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">You can use all photos and videos for free on our platform.</p>
                </div>
              </div>

              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-green-500 mt-1">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">
                    You don't need to credit the source. You don't need to credit the photos to the photographer or our
                    platform, but we always appreciate attribution.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-green-500 mt-1">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">
                    You can edit and modify photos and videos. Feel free to be creative and edit according to your needs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
              What is not allowed? <span className="text-yellow-500">👎</span>
            </h2>

            <div className="space-y-4">
              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-red-500 mt-1">
                  <X className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">People depicted cannot be shown in a negative or offensive way.</p>
                </div>
              </div>

              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-red-500 mt-1">
                  <X className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">
                    You cannot sell unaltered copies of photos or videos, including as prints, posters, or on physical products.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-6 flex items-start gap-4 dark:border-gray-700">
                <div className="text-red-500 mt-1">
                  <X className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base">You cannot claim that you took the photos or created the videos.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}