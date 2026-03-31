export interface ReviewUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ReviewReply {
  id: string;
  comment: string;
  images: string[];
  createdAt: string;
  user: ReviewUser | null;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  images: string[];
  emoji: string | null;
  helpful: number;
  user: ReviewUser | null;
  createdAt: string;
  updatedAt: string;
  replies: ReviewReply[];
}

export interface ReviewSummary {
  ratingAverage: number;
  reviewCount: number;
  breakdown: Record<string, number>; // "1"–"5" → count
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ReviewSummary;
}

export interface ReviewEligibility {
  review: Review | null;
  canReview: boolean;
}
