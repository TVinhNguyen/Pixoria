"use client";

import { useState, useEffect, useCallback } from "react";

type NotificationSocketState = {
  isConnected: boolean;
  hasNewNotification: boolean;
  newNotificationCount: number;
  latestNotification: any | null;
};

type NotificationSocketHook = NotificationSocketState & {
  resetNewNotificationFlag: () => void;
};

export function useNotificationSocket(): NotificationSocketHook {
  const [socketState, setSocketState] = useState<NotificationSocketState>({
    isConnected: false,
    hasNewNotification: false,
    newNotificationCount: 0,
    latestNotification: null,
  });

  const resetNewNotificationFlag = useCallback(() => {
    setSocketState((prevState) => ({
      ...prevState,
      hasNewNotification: false,
      newNotificationCount: 0,
    }));
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSocket = () => {
      // Chỉ kết nối nếu người dùng đã đăng nhập (có token)
      const token = localStorage.getItem("token");
      if (!token) return;

      // Xác định endpoint WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
      
      // Thêm token vào URL để xác thực
      const wsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;

      // Tạo kết nối WebSocket
      socket = new WebSocket(wsUrl);
      
      // Hoặc có thể thêm token vào request headers
      // Tuy nhiên, không phải tất cả môi trường đều hỗ trợ custom headers với WebSocket
      // socket = new WebSocket(wsUrl);
      // socket.setRequestHeader("Authorization", `Bearer ${token}`);

      socket.onopen = () => {
        console.log("Notification WebSocket connected");
        setSocketState((prevState) => ({
          ...prevState,
          isConnected: true,
        }));

        // Gửi ping định kỳ để giữ kết nối
        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // 30 giây
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Xử lý tin nhắn dựa trên loại
          if (data.type === "notification") {
            const notificationData = JSON.parse(data.data);
            console.log("New notification received:", notificationData);
            
            // Cập nhật state với thông báo mới
            setSocketState((prevState) => ({
              ...prevState,
              hasNewNotification: true,
              newNotificationCount: prevState.newNotificationCount + 1,
              latestNotification: notificationData,
            }));
          } else if (data.type === "pong") {
            // Xử lý phản hồi ping
            console.log("Pong received from server");
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log("Notification WebSocket disconnected, reconnecting...", event.code, event.reason);
        setSocketState((prevState) => ({
          ...prevState,
          isConnected: false,
        }));

        // Dọn dẹp interval
        clearInterval(pingInterval);

        // Thử kết nối lại sau 5 giây
        reconnectTimeout = setTimeout(connectSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectSocket();

    // Cleanup khi component unmount
    return () => {
      if (socket) {
        socket.close();
      }
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return {
    ...socketState,
    resetNewNotificationFlag,
  };
}