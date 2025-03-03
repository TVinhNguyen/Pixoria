import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text"
          >
            ModernPexels
          </Link>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-6">
          <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            About
          </Link>
          <Link href="/blog" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Blog
          </Link>
          <Link href="/faq" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            FAQ
          </Link>
          <Link href="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}

