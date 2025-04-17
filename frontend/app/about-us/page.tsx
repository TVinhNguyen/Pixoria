import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="relative w-full h-[400px] md:h-[300px] mt-16 ">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-center text-white text-center px-4 pt-32 pb-20 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text max-w-4xl mx-auto leading-normal pb-1">Unleash Creativity</h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            By providing free stock photos, ModernPexels helps millions of creators worldwide easily create stunning products and designs.
          </p>
        </div>
      </div>

      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-8">
          <Link href="/about" className="text-sm font-medium border-b-2 border-black dark:border-white pb-1"> About Us </Link>
          <Link href="/license" className="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"> License </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">About Us</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-6">
              ModernPexels provides high quality and completely free stock photos licensed under the ModernPexels
              license. All photos are nicely tagged, searchable and also easy to discover through our discover pages.
            </p>

            <h3 className="text-2xl font-bold mt-12 mb-4">Photos</h3>
            <p className="mb-6">
              We have hundreds of thousands of free stock photos and every day new high-resolution photos will be added.
              All photos are hand-picked from photos uploaded by our users or sourced from free image sources. We make
              sure all published photos are high-quality and licensed under the ModernPexels license.
            </p>

            <h3 className="text-2xl font-bold mt-12 mb-4">Videos</h3>
            <p className="mb-6">
              Besides free stock photos, we also offer free stock videos. All videos are licensed under the ModernPexels
              license, which makes them safe to use without asking for permission or giving credit to the artist - even
              for commercial purposes.
            </p>

            <h3 className="text-2xl font-bold mt-12 mb-4">Our Mission</h3>
            <p className="mb-6">
              We help millions of designers, writers, artists, programmers and other creators to get access to beautiful
              photos and images that they can use freely which empowers them to create amazing products, designs,
              stories, websites, apps, art and other work. We call it: "Empowering Creators".
            </p>

            <h3 className="text-2xl font-bold mt-12 mb-4">Our Team</h3>
            <p className="mb-6">
              We're a team of creatives who are passionate about making high-quality stock photos freely available to
              everyone. Our team works tirelessly to curate the best photos and videos, ensuring they meet our high
              standards for quality and usability.
            </p>

            <h3 className="text-2xl font-bold mt-12 mb-4">Join Our Community</h3>
            <p className="mb-6">
              We're always looking for new photographers and videographers to join our community. If you're interested
              in sharing your work with millions of creators worldwide, sign up and start uploading your content today.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}