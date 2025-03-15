"use client"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ErrorModalProps {
  title?: string
  message: string
  isOpen: boolean
  onClose: () => void
}

export default function ErrorModal({
  title = "Error",
  message,
  isOpen,
  onClose,
}: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <DialogDescription className="py-4">{message}</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}