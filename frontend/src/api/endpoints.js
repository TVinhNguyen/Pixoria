const BASE_URL = "http://localhost:8000/api";

const endpoints = {
  LOGIN: `${BASE_URL}/auth/login/`,
  REGISTER: `${BASE_URL}/auth/register/`,
  USERS: `${BASE_URL}/users/`,
  CATEGORIES: `${BASE_URL}/categories/`,
  IMAGES: `${BASE_URL}/images/`,
  COLLECTIONS: `${BASE_URL}/collections/`,
  PROFILE: `${BASE_URL}/profile/`, // Thêm endpoint cho hồ sơ người dùng
};

export default endpoints;
