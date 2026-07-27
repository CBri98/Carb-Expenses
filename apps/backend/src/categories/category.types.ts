import type { Category, UserCategoryPreference } from '@prisma/client';

export interface CategoryResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryWithPreferences = Category & {
  preferences: UserCategoryPreference[];
};

export interface CategorySummary {
  total: number;
  active: number;
  inactive: number;
  custom: number;
}
