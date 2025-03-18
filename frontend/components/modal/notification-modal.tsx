"use client"

import { useEffect, useState } from "react"
import { X, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { handleNotificationClick, handleMarkedAllAsReadClick, handleMarkAsRead } from "@/lib/api-action/api-notification"

const scrollbarStyles =
  `
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(155, 155, 155, 0.5);
      border-radius: 20px;
    }
  `

interface NotificationData {
  id: number
  type: string
  user: string
  userAvatar: string
  content: string
  time: string
  read: boolean
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await handleNotificationClick()
      setNotifications(data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkedAllAsRead = async () => {
    try {
      await handleMarkedAllAsReadClick()
      fetchNotifications()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await handleMarkAsRead(id)
      fetchNotifications()
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error)
    }
  }

  if (!isOpen) return null

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : activeTab === "mentions"
        ? notifications.filter((n) => n.type === "mention")
        : notifications

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <style jsx>{scrollbarStyles}</style>
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 max-h-[calc(80vh-180px)] custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <TabsContent value={activeTab} className="space-y-2 mt-0 pr-1">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-2 rounded-lg ${notification.read ? "" : "bg-muted/20"} hover:bg-muted/30 transition-colors cursor-pointer`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="relative mr-3 flex-shrink-0">
                      {imageError[notification.id] ? (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 shadow-sm">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm ring-2 ring-background">
                          <Image
                            src={notification.userAvatar || "/placeholder.svg?height=40&width=40"}
                            alt={notification.user}
                            width={40}
                            height={40}
                            className="object-cover h-full w-full"
                            onError={() => setImageError((prev) => ({ ...prev, [notification.id]: true }))}
                          />
                        </div>
                      )}
                      {notification.type === "mention" && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">@{notification.user}</span> {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                  </div>
                ))}
              </TabsContent>
            ) : (
              <div className="flex items-center justify-center h-24 text-muted-foreground">No notifications found</div>
            )}
          </div>
        </Tabs>

        {notifications.length > 0 && (
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={handleMarkedAllAsRead}>
              Mark all as read
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}