export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  blogCount?: number;
}

export interface BlogAuthor {
  id: string;
  name: string;
  avatar: string | null;
  userType: string;
  storeName?: string | null;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  thumbnail: string | null;
  status: string;
  views: number;
  readTime: number;
  author: BlogAuthor | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogResponse {
  blogs: Blog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
