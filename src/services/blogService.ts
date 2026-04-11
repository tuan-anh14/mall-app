import { api } from './api';
import { Blog, BlogCategory, BlogResponse } from '@typings/blog';

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const blogService = {
  getPublished: async (params: BlogQueryParams = {}): Promise<BlogResponse> => {
    // Backend: @Get('blogs')
    const res = await api.get<BlogResponse>('/api/v1/blogs', { params });
    return res.data;
  },

  getCategories: async (): Promise<BlogCategory[]> => {
    // Backend: @Get('blog-categories')
    const res = await api.get<BlogCategory[]>('/api/v1/blog-categories');
    return res.data;
  },

  getBlogBySlug: async (slug: string): Promise<{ blog: Blog; related: Blog[] }> => {
    // Backend: @Get('blogs/:slug')
    const res = await api.get<{ blog: Blog; related: Blog[] }>(`/api/v1/blogs/${slug}`);
    return res.data;
  },
};
