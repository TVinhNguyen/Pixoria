"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader} from "@/components/ui/dialog"
import { handleGetCollectionById, handleUpdateCollection } from "@/lib/api-action/api-collection"
import { DialogTitle } from "@radix-ui/react-dialog"

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
  collectionId: number
}

export default function EditCollectionModal({ isOpen, onClose, collectionId }: CollectionModalProps) {
    const [collectionData, setCollectionData] = useState<Collection | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [updatedCollection, setUpdatedCollection] = useState<{
        name: string
        description: string
        is_public: boolean
    }>({
        name: "",
        description: "",
        is_public: true,
    })

    const fetchCollectionData = async () => {
        try {
            setIsLoading(true)
            const data = await handleGetCollectionById(collectionId.toString())
            setCollectionData(data)
            setUpdatedCollection({
                name: data.name,
                description: data.description || "",
                is_public: data.is_public || true,
            })
            console.log("Collection data fetched:", data)
        } catch (error) {
            console.error("Error fetching collection data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchCollectionData()
        }
    }, [isOpen])

    const handleSaveChanges = async () => {
        try {
            await handleUpdateCollection(
                collectionId.toString(),
                updatedCollection.name,
                updatedCollection.description,
                updatedCollection.is_public
            )
            console.log("Collection updated successfully")
            onClose()
        } catch (error) {
            console.error("Error updating collection:", error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold"> Edit Collection </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="collection-name" className="text-base"> Collection's name </Label>
                            <Input
                                id="collection-name"
                                placeholder="Nature photos..."
                                value={updatedCollection.name}
                                onChange={(e) => setUpdatedCollection({ ...updatedCollection, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="collection-description" className="text-base"> Description </Label>
                            <Textarea
                                id="collection-description"
                                placeholder="Describe your new collection (optional)"
                                value={updatedCollection.description}
                                onChange={(e) => setUpdatedCollection({ ...updatedCollection, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="public-collection" className="text-base"> Public </Label>
                                <p className="text-sm text-muted-foreground">Allow other people to view this collection?</p>
                            </div>
                            <Switch
                                id="public-collection"
                                checked={updatedCollection.is_public}
                                onCheckedChange={(checked) => setUpdatedCollection({ ...updatedCollection, is_public: checked })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between gap-4">
                        <Button variant="outline" className="flex-1 py-6" onClick={() => onClose()}> Cancel </Button>
                        <Button className="flex-1 py-6 bg-green-400 hover:bg-green-500 text-black" onClick={handleSaveChanges}> Save changes </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

