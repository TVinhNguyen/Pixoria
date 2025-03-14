"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Masonry from "react-masonry-css"
import { Download, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const imagesData = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 1",
    width: 500,
    height: 300,
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 2",
    width: 300,
    height: 400,
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 3",
    width: 400,
    height: 250,
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 4",
    width: 600,
    height: 400,
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 5",
    width: 350,
    height: 500,
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1682685797275-9a9a9016b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    alt: "Image 6",
    width: 450,
    height: 300,
  },
]

export default function ImageGrid() {
  const [images, setImages] = useState(imagesData)

  useEffect(() => {
    // Simulate loading images from an API or other source
    // In a real application, you would fetch the images here
    // and update the state with the fetched data.
    // For this example, we'll just use the mock data.
  }, [])

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <Masonry
          breakpointCols={{
            default: 4,
            1100: 3,
            700: 2,
            500: 1,
          }}
          className="flex w-auto"
          columnClassName="bg-clip-padding px-2"
        >
          {images.map((image) => (
            <div key={image.id} className="mb-4 group relative">
              <Image
                src={image.src || "/placeholder.svg"}
                width={image.width}
                height={image.height}
                alt={image.alt}
                className="rounded-lg shadow-md transition-shadow duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:text-gray-200">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Masonry>
      </div>
    </section>
  )
}

