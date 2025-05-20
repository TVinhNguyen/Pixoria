import API_BASE_URL from '../api-config';

export const handleNotificationClick = async (
  params: { page?: number; limit?: number; unread?: boolean } = {}
) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.unread) queryParams.append('unread', 'true');
  const response = await fetch(
    `${API_BASE_URL}/notifications/get-notifications/?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (!response.ok) {
    if (response.status === 403) throw new Error('Not authenticated');
    throw new Error(`HTTP error: ${response.status}`);
  }
  const data = await response.json();
  console.log('Fetched notifications:', data);
  return data.results;
};

export async function handleMarkedAllAsReadClick() {
  const response = await fetch(
    `${API_BASE_URL}/notifications/mark-all-as-read/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  if (!response.ok) {
    throw new Error('Failed to mark notifications as read');
  }
  return await response.json();
}

export async function handleMarkAsRead(id: number) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${id}/mark-as-read/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to mark notification ${id} as read`);
  }
  return await response.json();
}

export async function getUnreadNotificationCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/count/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Error fetching notification count');
    }
    const data = await response.json();
    return data.unread_count;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return 0;
  }
}
