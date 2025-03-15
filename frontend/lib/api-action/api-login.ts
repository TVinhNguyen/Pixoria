import API_BASE_URL from "../api-config"

export async function handleLoginClick(username: string, password: string) {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)
    const response_token = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        body: formData,
    })
    const data_token = await response_token.json()
    if (response_token.ok) {
        localStorage.setItem("token", data_token.access)
        localStorage.setItem("username", username)
        return data_token
    }
    return null
}

export async function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
}