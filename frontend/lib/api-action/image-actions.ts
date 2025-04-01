import API_BASE_URL from "../api-config"

export async function handleLike(image_id: number) {
    const response = await fetch(`${API_BASE_URL}/images/${image_id}/like/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    })
    const data = await response.json()
    console.log(data)
    return data
}

export async function handleDownload(image_id: number) {
    const response = await fetch(`${API_BASE_URL}/images/${image_id}/download/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    })
    const data = await response.json()
    console.log(data)
    return data
}
