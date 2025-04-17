"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastNotificationProps {
  icon?: React.ReactNode
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  duration?: number
  variant?: "success" | "error" | "info" | "warning"
}

export default function ToastNotification({ icon, title, description, isOpen, onClose, duration = 5000, variant = "success",}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose()
        }, duration)
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const getVariantIcon = () => {
    if (icon) return icon
    switch (variant) {
      case "success":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.25 7L6.5 8.25L8.75 5.75"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="7" r="6" stroke="#10B981" strokeWidth="1.5" />
            </svg>
          </div>
        )
      case "error":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="6" stroke="#EF4444" strokeWidth="1.5" />
              <path d="M5 5L9 9M5 9L9 5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )
      case "warning":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="6" stroke="#F59E0B" strokeWidth="1.5" />
              <path d="M7 4V7.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.5" fill="#F59E0B" stroke="#F59E0B" />
            </svg>
          </div>
        )
      case "info":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="6" stroke="#3B82F6" strokeWidth="1.5" />
              <circle cx="7" cy="4" r="0.5" fill="#3B82F6" stroke="#3B82F6" />
              <path d="M7 6V10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-[9999] flex w-auto max-w-md items-start gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
      )}
      role="alert"
    >
      {getVariantIcon()}

      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      <button
        onClick={onClose}
        className="ml-4 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}