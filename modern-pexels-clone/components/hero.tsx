"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Hero() {
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", query)
  }

  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Discover the perfect image
        </h1>
        <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
          Free high-resolution photos you can use anywhere
        </p>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <Input
            type="text"
            placeholder="Search for free photos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full text-lg shadow-lg focus:ring-2 focus:ring-purple-500"
          />
          <Button type="submit" size="icon" className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </section>
  )
}

