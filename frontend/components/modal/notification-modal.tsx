// "use client";

// import { useEffect, useState, FC } from "react";
// import { X } from "lucide-react";
// import { Button } from "@/components/ui/button";

// interface NotificationData {
//     id: number;
//     message: string;
//     is_read: boolean;
//     sent_day: string;
//     user: number;
// }

// interface NotificationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const NotificationModal: FC<NotificationModalProps> = ({ isOpen, onClose }) => {
//   const [notifications, setNotifications] = useState<NotificationData[]>([])

//   useEffect(() => {
//     if (isOpen) {
//       fetchNotifications();
//     }
//   }, [isOpen]);

//   const fetchNotifications = async () => {
//     const userid = localStorage.getItem("user_id");
//     const response = await fetch(`http://127.0.0.1:8000/notifications/get-notification/?userid=${userid}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${localStorage.getItem("token")}`,
//         },
//     });
//     if (!response.ok) throw new Error("Error fetching notification of user!");
//     const data = await response.json();
//     setNotifications(data);
//   };

//   const handleClearAll = async () => {
//     const userid = localStorage.getItem("user_id");
//     const response = await fetch(`http://127.0.0.1:8000/notifications/delete-all/?userid=${userid}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${localStorage.getItem("token")}`,
//         },
//     });
//     fetchNotifications();
//   }

//   const handleMarkedAllAsRead = async () => {
//     const userid = localStorage.getItem("user_id");
//     const response = await fetch(`http://127.0.0.1:8000/notifications/mark-all-as-read/?userid=${userid}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${localStorage.getItem("token")}`,
//         },
//     });
//     fetchNotifications();
//   }

//   return (
//     <div className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 ${isOpen ? "block" : "hidden"}`}>
//       <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-96 p-4 relative">
//         <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400">
//           <X className="w-5 h-5" />
//         </button>
//         <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-center mb-6">Your Notifications</h2>
//         <div className="space-y-3">
//           {notifications.length > 0 ? (
//             <>
//               {notifications.map((notif) => (
//                 <div key={notif.id} className="flex items-center gap-3 p-2 border-b dark:border-gray-700">
//                   <span className={`w-3 h-3 rounded-full ${notif.is_read ? "bg-gray-300" : "bg-purple-500"}`} />
//                   <div className="text-sm dark:text-gray-200">
//                     <strong>{notif.message}</strong>
//                     <div className="text-xs text-gray-500 dark:text-gray-400">
//                       {new Date(notif.sent_day).toLocaleDateString("vi-VN")} at {new Date(notif.sent_day).toLocaleTimeString("vi-VN")}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <div className="mt-4 flex justify-between">
//                 <Button variant="outline" onClick={handleClearAll}>Clear all</Button>
//                 <Button variant="outline" onClick={handleMarkedAllAsRead}>Mark all as read</Button>
//               </div>
//             </>
//           ) : (
//             <div className="text-center text-black-500 dark:text-gray-400">You have no new notifications!</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default NotificationModal;
"use client"

import { useState } from "react"
import { X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

// Mock notification data
const notifications = [
  {
    id: 1,
    type: "like",
    user: "johndoe",
    userAvatar: "/placeholder.svg?height=40&width=40",
    content: "liked your photo",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    user: "janedoe",
    userAvatar: "/placeholder.svg?height=40&width=40",
    content: "commented on your photo: 'This is amazing!'",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 3,
    type: "follow",
    user: "marksmith",
    userAvatar: "/placeholder.svg?height=40&width=40",
    content: "started following you",
    time: "1 day ago",
    read: true,
  },
]

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState("all")

  if (!isOpen) return null

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
            <TabsContent value="all" className="space-y-4 mt-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start p-3 rounded-lg ${notification.read ? "" : "bg-muted/20"}`}
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

            <TabsContent value="unread" className="space-y-4 mt-0">
              {notifications
                .filter((n) => !n.read)
                .map((notification) => (
                  <div key={notification.id} className="flex items-start p-3 rounded-lg bg-muted/20">
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
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="mentions" className="space-y-4 mt-0">
              <div className="flex items-center justify-center h-24 text-muted-foreground">No mentions yet</div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

