"use client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationSettingsProps {
  paginationType: "traditional" | "infinite"
  onPaginationTypeChange: (type: "traditional" | "infinite") => void
  imagesPerPage: number
  onImagesPerPageChange: (count: number) => void
}

export default function PaginationSettings({
  paginationType,
  onPaginationTypeChange,
  imagesPerPage,
  onImagesPerPageChange,
}: PaginationSettingsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 rounded-full shadow-lg">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Pagination Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Pagination Settings</SheetTitle>
          <SheetDescription>Customize how images are loaded and displayed</SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>Pagination Type</Label>
            <RadioGroup
              defaultValue={paginationType}
              onValueChange={(value) => onPaginationTypeChange(value as "traditional" | "infinite")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="traditional" id="traditional" />
                <Label htmlFor="traditional">Traditional Pagination</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="infinite" id="infinite" />
                <Label htmlFor="infinite">Infinite Scroll</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Images Per Page</Label>
            <Select
              defaultValue={imagesPerPage.toString()}
              onValueChange={(value) => onImagesPerPageChange(Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of images" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 images</SelectItem>
                <SelectItem value="24">24 images</SelectItem>
                <SelectItem value="36">36 images</SelectItem>
                <SelectItem value="48">48 images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

