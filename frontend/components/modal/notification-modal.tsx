"use client";

import { useEffect, useState, FC } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationData {
    id: number;
    message: string;
    is_read: boolean;
    sent_day: string;
    user: number;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    const userid = localStorage.getItem("user_id");
    const response = await fetch(`http://127.0.0.1:8000/notifications/get-notification/?userid=${userid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!response.ok) throw new Error("Error fetching notification of user!");
    const data = await response.json();
    setNotifications(data);
  };

  const handleClearAll = async () => {
    const userid = localStorage.getItem("user_id");
    const response = await fetch(`http://127.0.0.1:8000/notifications/delete-all/?userid=${userid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    });
    fetchNotifications();
  }

  const handleMarkedAllAsRead = async () => {
    const userid = localStorage.getItem("user_id");
    const response = await fetch(`http://127.0.0.1:8000/notifications/mark-all-as-read/?userid=${userid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    });
    fetchNotifications();
  }

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 ${isOpen ? "block" : "hidden"}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-96 p-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-center mb-6">Your Notifications</h2>
        <div className="space-y-3">
          {notifications.length > 0 ? (
            <>
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-center gap-3 p-2 border-b dark:border-gray-700">
                  <span className={`w-3 h-3 rounded-full ${notif.is_read ? "bg-gray-300" : "bg-purple-500"}`} />
                  <div className="text-sm dark:text-gray-200">
                    <strong>{notif.message}</strong>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notif.sent_day).toLocaleDateString("vi-VN")} at {new Date(notif.sent_day).toLocaleTimeString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={handleClearAll}>Clear all</Button>
                <Button variant="outline" onClick={handleMarkedAllAsRead}>Mark all as read</Button>
              </div>
            </>
          ) : (
            <div className="text-center text-black-500 dark:text-gray-400">You have no new notifications!</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;