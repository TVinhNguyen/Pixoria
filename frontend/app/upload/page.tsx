"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"

const categories = ["Nature", "Travel", "Architecture", "Food", "Technology", "People", "Animals", "Sports"]

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])

      // Create previews
      selectedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviews((prev) => [...prev, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...droppedFiles])

      // Create previews
      droppedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviews((prev) => [...prev, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    // Here you would implement the actual upload logic
    // For example, using FormData and fetch to send to your API
    alert(`Uploading ${files.length} images`)

    // Example implementation (commented out):
    /*
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        // Handle success
        setFiles([])
        setPreviews([])
      } else {
        // Handle error
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
    */
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="container mx-auto py-6">
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-purple-500">
            ModernPexels
          </Link>
          <div className="space-x-4">
            <Button variant="ghost">Explore</Button>
            <Button variant="ghost">License</Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-purple-500">Upload Your Photos</h1>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Share your best shots with the world</CardTitle>
            <CardDescription className="text-gray-400">
              Upload high-quality images that others can use freely
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Drag and drop area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer transition-colors ${
                isDragging ? "border-purple-500 bg-gray-700/50" : "border-gray-600 hover:border-gray-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Drag and drop your images here</h3>
              <p className="text-gray-400 mb-4">or click to browse your files</p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, GIF, WEBP</p>
              <p className="text-sm text-gray-500">Max file size: 10MB</p>
            </div>

            {/* Image previews */}
            {previews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Selected Images ({previews.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                        <Image
                          src={preview || "/placeholder.svg"}
                          alt={`Preview ${index}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        className="absolute top-2 right-2 bg-gray-900/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image metadata */}
            {previews.length > 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your collection a title"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description for your images"
                    className="bg-gray-700 border-gray-600"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (separated by commas)</Label>
                  <Input id="tags" placeholder="nature, landscape, mountains" className="bg-gray-700 border-gray-600" />
                </div>
              </div>
            )}
          </CardContent>

          {previews.length > 0 && (
            <CardFooter>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleUpload}>
                Upload {files.length} {files.length === 1 ? "Image" : "Images"}
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* No images selected state */}
        {previews.length === 0 && (
          <div className="mt-8 text-center">
            <div className="bg-gray-800 inline-flex p-6 rounded-full mb-4">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No images selected yet</h3>
            <p className="text-gray-400 mb-6">
              Select images to upload by dragging and dropping or browsing your files
            </p>
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

