
export interface TrendingItem {
  id: string;
  topic: string;
  source: 'Google News Sách & Truyện' | 'Anime News Network' | 'Book Riot' | 'Google Trends VN';
  traffic: string;
  newsHeadline: string;
  newsUrl: string;
  picture: string;
  pubDate: string;
  hoursAgo: number;
  score: number;
  storyAngle: string;
  giftAngle?: string; // backwards compatibility alias
  category: string;
}

/**
 * Parses XML text safely without external dependencies
 */
function extractTagContent(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const standardRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(standardRegex);
  return match ? match[1].trim() : '';
}

/**
 * Cleans HTML entities and tags from a string
 */
function cleanHtml(text: string): string {
  return (text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Calculates hours difference from a date string to now
 */
function getHoursAgo(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  } catch {
    return 12;
  }
}

/**
 * Strict negative keywords - any matching topic/headline is immediately DISCARDED (score = 0)
 */
const STRICT_EXCLUDE_KEYWORDS = [
  'boxing', 'bong da', 'bóng đá', 'the thao', 'thể thao', 'dam boc', 'đấm bốc', 'quyen anh', 'quyền anh',
  'canelo', 'alvarez', 'mbilli', 'dazn', 'ufc', 'mma', 'premier league', 'champions league', 'v-league',
  'brentford', 'roma', 'udinese', 'chelsea', 'arsenal', 'liverpool', 'man utd', 'barcelona', 'real madrid',
  'ca si', 'ca sĩ', 'hoa hau', 'hoa hậu', 'showbiz', 'scandal', 'tai nan', 'tai nạn', 'vu an', 'vụ án',
  'bat giu', 'bắt giữ', 'tu hinh', 'tử hình', 'giet nguoi', 'giết người', 'lua dao', 'lừa đảo', 'ma tuy', 'ma túy',
  'sneaker', 'giay dep', 'giày dép', 'my pham', 'mỹ phẩm', 'thoi trang', 'thời trang', 'giam gia', 'sale off',
  'court', 'murder', 'shooting', 'trial', 'arrested', 'lawsuit', 'funeral', 'crash', 'killed'
];

/**
 * Positive book / comic / manga / novel keywords
 */
const BOOK_COMIC_KEYWORDS = [
  'sách', 'truyện', 'truyen', 'manga', 'anime', 'webtoon', 'manhwa', 'comic', 'tiểu thuyết', 'tieu thuyet',
  'văn học', 'van hoc', 'tác giả', 'tac gia', 'light novel', 'bestseller', 'xuất bản', 'xuat ban', 'chuyển thể',
  'chuyen the', 'tập mới', 'tap moi', 'ngoại truyện', 'nhân vật', 'cốt truyện', 'cot truyen', 'review',
  'spoil', 'book', 'novel', 'author', 'fiction', 'literature', 'adaptation', 'volume', 'chapter', 'mangaka',
  'trinh thám', 'kinh dị', 'tiên hiệp', 'kiếm hiệp', 'ngôn tình', 'huyền huyễn', 'xuyên không', 'hồi ký'
];

/**
 * Evaluates Book & Comic virality score (0 - 100)
 */
function evaluateBookComicScore(
  topic: string,
  headline: string,
  traffic: string,
  hoursAgo: number,
  isSpecializedFeed: boolean
): { score: number; storyAngle: string; category: string } | null {
  const text = `${topic} ${headline}`.toLowerCase();

  // 1. Strict Exclude Check
  for (const neg of STRICT_EXCLUDE_KEYWORDS) {
    if (text.includes(neg)) {
      return null; // Immediately discard
    }
  }

  // 2. Count positive book/comic matches
  let matches = 0;
  for (const kw of BOOK_COMIC_KEYWORDS) {
    if (text.includes(kw)) matches++;
  }

  // If general feed (e.g. Google Trends VN) has 0 book keywords, discard it!
  if (!isSpecializedFeed && matches === 0) {
    return null;
  }

  let score = 55;

  // Keyword relevance bonus
  score += Math.min(30, matches * 8);

  // Freshness bonus (Gold window: 1 to 24 hours)
  if (hoursAgo >= 1 && hoursAgo <= 12) score += 15;
  else if (hoursAgo <= 24) score += 10;
  else if (hoursAgo <= 48) score += 5;
  else score -= 10;

  // Traffic / Velocity bonus
  if (traffic.includes('100K+') || traffic.includes('200K+')) score += 20;
  else if (traffic.includes('50K+')) score += 15;
  else if (traffic.includes('20K+') || traffic.includes('Manga Hot')) score += 12;
  else if (traffic.includes('10K+') || traffic.includes('Xu Hướng Độc Giả')) score += 10;

  score = Math.max(20, Math.min(99, score));

  // Determine Category & Story Angle
  let category = 'Sách & Văn Học';
  let storyAngle = `Điểm nhấn nội dung và góc nhìn độc giả về tác phẩm "${topic}", đề xuất các tác phẩm hay cùng thể loại trên DocTruyen.VIP.`;

  if (text.includes('manga') || text.includes('anime') || text.includes('comic') || text.includes('webtoon') || text.includes('manhwa')) {
    category = 'Truyện Tranh & Manga';
    storyAngle = `Phân tích tình tiết mới nhất, sự kiện nổi bật xoay quanh "${topic}" và góc nhìn cộng đồng người hâm mộ truyện tranh.`;
  } else if (text.includes('tiểu thuyết') || text.includes('novel') || text.includes('light novel') || text.includes('tiên hiệp') || text.includes('ngôn tình')) {
    category = 'Tiểu Thuyết & Light Novel';
    storyAngle = `Khám phá chiều sâu cốt truyện, thế giới quan và tuyến nhân vật hấp dẫn của "${topic}".`;
  } else if (text.includes('chuyển thể') || text.includes('adaptation') || text.includes('phim')) {
    category = 'Tin Chuyển Thể & Phim';
    storyAngle = `So sánh nguyên tác với bản chuyển thể của "${topic}", phân tích những điểm cộng đáng chú ý dành cho fan nguyên tác.`;
  } else if (text.includes('trinh thám') || text.includes('kinh dị')) {
    category = 'Trinh Thám & Giật Gân';
    storyAngle = `Giải mã nút thắt cốt truyện và không khí hồi hộp, kịch tính làm nên sức hút của "${topic}".`;
  }

  return { score, storyAngle, category };
}

const FALLBACK_COVERS = [
  'https://media.doctruyen.vip/covers/doraemon-cover.webp',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80',
];

function getRandomFallbackCover(): string {
  return FALLBACK_COVERS[Math.floor(Math.random() * FALLBACK_COVERS.length)];
}

/**
 * 1. Fetch Realtime Book & Comic News from Google News VN
 */
export async function fetchGoogleNewsBooksVN(): Promise<TrendingItem[]> {
  try {
    const url = 'https://news.google.com/rss/search?q=(s%C3%A1ch+hay+OR+truy%E1%BB%87n+tranh+OR+manga+OR+anime+OR+ti%E1%BB%83u+thuy%E1%BA%BFt)&hl=vi&gl=VN&ceid=VN:vi';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Google News VN HTTP ${res.status}`);
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const items: TrendingItem[] = [];

    for (let i = 0; i < Math.min(itemMatches.length, 25); i++) {
      const itemXml = itemMatches[i];
      const rawTitle = cleanHtml(extractTagContent(itemXml, 'title'));
      const link = extractTagContent(itemXml, 'link');
      const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
      const hoursAgo = getHoursAgo(pubDate);

      // Clean topic from publisher suffix (e.g. "Title - VnExpress")
      const titleParts = rawTitle.split(' - ');
      const topic = titleParts.length > 1 ? titleParts.slice(0, -1).join(' - ').trim() : rawTitle;

      const evaluated = evaluateBookComicScore(topic, rawTitle, 'Xu Hướng Độc Giả', hoursAgo, true);
      if (!evaluated) continue;

      items.push({
        id: `gn-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50)}`,
        topic,
        source: 'Google News Sách & Truyện',
        traffic: 'Xu Hướng Độc Giả',
        newsHeadline: rawTitle,
        newsUrl: link,
        picture: getRandomFallbackCover(),
        pubDate,
        hoursAgo,
        score: evaluated.score,
        storyAngle: evaluated.storyAngle,
        giftAngle: evaluated.storyAngle,
        category: evaluated.category,
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Google News Books VN fetch error:', err.message);
    return [];
  }
}

/**
 * 2. Fetch Manga, Anime & Light Novel News from Anime News Network (ANN)
 */
export async function fetchAnimeNewsNetwork(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://www.animenewsnetwork.com/all/rss.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Anime News Network HTTP ${res.status}`);
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const items: TrendingItem[] = [];

    for (let i = 0; i < Math.min(itemMatches.length, 25); i++) {
      const itemXml = itemMatches[i];
      const title = cleanHtml(extractTagContent(itemXml, 'title'));
      const link = extractTagContent(itemXml, 'link');
      const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
      const hoursAgo = getHoursAgo(pubDate);

      // ANN media thumbnail
      const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      const picture = mediaMatch ? mediaMatch[1] : getRandomFallbackCover();

      const evaluated = evaluateBookComicScore(title, title, 'Manga/Anime Hot', hoursAgo, true);
      if (!evaluated) continue;

      items.push({
        id: `ann-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50)}`,
        topic: title,
        source: 'Anime News Network',
        traffic: 'Manga/Anime Hot',
        newsHeadline: title,
        newsUrl: link,
        picture,
        pubDate,
        hoursAgo,
        score: Math.min(99, evaluated.score + 5), // boost global manga releases
        storyAngle: evaluated.storyAngle,
        giftAngle: evaluated.storyAngle,
        category: evaluated.category,
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Anime News Network fetch error:', err.message);
    return [];
  }
}

/**
 * 3. Fetch Book & Adaptation News from Book Riot
 */
export async function fetchBookRiot(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://bookriot.com/feed/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Book Riot HTTP ${res.status}`);
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const items: TrendingItem[] = [];

    for (let i = 0; i < Math.min(itemMatches.length, 15); i++) {
      const itemXml = itemMatches[i];
      const title = cleanHtml(extractTagContent(itemXml, 'title'));
      const link = extractTagContent(itemXml, 'link');
      const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
      const hoursAgo = getHoursAgo(pubDate);

      const enclosureMatch = itemXml.match(/<enclosure\s+url=["']([^"']+)["']/i);
      const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      const picture = enclosureMatch ? enclosureMatch[1] : mediaMatch ? mediaMatch[1] : getRandomFallbackCover();

      const evaluated = evaluateBookComicScore(title, title, 'Văn Học Quốc Tế', hoursAgo, true);
      if (!evaluated) continue;

      items.push({
        id: `br-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50)}`,
        topic: title,
        source: 'Book Riot',
        traffic: 'Văn Học Quốc Tế',
        newsHeadline: title,
        newsUrl: link,
        picture,
        pubDate,
        hoursAgo,
        score: evaluated.score,
        storyAngle: evaluated.storyAngle,
        giftAngle: evaluated.storyAngle,
        category: evaluated.category,
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Book Riot fetch error:', err.message);
    return [];
  }
}

/**
 * 4. Fetch Book/Comic Trends from Google Trends VN (Strictly Filtered)
 */
export async function fetchGoogleTrendsBooksVN(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=VN', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Google Trends VN HTTP ${res.status}`);
    const xml = await res.text();
    const items: TrendingItem[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (let i = 0; i < itemMatches.length; i++) {
      const itemXml = itemMatches[i];
      const topic = cleanHtml(extractTagContent(itemXml, 'title'));
      const traffic = extractTagContent(itemXml, 'ht:approx_traffic') || '10K+';
      const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
      const newsHeadline = cleanHtml(extractTagContent(itemXml, 'ht:news_item_title')) || topic;
      const newsUrl = extractTagContent(itemXml, 'ht:news_item_url');
      const picture = extractTagContent(itemXml, 'ht:picture') || extractTagContent(itemXml, 'ht:news_item_picture') || getRandomFallbackCover();
      const hoursAgo = getHoursAgo(pubDate);

      // Google Trends VN is a general feed, so isSpecializedFeed = false
      // Only items matching book/comic/novel keywords will pass!
      const evaluated = evaluateBookComicScore(topic, newsHeadline, traffic, hoursAgo, false);
      if (!evaluated) continue;

      items.push({
        id: `gt-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50)}`,
        topic,
        source: 'Google Trends VN',
        traffic,
        newsHeadline,
        newsUrl,
        picture,
        pubDate,
        hoursAgo,
        score: evaluated.score,
        storyAngle: evaluated.storyAngle,
        giftAngle: evaluated.storyAngle,
        category: evaluated.category,
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Google Trends VN fetch error:', err.message);
    return [];
  }
}

/**
 * Combined Aggregator: Fetches, deduplicates, and ranks all trends across Book & Comic channels
 */
export async function scanAllLiveTrends(): Promise<TrendingItem[]> {
  const [googleNews, animeNews, bookRiot, googleTrends] = await Promise.all([
    fetchGoogleNewsBooksVN(),
    fetchAnimeNewsNetwork(),
    fetchBookRiot(),
    fetchGoogleTrendsBooksVN(),
  ]);

  const all = [...googleNews, ...animeNews, ...bookRiot, ...googleTrends];

  // Deduplicate by normalized topic name
  const seen = new Set<string>();
  const uniqueTrends: TrendingItem[] = [];

  for (const item of all) {
    const key = item.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueTrends.push(item);
  }

  // Sort descending by Virality Score
  uniqueTrends.sort((a, b) => b.score - a.score);

  return uniqueTrends;
}
