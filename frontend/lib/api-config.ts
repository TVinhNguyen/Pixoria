// Use a relative path as fallback instead of hardcoded localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default API_BASE_URL;