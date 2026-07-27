export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  isDefault: boolean;
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryQueryParams {
  search?: string;
  active?: boolean;
  type?: 'all' | 'default' | 'custom';
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  categoryId: string | null;
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelRequest {
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  categoryId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateLabelRequest {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  categoryId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface LabelQueryParams {
  search?: string;
  categoryId?: string;
  active?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export interface CategorySummary {
  total: number;
  active: number;
  inactive: number;
  custom: number;
}

export interface LabelSummary {
  total: number;
  withCategory: number;
  withoutCategory: number;
  unused: number;
}
