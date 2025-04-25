import API_BASE_URL from "../api-config"

export async function handleSignupClick(username: string, password: string, email: string) {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)
    formData.append("email", email)
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: "POST",
        body: formData,
    })
    const data = await response.json()
    if (response.ok) {
        return data
    }
    return null
}