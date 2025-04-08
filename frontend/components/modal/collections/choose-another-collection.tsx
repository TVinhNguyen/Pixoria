"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  handleCreateCollection,
  handleGetCollections,
  handleSaveImageToCollection,
} from "@/lib/api-action/api-collection"

interface Collection {
  id: number
  name: string
  cover_image?: string
  description?: string
  is_public?: boolean
}

interface CollectionModalProps {
  isOpen: boolean
  onClose: () => void
  imageId: number
  imageUrl?: string
}

export default function CollectionModal({ isOpen, onClose, imageId, imageUrl }: CollectionModalProps) {
  const router = useRouter()
  const [userCollections, setUserCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollection, setNewCollection] = useState<{
    name: string
    description: string
    is_public: boolean
  }>({
    name: "",
    description: "",
    is_public: true,
  })

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const collections = await handleGetCollections()
      console.log("Fetched collections:", collections)
      setUserCollections(collections.results)
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("Failed to fetch collections")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      console.log("Fetching collections...")
      fetchCollections()
    }
  }, [isOpen])

  const handleCreateNewCollection = () => {
    setShowCreateForm(true)
  }

  const handleSaveNewCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error("Please enter a collection name")
      return
    }

    try {
      console.log("Creating new collection with image:", imageUrl)
      const createdCollection = await handleCreateCollection(
        newCollection.name,
        newCollection.description,
        newCollection.is_public,
        imageUrl || "",
      )

      const newCollectionWithCover = {
        ...createdCollection,
        cover_image: imageUrl || createdCollection.cover_image,
      }

      setUserCollections([...userCollections, newCollectionWithCover])
      setNewCollection({
        name: "",
        description: "",
        is_public: true,
      })
      setShowCreateForm(false)
      handleSaveToCollection(createdCollection.id)
      onClose()
    } catch (error) {
      console.error("Error creating collection:", error)
      toast.error("Failed to create collection")
    }
  }

  const handleSaveToCollection = async (collectionId: number) => {
    const imageIds = [imageId]
    const response = await handleSaveImageToCollection(collectionId.toString(), imageIds)
    console.log("Image saved to collection:", response)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewCollection({
      name: "",
      description: "",
      is_public: true,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {showCreateForm ? "Create a new collection" : "Add to my collection"}
          </DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <>
            {imageUrl && (
              <div className="mt-2 mb-4">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt="Selected image"
                  width={300}
                  height={200}
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  {userCollections.length === 0 ? (
                    /* When no collections exist, center the create button */
                    <button
                      onClick={handleCreateNewCollection}
                      className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors col-span-2"
                    >
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <Plus className="h-10 w-10 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium">Create a new collection</span>
                    </button>
                  ) : (
                    <>
                      {/* Create new collection */}
                      <button
                        onClick={handleCreateNewCollection}
                        className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <Plus className="h-10 w-10 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium">Create a new collection</span>
                      </button>

                      {/* Existing collections */}
                      {userCollections.length > 0 ? (
                        userCollections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => handleSaveToCollection(collection.id)}
                            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          >
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden mb-2">
                              {collection.cover_image ? (
                                <Image
                                  src={collection.cover_image || "/placeholder.svg"}
                                  alt={collection.name}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Plus className="h-10 w-10 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium hover:text-primary transition-colors">
                              {collection.name}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-sm text-gray-500">
                          No collections available. Create one to save your images.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  toast.success("Redirecting to collections page")
                  onClose()
                  router.push("/profile?tab=collections")
                }}
              >
                <span>My collections</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="py-4">
            {imageUrl && (
              <div className="mb-4">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt="Selected image"
                  width={300}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name" className="text-base">
                  Collection's name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="collection-name"
                  placeholder="Nature photos..."
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-description" className="text-base">
                  Description
                </Label>
                <Textarea
                  id="collection-description"
                  placeholder="Describe your new collection (optional)"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public-collection" className="text-base">
                    Public
                  </Label>
                  <p className="text-sm text-muted-foreground">Allow other people to view this collection?</p>
                </div>
                <Switch
                  id="public-collection"
                  checked={newCollection.is_public}
                  onCheckedChange={(checked) => setNewCollection({ ...newCollection, is_public: checked })}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <Button variant="outline" onClick={handleCancelCreate} className="flex-1 py-6">
                Back
              </Button>
              <Button
                onClick={handleSaveNewCollection}
                className="flex-1 py-6 bg-green-400 hover:bg-green-500 text-black"
              >
                Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

