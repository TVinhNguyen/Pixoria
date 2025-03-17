import API_BASE_URL from "../api-config"

export async function handleNotificationClick() {
    const response = await fetch(`${API_BASE_URL}/notifications/get-notifications/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error("Error fetching notifications!")
    }
    const data = await response.json()
    return data
}

export async function handleMarkedAllAsReadClick() {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-as-read/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error("Failed to mark notifications as read")
    }
    return await response.json()
}

export async function handleMarkAsRead(id: number) {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/mark-as-read/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error(`Failed to mark notification ${id} as read`)
    }
    return await response.json()
}