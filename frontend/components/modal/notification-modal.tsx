"use client"

import { useEffect, useState } from "react"
import { X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

interface NotificationData {
  id: number;
  type: string;
  user: string;
  userAvatar: string;
  content: string;
  time: string;
  read: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/notifications/get-notifications/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Error fetching notifications!");
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const handleMarkedAllAsRead = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/notifications/mark-all-as-read/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to mark notifications as read");
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/notifications/${id}/mark-as-read/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to mark notification as read");
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  if (!isOpen) return null;

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.read)
    : activeTab === "mentions" 
      ? notifications.filter(n => n.type === "mention")
      : notifications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
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

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <TabsContent value={activeTab} className="space-y-4 mt-0">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-3 rounded-lg ${notification.read ? "" : "bg-muted/20"}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <Image
                      src={notification.userAvatar || "/placeholder.svg"}
                      alt={notification.user}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
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
              <div className="flex items-center justify-center h-24 text-muted-foreground">
                No notifications found
              </div>
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
  );
}