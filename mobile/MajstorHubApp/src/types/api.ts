export type Role = 'Client' | 'Craftsman' | 'Admin';
export type BookingStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface ServiceCategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CreateServiceCategoryRequest {
  name: string;
  description?: string;
}

export interface CraftsmanProfileResponse {
  userId: string;
  fullName: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  bio?: string;
  hourlyRate: number;
  yearsOfExperience?: number;
  latitude?: number;
  longitude?: number;
  addressText?: string;
  isAvailable: boolean;
  averageRating?: number;
  reviewCount: number;
}

export interface BookingResponse {
  id: string;
  clientId: string;
  clientName: string;
  craftsmanProfileId: string;
  craftsmanName: string;
  serviceCategoryName: string;
  description: string;
  address: string;
  scheduledAt?: string;
  status: BookingStatus;
  priceQuote?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  craftsmanProfileId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: 'Client' | 'Craftsman';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface CreateCraftsmanProfileRequest {
  serviceCategoryId: number;
  bio?: string;
  hourlyRate: number;
  yearsOfExperience?: number;
  latitude?: number;
  longitude?: number;
  addressText?: string;
}

export interface UpdateCraftsmanProfileRequest extends Partial<CreateCraftsmanProfileRequest> {
  isAvailable?: boolean;
}

export interface CreateBookingRequest {
  craftsmanProfileId: string;
  serviceCategoryId: number;
  description: string;
  address: string;
  scheduledAt?: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}
