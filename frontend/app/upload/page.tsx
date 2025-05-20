"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { fetchCategories, uploadImages, type Category } from "@/lib/api-action/api-upload"
import { Checkbox } from "@/components/ui/checkbox"

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // States for form inputs
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [tags, setTags] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  
  // States for API data
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
    // Load categories from API
  useEffect(() => {
    async function loadCategories() {
      setLoading(true)
      try {
        const data = await fetchCategories()
        // Ensure categories is always an array
        if (Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error("Categories is not an array:", data)
          setCategories([])
          toast.error("Invalid categories data format")
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        toast.error("Failed to load categories")
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    
    loadCategories()
  }, [])

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
    if (files.length === 0) {
      toast.error("Please select at least one image to upload")
      return
    }

    if (!title) {
      toast.error("Please enter a title for your images")
      return
    }

    if (!selectedCategoryId) {
      toast.error("Please select a category for your images")
      return
    }

    setIsUploading(true)
    
    try {
      // Tạo danh sách category IDs từ selectedCategoryId
      const categoryIds = [parseInt(selectedCategoryId)]
      
      // Gọi API để upload ảnh
      const response = await uploadImages(
        files,
        title,
        description,
        categoryIds,
        isPublic,
        tags
      )
      
      toast.success(`Successfully uploaded ${files.length} ${files.length === 1 ? 'image' : 'images'}!`)
      
      // Reset form sau khi upload thành công
      setFiles([])
      setPreviews([])
      setTitle("")
      setDescription("")
      setSelectedCategoryId("")
      setTags("")
      
      // Chuyển hướng đến trang chủ hoặc trang profile
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Failed to upload images. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="container mx-auto py-6">
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-purple-500">
            Pixoria
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your images a title"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for your images"
                    className="bg-gray-700 border-gray-600"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  {loading ? (
                    <div className="flex items-center space-x-2 text-gray-400 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading categories...</span>
                    </div>
                  ) : (                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {Array.isArray(categories) && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories" disabled>
                            No categories available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="tags">Tags (separated by commas)</Label>
                  <Input 
                    id="tags" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="nature, landscape, mountains" 
                    className="bg-gray-700 border-gray-600" 
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="public" 
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked as boolean)} 
                  />
                  <Label htmlFor="public" className="cursor-pointer">Make public (visible to all users)</Label>
                </div>
              </div>
            )}
          </CardContent>

          {previews.length > 0 && (
            <CardFooter>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Uploading...
                  </>
                ) : (
                  <>Upload {files.length} {files.length === 1 ? "Image" : "Images"}</>
                )}
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

