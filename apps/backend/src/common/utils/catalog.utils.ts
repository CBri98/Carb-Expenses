export function normalizeCatalogName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function catalogSlug(value: string): string {
  return normalizeCatalogName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function optionalText(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = value?.trim() ?? '';
  return normalized || null;
}
