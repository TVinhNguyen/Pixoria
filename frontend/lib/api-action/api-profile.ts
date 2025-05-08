import API_BASE_URL from "../api-config"

export async function handleProfileClick(username: string) {
    const response = await fetch(`${API_BASE_URL}/profile/get-profile/?username=${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    })
    const data = await response.json()
    const profileData = {
        "username": data.user.username,
        "display_name": data.display_name,
        "avatar": data.avatar,
        "bio": data.bio,
        "followers": data.followers_count,
        "following": data.following_count,
        "photos": data.photos_count,
        "social_link": data.social_link,
        "created_at": data.created_at
    }
    console.log(data)
    localStorage.setItem("profile_id", data.id)
    localStorage.setItem("user_id", data.user.id)
    return profileData
}

export async function handleProfileEdit(formData: any) {
    const profile_id = localStorage.getItem("profile_id")
    const response = await fetch(`${API_BASE_URL}/profile/${profile_id}/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData
    })
    const data = await response.json()
    console.log(data)
    return data
}

export async function loadAllUploadedImages() {
    const username = localStorage.getItem("username")
    const response = await fetch(`${API_BASE_URL}/images/user/${username}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
    })
    const data = await response.json()
    console.log(data)
    return data
}

export async function loadAllLikedImages() {
    const response = await fetch(`${API_BASE_URL}/liked-image/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
    })
    const data = await response.json()
    return data
}

export async function loadAllDownloadedImages() {
    const response = await fetch(`${API_BASE_URL}/downloaded-image/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
    })
    const data = await response.json()
    return data
}