
// Generic types used across the application

export interface Images {
  id: number;
}

export interface UserDetails {
  id: number;
  username: string;
  display_name?: string;
  avatar?: string;
}

export interface Collection {
  id: number;
  name: string;
  cover_image?: string;
  description?: string;
  is_public: boolean;
  images?: number[];
}
