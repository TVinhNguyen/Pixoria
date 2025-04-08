"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoveRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { handleGetCollectionById, handleGetCollections, loadImagesFromCollection } from "@/lib/api-action/api-collection"

interface Collection {
  id: number
  name: string
  cover_image?: string
  description?: string
  is_public?: boolean
  images?: CollectionImage[]
}

interface CollectionImage {
  id: number
  file: string
  title?: string
}

interface CollectionImagesModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId: number
}

export default function CollectionImagesModal({ isOpen, onClose, collectionId }: CollectionImagesModalProps) {
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [otherCollections, setOtherCollections] = useState<Collection[]>([])
  const [showMoveOptions, setShowMoveOptions] = useState<number | null>(null)
  const [isSuccessful, setIsSuccessful] = useState(false)

  const fetchCollectionData = async () => {
    try {
      setLoading(true)
      const data = await handleGetCollectionById(collectionId.toString())
      const images = await loadImagesFromCollection(collectionId.toString())
      data.images = images
      setCollection(data)
      
      const collectionsData = await handleGetCollections()
      setOtherCollections(collectionsData.results.filter((c: Collection) => c.id !== collectionId))
    } catch (error) {
      console.error("Error fetching collection data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && collectionId) {
      fetchCollectionData()
    } else {
      setShowMoveOptions(null)
    }
  }, [isOpen, collectionId])

  const handleRemoveImage = async (imageId: number) => {
    
  }

  const handleMoveImage = async (imageId: number, targetCollectionId: number) => {
    setShowMoveOptions(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">{collection?.name || "Collection Images"}</DialogTitle>
          {collection?.images && (
            <p className="text-sm text-muted-foreground mt-1">
              {collection.images.length} {collection.images.length === 1 ? "photo" : "photos"}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : collection?.images && collection.images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
            {collection.images.map((image) => (
              <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image.file || "/placeholder.svg"}
                  alt={image.title || `Image ${image.id}`}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />

                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-sm truncate">{image.title}</p>
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {showMoveOptions === image.id ? (
                    <div className="bg-black/80 p-2 rounded-lg">
                      <p className="text-white text-xs mb-2">Move to:</p>
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                        {otherCollections.length > 0 ? (
                          otherCollections.map((c) => (
                            <Button
                              key={c.id}
                              variant="ghost"
                              size="sm"
                              className="justify-start h-7 text-xs text-white hover:bg-white/20"
                              onClick={() => handleMoveImage(image.id, c.id)}
                            >
                              {c.name}
                            </Button>
                          ))
                        ) : (
                          <p className="text-gray-400 text-xs">No other collections available</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full text-xs text-white hover:bg-white/20"
                        onClick={() => setShowMoveOptions(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => setShowMoveOptions(image.id)}
                        title="Move to another collection"
                      >
                        <MoveRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-black/50 hover:bg-red-600 text-white"
                        onClick={() => handleRemoveImage(image.id)}
                        title="Remove from collection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No images in this collection</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
