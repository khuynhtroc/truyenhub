-- ==============================================================================
-- SCHEMA DOCTRUYEN.VIP (Project: bqvffeqjgjtzprouwshd)
-- Tối ưu hóa cho Vercel + Supabase + Cloudflare R2
-- ==============================================================================

-- Bật Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    coins_balance INT DEFAULT 1000 CHECK (coins_balance >= 0),
    vip_until TIMESTAMPTZ DEFAULT NULL,
    vip_level INT DEFAULT 0,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'vip', 'member')),
    source VARCHAR(50) DEFAULT 'web', -- Nguồn: web, app_ios, app_android, facebook, google
    bank_account_no VARCHAR(50),
    bank_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger tự động tạo profile khi user đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, coins_balance, role, source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    1000, -- Tặng 1000 xu tân thủ
    'member',
    COALESCE(NEW.raw_user_meta_data->>'source', 'web')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. BẢNG TRUYỆN (STORIES)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('comic', 'novel')), -- 'comic': truyện tranh, 'novel': truyện chữ
    description TEXT,
    cover_url TEXT NOT NULL,
    author_name VARCHAR(150) DEFAULT 'Đang cập nhật',
    status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    genres TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_views BIGINT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_chapters INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_slug ON public.stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_type ON public.stories(type);
CREATE INDEX IF NOT EXISTS idx_stories_views ON public.stories(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_stories_likes ON public.stories(total_likes DESC);

-- 3. BẢNG CHƯƠNG (CHAPTERS)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_number NUMERIC(7, 2) NOT NULL,
    title VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    price_coins INT DEFAULT 0 CHECK (price_coins >= 0),
    content_text TEXT DEFAULT NULL,       -- Truyện chữ
    pages_images JSONB DEFAULT NULL,      -- Truyện tranh (mảng link ảnh Cloudflare R2)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_story_chapter UNIQUE(story_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_story_number ON public.chapters(story_id, chapter_number);

-- 4. BẢNG BÀI VIẾT, BLOG & TRANG CHÍNH SÁCH (POSTS)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) DEFAULT 'blog' CHECK (type IN ('blog', 'page', 'review', 'spoil', 'comingsoon', 'notice')),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content_html TEXT,
    hero_image TEXT,
    hero_alt TEXT,
    category_name VARCHAR(100),
    author_name VARCHAR(100) DEFAULT 'Ban Biên Tập DocTruyen',
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'trash')),
    focus_keyword VARCHAR(150),
    seo_title VARCHAR(255),
    seo_description TEXT,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- 5. BẢNG CÀI ĐẶT HỆ THỐNG (SETTINGS)
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG QUẢN LÝ MEDIA (MEDIA)
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    original_name TEXT,
    url TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'cloudflare_r2',
    size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT 'image/webp',
    width INT,
    height INT,
    alt_text TEXT,
    remote_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG BÌNH LUẬN (COMMENTS)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(100) DEFAULT 'Độc giả vô danh',
    avatar_url TEXT,
    content TEXT NOT NULL,
    is_spoiler BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'spam', 'trash')),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_story ON public.comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter ON public.comments(chapter_id);

-- 8. BẢNG BÁO CÁO LỖI TRUYỆN/CHƯƠNG (REPORTS)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    story_title VARCHAR(255),
    chapter_title VARCHAR(255),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(100) DEFAULT 'Ẩn danh',
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('image_broken', 'text_error', 'wrong_chapter', 'audio_broken', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 9. BẢNG TỦ TRUYỆN & TIẾN ĐỘ ĐỌC (READING_HISTORY)
CREATE TABLE IF NOT EXISTS public.reading_history (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    last_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    progress_percent INT DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, story_id)
);

-- 10. BẢNG MỞ KHÓA CHƯƠNG (UNLOCKED_CHAPTERS)
CREATE TABLE IF NOT EXISTS public.unlocked_chapters (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    coins_spent INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, chapter_id)
);

-- 11. BẢNG GIAO DỊCH NẠP XU (COIN_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_vnd INT NOT NULL,
    coins_added INT NOT NULL,
    order_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. HÀM MỞ KHÓA CHƯƠNG BẰNG XU (TRANSACTION AN TOÀN)
CREATE OR REPLACE FUNCTION public.unlock_chapter_with_coins(
    p_user_id UUID,
    p_chapter_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_price INT;
    v_balance INT;
    v_is_locked BOOLEAN;
    v_already_unlocked BOOLEAN;
    v_vip_until TIMESTAMPTZ;
BEGIN
    SELECT is_locked, price_coins INTO v_is_locked, v_price 
    FROM public.chapters WHERE id = p_chapter_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Chương không tồn tại');
    END IF;

    IF NOT v_is_locked OR v_price = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Chương miễn phí');
    END IF;

    SELECT vip_until, coins_balance INTO v_vip_until, v_balance
    FROM public.profiles WHERE id = p_user_id;

    IF v_vip_until IS NOT NULL AND v_vip_until > NOW() THEN
        RETURN jsonb_build_object('success', true, 'message', 'Tài khoản VIP miễn phí');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.unlocked_chapters 
        WHERE user_id = p_user_id AND chapter_id = p_chapter_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN jsonb_build_object('success', true, 'message', 'Chương đã mở khóa trước đó');
    END IF;

    IF v_balance < v_price THEN
        RETURN jsonb_build_object('success', false, 'message', 'Số dư xu không đủ, vui lòng nạp thêm');
    END IF;

    UPDATE public.profiles 
    SET coins_balance = coins_balance - v_price 
    WHERE id = p_user_id;

    INSERT INTO public.unlocked_chapters (user_id, chapter_id, coins_spent)
    VALUES (p_user_id, p_chapter_id, v_price);

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Mở khóa thành công', 
        'remaining_coins', v_balance - v_price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. CẤU HÌNH ROW LEVEL SECURITY (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Read policies cho công khai
CREATE POLICY "Public stories read" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Public chapters meta read" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public posts read" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public settings read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public media read" ON public.media FOR SELECT USING (true);
CREATE POLICY "Public comments read" ON public.comments FOR SELECT USING (status = 'approved');

-- Policies cho User đã đăng nhập
CREATE POLICY "User read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User reading history manage" ON public.reading_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User unlocked chapters read" ON public.unlocked_chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User insert comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User submit report" ON public.reports FOR INSERT WITH CHECK (true);

-- Service Role (Full bypass RLS cho Backend API / Admin)
-- Mặc định Service Role Key của Supabase tự động bypass toàn bộ RLS
