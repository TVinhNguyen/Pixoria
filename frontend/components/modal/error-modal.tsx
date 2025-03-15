"use client"

import { AlertCircle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ErrorModalProps {
  title?: string
  message: string
  isOpen: boolean
  onClose: () => void
}

export default function ErrorModal({ title = "Error", message, isOpen, onClose }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-destructive/20 p-0 overflow-hidden">
        <div className="bg-destructive/10 py-3 px-6 border-b border-destructive/20">
          <DialogHeader className="flex flex-row items-center gap-2 pt-2">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full opacity-70 hover:opacity-100 hover:bg-destructive/10 transition-all"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
        </div>

        <div className="p-6">
          <DialogDescription className="text-base text-foreground leading-relaxed">{message}</DialogDescription>
        </div>

        <DialogFooter className="bg-muted/40 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

