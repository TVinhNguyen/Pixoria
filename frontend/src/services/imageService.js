import axiosInstance from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

export const getImages = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.images.list, {
    params,
  });
  return response.data;
};

export const getImageById = async (id) => {
  const response = await axiosInstance.get(API_ENDPOINTS.images.detail(id));
  return response.data;
};

export const uploadImage = async (imageData) => {
  const formData = new FormData();
  formData.append("image", imageData.file);
  formData.append("title", imageData.title);
  formData.append("description", imageData.description);

  const response = await axiosInstance.post(
    API_ENDPOINTS.images.upload,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
