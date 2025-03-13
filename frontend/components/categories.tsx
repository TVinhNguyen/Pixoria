import Link from "next/link"

const categories = ["Nature", "Travel", "Architecture", "Food", "Technology", "People", "Animals", "Sports"]

export default function Categories() {
  return (
    <section className="py-12 px-4 bg-white dark:bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/category/${category.toLowerCase()}`}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center transition-transform hover:scale-105 hover:shadow-md"
            >
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{category}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

