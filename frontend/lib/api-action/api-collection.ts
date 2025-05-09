import API_BASE_URL from "../api-config"

export async function handleGetCollections() {
    const response = await fetch(`${API_BASE_URL}/collections/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error("Failed to fetch collections")
    }
    return await response.json()
}
export async function handleGetCollectionByUsername(username: string) {
    const response = await fetch(`${API_BASE_URL}/profile/${username}/collections/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error("Failed to fetch collections")
    }
    return await response.json()
}

export async function handleCreateCollection(name: string, description: string, is_public: boolean, cover_image: string) {
    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("is_public", String(is_public))
    formData.append("cover_image", cover_image)

    const response = await fetch(`${API_BASE_URL}/collections/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    })
    if (!response.ok) {
        throw new Error("Failed to create collection")
    }
    return await response.json()
}

export async function handleSaveImageToCollection(collectionId: string, imageId: number[]) {
    const getRes = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!getRes.ok) {
        throw new Error("Failed to fetch existing collection")
    }
    const collection = await getRes.json()
    const currentImageIds = collection.images || []
    const combinedImageIds = Array.from(new Set([...currentImageIds, ...imageId]))
    const patchRes = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          images: combinedImageIds,
        }),
    })
    if (!patchRes.ok) {
        throw new Error("Failed to update collection")
    }
    return await patchRes.json()
}

export async function handleGetCollectionById(username: string,collectionId: string ) {
    // Xác định URL dựa trên việc có username hay không
    let url = '';
    if (username && username.trim() !== '') {
        // Nếu có username, sử dụng URL theo profile
        url = `${API_BASE_URL}/profile/${username}/collections/${collectionId}/`;
    } else {
        // Nếu không có username, sử dụng URL mặc định
        url = `${API_BASE_URL}/collections/${collectionId}/`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch collection details");
    }
    
    return await response.json();
}

export async function handleUpdateCollection(collectionId: string, name: string, description: string, is_public: boolean) {
    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("is_public", String(is_public))

    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    })
    if (!response.ok) {
        throw new Error("Failed to update collection")
    }
    return await response.json()
}

export async function loadImagesFromCollection(username: string, collectionId: string) {
    // Xác định URL dựa trên việc có username hay không

    let url = '';
    if (username && username.trim() !== '') {
        // Nếu có username, sử dụng URL theo profile
        url = `${API_BASE_URL}/profile/${username}/collections/${collectionId}/`;
    } else {
        // Nếu không có username, sử dụng URL mặc định
        url = `${API_BASE_URL}/collections/${collectionId}/`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch collection details");
    }
    
    const data = await response.json();
    const imageIds = data.images;
    
    const imageDetails = await Promise.all(
        imageIds.map(async (imageId: number) => {
            const imageResponse = await fetch(`${API_BASE_URL}/images/${imageId}/?public=true`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!imageResponse.ok) {
                throw new Error("Failed to fetch image details");
            }
            return await imageResponse.json();
        })

    )
    return imageDetails
}

export async function handleRemoveImageFromCollection(collectionId: string, imageId: number) {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
    if (!response.ok) {
        throw new Error("Failed to delete collection")
    }
    const data = await response.json()
    const imageIds = data.images
    const updatedImageIds = imageIds.filter((id: number) => id !== imageId)
    const patchResponse = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
            images: updatedImageIds,
        }),
    })
    if (!patchResponse.ok) {
        throw new Error("Failed to update collection")
    }
    return await patchResponse.json()
}