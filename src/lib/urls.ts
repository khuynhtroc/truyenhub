export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://doctruyen.vip');

export function storyPath(slug: string): string {
  const clean = slug.replace(/^\/|\/$/g, '');
  return `/truyen/${clean}`;
}

export function chapterPath(storySlug: string, chapterSlug: string): string {
  return `/truyen/${storySlug.replace(/^\/|\/$/g, '')}/${chapterSlug.replace(/^\/|\/$/g, '')}`;
}

export function blogPath(slug: string): string {
  return `/blog/${slug.replace(/^\/|\/$/g, '')}`;
}

export function postPath(postOrSlug: any): string {
  if (!postOrSlug) return '/';
  if (typeof postOrSlug === 'object') {
    const slug = (postOrSlug.slug || '').replace(/^\/|\/$/g, '');
    if (postOrSlug.category === 'blog' || postOrSlug.type === 'blog') {
      return `/blog/${slug}`;
    }
    return `/truyen/${slug}`;
  }
  const str = String(postOrSlug).replace(/^\/|\/$/g, '');
  if (str.startsWith('blog/') || str.startsWith('truyen/')) {
    return `/${str}`;
  }
  return `/truyen/${str}`;
}

export function absoluteStoryUrl(slug: string): string {
  return `${SITE_URL}${storyPath(slug)}`;
}

export function absolutePostUrl(postOrSlug: any): string {
  const slug = typeof postOrSlug === 'string' ? postOrSlug : postOrSlug?.slug || '';
  return `${SITE_URL}${postPath(slug)}`;
}

export function slugify(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
