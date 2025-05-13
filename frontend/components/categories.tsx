"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { handleGetCategories } from "../lib/api-action/api-categories"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Bookmark, Grid3X3, Hash } from "lucide-react"

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_count?: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await handleGetCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-12 px-4 bg-white dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Popular Categories</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {categories.length} categories found
            </span>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="w-full h-[100px] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center my-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 rounded-md text-sm font-medium text-red-800 dark:text-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Categories grid */}
        {!isLoading && !error && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {categories.length > 0 ? (
              categories.map((category) => (
                <motion.div key={category.id} variants={item}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="group block bg-gray-100 dark:bg-gray-700 rounded-xl p-6 text-center transition-all hover:shadow-lg hover:scale-[1.02] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
                      {category.image_count !== undefined ? (
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                          <Grid3X3 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2">
                          <Hash className="w-6 h-6" />
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      
                      {category.image_count !== undefined && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Grid3X3 className="w-3 h-3 mr-1" /> {category.image_count} images
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Bookmark className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">No categories found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  There are no categories available right now. Please check back later.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}

