export type Role = 'Client' | 'Craftsman' | 'Admin';
export type BookingStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  country?: string;
  profileImageUrl?: string;
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
  isApproved: boolean;
}

export interface CreateServiceCategoryRequest {
  name: string;
  description?: string;
}

export type UpdateServiceCategoryRequest = Partial<CreateServiceCategoryRequest>;

export interface CraftsmanProfileResponse {
  userId: string;
  fullName: string;
  profileImageUrl?: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  businessName?: string;
  bio?: string;
  hourlyRate: number;
  yearsOfExperience?: number;
  latitude?: number;
  longitude?: number;
  addressText?: string;
  isAvailable: boolean;
  isVerified: boolean;
  averageRating?: number;
  reviewCount: number;
  createdAt: string;
}

export interface BookingResponse {
  id: string;
  clientId: string;
  clientName: string;
  clientProfileImageUrl?: string;
  craftsmanProfileId: string;
  craftsmanName: string;
  craftsmanProfileImageUrl?: string;
  serviceCategoryName: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photoUrls: string[];
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
  firstName: string;
  lastName: string;
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
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  country?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateCraftsmanProfileRequest {
  serviceCategoryId: number;
  businessName?: string;
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
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}
