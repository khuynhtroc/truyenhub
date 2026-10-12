-- ========================================================
-- SCHEMA TRUYENHUB: COMIC & NOVEL PLATFORM
-- Tối ưu hóa cho Vercel + Supabase + Cloudflare R2
-- ========================================================

-- Bật extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
-- Đồng bộ tự động với bảng auth.users của Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    coins_balance INT DEFAULT 0 CHECK (coins_balance >= 0),
    vip_until TIMESTAMPTZ DEFAULT NULL,
    vip_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger tự động tạo profile khi user đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, coins_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    10 -- Tặng 10 xu chào mừng thành viên mới
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

-- 3. BẢNG CHƯƠNG (CHAPTERS)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_number NUMERIC(7, 2) NOT NULL,
    title VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    price_coins INT DEFAULT 0 CHECK (price_coins >= 0),
    
    -- Dành cho Truyện chữ: Lưu toàn bộ văn bản chương
    content_text TEXT DEFAULT NULL,
    
    -- Dành cho Truyện tranh: Lưu mảng JSON chứa các link ảnh WebP trên Cloudflare R2
    pages_images JSONB DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_story_chapter UNIQUE(story_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_story_number ON public.chapters(story_id, chapter_number);

-- 4. BẢNG LƯU VẾT CHƯƠNG ĐÃ MỞ KHÓA (UNLOCKED_CHAPTERS)
CREATE TABLE IF NOT EXISTS public.unlocked_chapters (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    coins_spent INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, chapter_id)
);

-- 5. BẢNG TIẾN ĐỘ ĐỌC / TỦ TRUYỆN (READING_HISTORY & BOOKMARKS)
CREATE TABLE IF NOT EXISTS public.reading_history (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    last_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    progress_percent INT DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, story_id)
);

-- 6. BẢNG GIAO DỊCH NẠP XU (COIN_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_vnd INT NOT NULL,
    coins_added INT NOT NULL,
    order_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FUNCTION & TRANSACTION TRỪ XU VÀ MỞ KHÓA CHƯƠNG AN TOÀN
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
    -- Kiểm tra trạng thái chương
    SELECT is_locked, price_coins INTO v_is_locked, v_price 
    FROM public.chapters WHERE id = p_chapter_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Chương không tồn tại');
    END IF;

    -- Nếu chương miễn phí
    IF NOT v_is_locked OR v_price = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Chương miễn phí');
    END IF;

    -- Kiểm tra VIP
    SELECT vip_until, coins_balance INTO v_vip_until, v_balance
    FROM public.profiles WHERE id = p_user_id;

    IF v_vip_until IS NOT NULL AND v_vip_until > NOW() THEN
        RETURN jsonb_build_object('success', true, 'message', 'Tài khoản VIP miễn phí');
    END IF;

    -- Kiểm tra đã mua chưa
    SELECT EXISTS(
        SELECT 1 FROM public.unlocked_chapters 
        WHERE user_id = p_user_id AND chapter_id = p_chapter_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN jsonb_build_object('success', true, 'message', 'Chương đã mở khóa trước đó');
    END IF;

    -- Kiểm tra số dư
    IF v_balance < v_price THEN
        RETURN jsonb_build_object('success', false, 'message', 'Số dư xu không đủ, vui lòng nạp thêm');
    END IF;

    -- Trừ xu và ghi nhận mở khóa trong cùng 1 transaction
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

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Ai cũng xem được danh sách truyện
CREATE POLICY "Public stories read" ON public.stories FOR SELECT USING (true);

-- Ai cũng xem được danh sách chương (chỉ trường meta, bảo vệ content)
CREATE POLICY "Public chapters meta read" ON public.chapters FOR SELECT USING (true);

-- User chỉ xem profile của chính mình
CREATE POLICY "User read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- User chỉ đọc lịch sử của chính mình
CREATE POLICY "User reading history read" ON public.reading_history FOR ALL USING (auth.uid() = user_id);
