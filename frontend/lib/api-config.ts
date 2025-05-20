// Safe access to localStorage (only in browser environment)
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pixoria.thahvinhdevops.online/api';

export default API_BASE_URL;

// Helper function for safer localStorage access
export const getToken = (): string | null => {
  const storage = getLocalStorage();
  return storage ? storage.getItem('token') : null;
};