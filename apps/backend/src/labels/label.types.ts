import type { Category, Label } from '@prisma/client';

export type LabelWithCategory = Label & { category: Category | null };

export interface LabelResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string; icon: string } | null;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
