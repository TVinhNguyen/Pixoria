'use client';

import { useState, useEffect } from 'react';

// Hook để xử lý localStorage trong các ứng dụng Next.js 
// với server-side rendering
export function useLocalStorage(key: string, defaultValue: any) {
  // Khởi tạo state với defaultValue
  const [value, setValue] = useState(defaultValue);
  // State để biết khi nào đã ở client-side
  const [isClient, setIsClient] = useState(false);

  // Trong lần render đầu tiên ở client, đọc giá trị từ localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        setValue(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Hàm để cập nhật cả state và localStorage
  const setStoredValue = (newValue: any) => {
    try {
      setValue(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, newValue);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue, isClient];
}
