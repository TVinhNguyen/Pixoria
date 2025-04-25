"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import API_BASE_URL from "../lib/api-config";

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
  
  // Track processed message IDs to prevent duplicate notifications
  const processedMessageIds = useRef<Set<string>>(new Set());

  const resetNewNotificationFlag = useCallback(() => {
    setSocketState((prevState) => ({
      ...prevState,
      hasNewNotification: false,
      newNotificationCount: 0,
    }));
  }, []);

  // Function to check if token is valid
  const isValidToken = useCallback((token: string | null): boolean => {
    if (!token) return false;
    
    try {
      // Get the payload part of the JWT token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      console.error("Error checking token validity:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectSocket = () => {
      // Chỉ kết nối nếu người dùng đã đăng nhập (có token hợp lệ)
      const token = localStorage.getItem("token");
      if (!isValidToken(token)) {
        console.log("No valid token found, won't connect WebSocket");
        return;
      }

      // Extract backend host from API_BASE_URL - if API is at http://localhost:8000/api, 
      // WebSocket should be at ws://localhost:8000/ws
      let wsHost = '';
      try {
        const apiUrl = new URL(API_BASE_URL);
        wsHost = apiUrl.host; // e.g. localhost:8000
      } catch (e) {
        // Fallback: use current host if API_BASE_URL is invalid or relative
        wsHost = window.location.host;
      }
      
      // Determine WebSocket protocol
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Construct WebSocket URL with correct backend port and path
      const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications/?token=${token}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);

      // Close existing socket if open
      if (socket) {
        socket.close();
      }

      // Create WebSocket connection
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("Notification WebSocket connected successfully");
        setSocketState((prevState) => ({
          ...prevState,
          isConnected: true,
        }));

        // Reset reconnect counter on successful connection
        reconnectAttempts = 0;

        // Send ping every 25 seconds (server sends heartbeat every 30s)
        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === "notification") {
            // Check for duplicate messages using message_id
            const messageId = data.message_id;
            if (messageId && processedMessageIds.current.has(messageId)) {
              console.log(`Ignoring duplicate notification with message_id: ${messageId}`);
              return;
            }
            
            // Add message_id to processed set to prevent future duplicates
            if (messageId) {
              processedMessageIds.current.add(messageId);
              
              // Limit the size of the set to avoid memory leaks
              if (processedMessageIds.current.size > 500) {
                // Convert to array, slice to keep only the most recent 300 entries, then back to Set
                const idsArray = Array.from(processedMessageIds.current);
                processedMessageIds.current = new Set(idsArray.slice(-300));
              }
            }
            
            const notificationData = typeof data.data === 'string' 
              ? JSON.parse(data.data) 
              : data.data;
              
            console.log("New notification received:", notificationData);
            
            // Update state with new notification
            setSocketState((prevState) => ({
              ...prevState,
              hasNewNotification: true,
              newNotificationCount: prevState.newNotificationCount + 1,
              latestNotification: notificationData,
            }));
          } else if (data.type === "pong") {
            console.log("Pong received from server");
          } else if (data.type === "heartbeat") {
            console.log("Heartbeat received from server");
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket closed with code ${event.code}. Reason: ${event.reason}`);
        setSocketState((prevState) => ({
          ...prevState,
          isConnected: false,
        }));

        // Clean up intervals
        clearInterval(pingInterval);
        
        // Check if we should attempt reconnection
        reconnectAttempts++;
        
        if (reconnectAttempts <= maxReconnectAttempts) {
          // Calculate backoff time - increases with each attempt
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting to reconnect in ${backoffTime/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimeout = setTimeout(connectSocket, backoffTime);
        } else {
          console.log("Max reconnection attempts reached. Please refresh the page to try again.");
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    // Start connection process
    connectSocket();

    // Set up reconnection on focus (user comes back to page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          (!socket || socket.readyState !== WebSocket.OPEN)) {
        console.log("Page is visible again, reconnecting WebSocket");
        reconnectAttempts = 0; // Reset reconnect attempts
        connectSocket();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isValidToken]);

  return {
    ...socketState,
    resetNewNotificationFlag,
  };
}