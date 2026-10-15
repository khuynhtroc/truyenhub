"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Users,
  Settings,
  BarChart3,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Globe,
  Database,
  ArrowRight,
  Upload,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Bookmark,
  RotateCcw,
  CheckSquare,
  Square,
  Download,
  Filter,
  SlidersHorizontal,
  Palette,
  QrCode,
  Smartphone,
  HelpCircle,
  Copy,
  Check,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  Zap,
  Share2,
} from "lucide-react";
import { AdminAiSeoModal } from "@/components/admin/AdminAiSeoModal";
import { AdminBookImportModal } from "@/components/admin/AdminBookImportModal";
import { AdminBuffModal } from "@/components/admin/AdminBuffModal";
import { AdminBlogModal } from "@/components/admin/AdminBlogModal";
import { AdminReportsSection } from "@/components/admin/AdminReportsSection";
import { AdminSocialSection } from "@/components/admin/AdminSocialSection";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "stories"
    | "books"
    | "chapters"
    | "blogs"
    | "posts"
    | "media"
    | "comments"
    | "users"
    | "import"
    | "trash"
    | "social"
    | "settings"
  >("overview");

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Stories state
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStoriesCount, setTotalStoriesCount] = useState(0);

  // Bulk Selection State
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // AI SEO Modal State
  const [aiSeoModalOpen, setAiSeoModalOpen] = useState(false);
  const [targetAiStory, setTargetAiStory] = useState<any>(null);

  // Buff Views & Likes Modal State
  const [buffModalOpen, setBuffModalOpen] = useState(false);
  const [targetBuffStory, setTargetBuffStory] = useState<any>(null);

  // Story edit/create modal
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [storyForm, setStoryForm] = useState({
    title: "",
    slug: "",
    type: "comic",
    author_name: "",
    description: "",
    cover_url: "",
    status: "ongoing",
    genres: "",
    seo_title: "",
    seo_description: "",
    focus_keyword: "",
  });

  // Books State (dedicated tab)
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksPage, setBooksPage] = useState(1);
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const [showBookImportModal, setShowBookImportModal] = useState(false);

  // Blogs State (dedicated tab)
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  // Chapters state
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [chapterForm, setChapterForm] = useState({
    chapter_number: "",
    title: "",
    is_locked: false,
    price_coins: 0,
    content_text: "",
    pages_images_str: "",
  });

  // Posts / Pages State
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postTypeFilter, setPostTypeFilter] = useState<string>("page");
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    type: "page",
    excerpt: "",
    content_html: "",
    status: "published",
    seo_title: "",
    seo_description: "",
    focus_keyword: "",
  });

  // Media Library State
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [newMediaForm, setNewMediaForm] = useState({
    name: "",
    url: "",
    alt_text: "",
  });
  const [copiedMediaUrl, setCopiedMediaUrl] = useState<string | null>(null);

  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentSearch, setCommentSearch] = useState("");

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userCoinsModal, setUserCoinsModal] = useState<any>(null);
  const [coinAmount, setCoinAmount] = useState(100);
  const [userVipFilter, setUserVipFilter] = useState<string>("");
  const [userSourceFilter, setUserSourceFilter] = useState<string>("");

  // Dynamic VietQR Generator
  const [qrModalUser, setQrModalUser] = useState<any>(null);
  const [qrAmount, setQrAmount] = useState<number>(50000);

  // Trash Bin State
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);

  // Bulk Import State
  const [importType, setImportType] = useState<"json" | "text" | "chapters">("json");
  const [importJsonText, setImportJsonText] = useState("");
  const [importLinesText, setImportLinesText] = useState("");
  const [importStatusMsg, setImportStatusMsg] = useState("");
  const [importing, setImporting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Check stored admin session
  useEffect(() => {
    const saved = sessionStorage.getItem("doctruyen_admin_auth");
    if (saved === "ok") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "Saoday@93";
    if (passcode === validPasscode || passcode === "Saoday@93") {
      setIsAuthenticated(true);
      sessionStorage.setItem("doctruyen_admin_auth", "ok");
      setAuthError("");
    } else {
      setAuthError("Mật mã quản trị không chính xác.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("doctruyen_admin_auth");
    setIsAuthenticated(false);
  };

  // Initial Data Fetching when Authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStats();
    if (activeTab === "overview") fetchStats();
    if (activeTab === "stories") fetchStories(1);
    if (activeTab === "books") fetchBooks(1);
    if (activeTab === "blogs") fetchBlogs();
    if (activeTab === "posts") fetchPosts();
    if (activeTab === "media") fetchMedia();
    if (activeTab === "comments") fetchComments();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "trash") fetchTrash();
    if (activeTab === "settings" || activeTab === "social") fetchSettings();
  }, [isAuthenticated, activeTab]);

  // 1. Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Stories
  const fetchStories = async (page = 1) => {
    setLoadingStories(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        q: searchQuery,
        sort: sortOrder,
      });
      if (typeFilter) params.set("type", typeFilter);
      if (genreFilter) params.set("genre", genreFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/stories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories);
        setTotalPages(data.totalPages);
        setTotalStoriesCount(data.total);
        setCurrentPage(page);
        setSelectedStoryIds([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStories(false);
    }
  };

  // 3. Fetch Books
  const fetchBooks = async (page = 1) => {
    setLoadingBooks(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        type: "book",
        q: searchQuery,
      });
      const res = await fetch(`/api/admin/stories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.stories);
        setTotalBooksCount(data.total);
        setBooksPage(page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBooks(false);
    }
  };

  // 4. Fetch Chapters
  const fetchChapters = async (storyId: string) => {
    setLoadingChapters(true);
    try {
      const res = await fetch(`/api/admin/chapters?story_id=${storyId}`);
      const data = await res.json();
      if (data.success) {
        setChapters(data.chapters);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChapters(false);
    }
  };

  // 5. Fetch Posts / Pages
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/admin/posts?type=${postTypeFilter}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  // 5b. Fetch Blogs (Reviews, Spoil, Coming Soon, Notice)
  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await fetch("/api/admin/posts?type=blog");
      const data = await res.json();
      if (data.success) {
        setBlogs(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // 6. Fetch Media
  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/admin/media?q=${encodeURIComponent(mediaSearch)}`);
      const data = await res.json();
      if (data.success) {
        setMediaList(data.media);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMedia(false);
    }
  };

  // 7. Fetch Comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/admin/comments?q=${encodeURIComponent(commentSearch)}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  // 8. Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 9. Fetch Trash
  const fetchTrash = async () => {
    setLoadingTrash(true);
    try {
      const res = await fetch("/api/admin/stories?status=trash&limit=50");
      const data = await res.json();
      if (data.success) {
        setTrashItems(data.stories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrash(false);
    }
  };

  // 10. Fetch Settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã lưu toàn bộ cấu hình website thành công!");
      } else {
        alert(data.error || "Lỗi lưu cấu hình");
      }
    } catch (e: any) {
      alert(e.message || "Lỗi kết nối");
    } finally {
      setSavingSettings(false);
    }
  };

  // Bulk Actions
  const toggleSelectStory = (id: string) => {
    if (selectedStoryIds.includes(id)) {
      setSelectedStoryIds(selectedStoryIds.filter((item) => item !== id));
    } else {
      setSelectedStoryIds([...selectedStoryIds, id]);
    }
  };

  const toggleSelectAllOnPage = () => {
    if (selectedStoryIds.length === stories.length && stories.length > 0) {
      setSelectedStoryIds([]);
    } else {
      setSelectedStoryIds(stories.map((s) => s.id));
    }
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedStoryIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn đưa ${selectedStoryIds.length} bộ truyện đã chọn vào Thùng rác?`)) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash", ids: selectedStoryIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchStories(currentPage);
        fetchStats();
      } else {
        alert(data.error || "Lỗi thực hiện");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStoryIds.length === 0) return;
    if (!confirm(`CẢNH BÁO: Xóa vĩnh viễn ${selectedStoryIds.length} bộ truyện và toàn bộ chương liên quan? Thao tác này không thể hoàn tác!`)) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids: selectedStoryIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchStories(currentPage);
        fetchStats();
      } else {
        alert(data.error || "Lỗi xóa vĩnh viễn");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkChangeStatus = async (newStatus: "ongoing" | "completed") => {
    if (selectedStoryIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", ids: selectedStoryIds, new_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchStories(currentPage);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportSelectedJson = () => {
    const selectedStories = stories.filter((s) => selectedStoryIds.includes(s.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedStories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `doctruyen_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Trash Operations
  const handleRestoreFromTrash = async (ids: string[]) => {
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ids }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchTrash();
        fetchStats();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleForceDeleteFromTrash = async (ids: string[]) => {
    if (!confirm(`Xóa vĩnh viễn ${ids.length} mục khỏi CSDL?`)) return;
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchTrash();
        fetchStats();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Story Form Save
  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingStory ? "PUT" : "POST";
      const payload: any = {
        title: storyForm.title,
        slug: storyForm.slug,
        type: storyForm.type,
        author_name: storyForm.author_name,
        description: storyForm.description,
        cover_url: storyForm.cover_url,
        status: storyForm.status,
        genres: storyForm.genres.split(",").map((g) => g.trim()).filter(Boolean),
      };

      if (editingStory) payload.id = editingStory.id;

      const res = await fetch("/api/admin/stories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingStory ? "Đã sửa truyện thành công!" : "Đã thêm truyện mới!");
        setShowStoryModal(false);
        fetchStories(currentPage);
        fetchStats();
      } else {
        alert(data.error || "Có lỗi xảy ra khi lưu truyện");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối");
    }
  };

  // AI SEO trigger
  const openAiSeoForStory = (s: any) => {
    setTargetAiStory(s);
    setAiSeoModalOpen(true);
  };

  const handleApplyAiSeoToForm = (seoData: any) => {
    setStoryForm((prev) => ({
      ...prev,
      seo_title: seoData.seoTitle,
      seo_description: seoData.seoDescription,
      focus_keyword: seoData.focusKeyword,
      genres: seoData.tags.join(", "),
      description: seoData.seoDescription + "\n\n" + (prev.description || ""),
    }));
    showToast("Đã áp dụng toàn bộ từ khóa và tiêu đề AI vào form truyện!");
  };

  // Chapter handlers
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;
    try {
      const method = editingChapter ? "PUT" : "POST";
      const payload: any = {
        story_id: selectedStory.id,
        chapter_number: parseFloat(chapterForm.chapter_number),
        title: chapterForm.title,
        is_locked: chapterForm.is_locked,
        price_coins: chapterForm.price_coins,
      };

      if (selectedStory.type === "novel" || selectedStory.type === "book") {
        payload.content_text = chapterForm.content_text;
      } else {
        payload.pages_images = chapterForm.pages_images_str
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
      }

      if (editingChapter) payload.id = editingChapter.id;

      const res = await fetch("/api/admin/chapters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingChapter ? "Đã sửa chương thành công!" : "Đã thêm chương mới!");
        setShowChapterModal(false);
        fetchChapters(selectedStory.id);
      } else {
        alert(data.error || "Lỗi lưu chương");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Posts Handlers
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingPost ? "PUT" : "POST";
      const payload: any = { ...postForm };
      if (editingPost) payload.id = editingPost.id;

      const res = await fetch("/api/admin/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã lưu trang/bài viết thành công!");
        setShowPostModal(false);
        fetchPosts();
      } else {
        alert(data.error || "Lỗi lưu trang");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Xóa bài viết "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa bài viết!");
        fetchPosts();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Media Handlers
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMediaForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã thêm ảnh vào thư viện!");
        setShowUploadMediaModal(false);
        setNewMediaForm({ name: "", url: "", alt_text: "" });
        fetchMedia();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Xóa ảnh này khỏi thư viện?")) return;
    try {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa ảnh!");
        fetchMedia();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const copyMediaUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMediaUrl(url);
    showToast("Đã sao chép link ảnh CDN!");
    setTimeout(() => setCopiedMediaUrl(null), 2000);
  };

  // Comments Handlers
  const handleDeleteComment = async (id: string) => {
    if (!confirm("Xóa bình luận này?")) return;
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa bình luận!");
        fetchComments();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Adjust Coins
  const handleAdjustCoins = async (action: "add" | "set") => {
    if (!userCoinsModal) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userCoinsModal.id,
          amount: coinAmount,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${action === "add" ? "cộng" : "thiết lập"} xu thành công!`);
        setUserCoinsModal(null);
        fetchUsers();
      } else {
        alert(data.error || "Lỗi điều chỉnh xu");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bulk Import Submit
  const handleRunBulkImport = async () => {
    setImporting(true);
    setImportStatusMsg("Đang xử lý dữ liệu...");
    try {
      if (importType === "json") {
        const parsed = JSON.parse(importJsonText);
        const storiesArray = Array.isArray(parsed) ? parsed : [parsed];
        const res = await fetch("/api/admin/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import_stories", stories: storiesArray }),
        });
        const data = await res.json();
        if (data.success) {
          setImportStatusMsg(`✓ ${data.message}`);
          showToast(data.message);
          fetchStories(1);
          fetchStats();
        } else {
          setImportStatusMsg(`✗ Lỗi: ${data.error}`);
        }
      } else if (importType === "text") {
        const lines = importLinesText.split("\n").map((l) => l.trim()).filter(Boolean);
        const storiesArray = lines.map((l) => {
          const parts = l.split("|").map((p) => p.trim());
          return {
            title: parts[0] || "",
            author_name: parts[1] || "Nhiều Tác Giả",
            genres: parts[2] ? parts[2].split(",").map((g) => g.trim()) : ["Đặc Sắc"],
            description: parts[3] || "",
            type: "novel",
          };
        });

        const res = await fetch("/api/admin/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import_stories", stories: storiesArray }),
        });
        const data = await res.json();
        if (data.success) {
          setImportStatusMsg(`✓ ${data.message}`);
          showToast(data.message);
          fetchStories(1);
          fetchStats();
        } else {
          setImportStatusMsg(`✗ Lỗi: ${data.error}`);
        }
      }
    } catch (e: any) {
      setImportStatusMsg(`✗ Lỗi định dạng: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-foreground">DocTruyen.vip Admin</h1>
            <p className="text-xs text-muted-foreground">
              Cổng Quản Trị Hệ Thống Tối Cao (SEO, Sách, Truyện, Media & Độc Giả)
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Mật Mã Quản Trị</label>
              <input
                type="password"
                placeholder="Nhập mã bảo mật quản trị..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-rose-500 transition-colors"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Đăng Nhập Quản Trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-2xl animate-in slide-in-from-bottom-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur-md border-b border-border/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                DocTruyen
              </span>
              <span className="ml-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                VIP
              </span>
            </div>
          </Link>

          <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            ● Trực Tuyến: doctruyen.vip
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <Globe className="w-3.5 h-3.5" /> Xem Web <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Navigation Tabs (Scrollable Bar) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1.5 border-b border-border/50 text-xs sm:text-sm font-bold no-scrollbar">
          {[
            { id: "overview", label: "Tổng Quan", icon: BarChart3 },
            { id: "stories", label: "Quản Lý Truyện", icon: BookOpen },
            { id: "books", label: "Quản Lý Sách", icon: Bookmark, badge: stats?.totalBooks },
            { id: "chapters", label: "Quản Lý Chương", icon: Layers },
            { id: "blogs", label: "Quản Lý Blog", icon: Sparkles, badge: stats?.totalBlogs },
            { id: "posts", label: "Quản Lý Trang", icon: FileText, badge: stats?.totalPages },
            { id: "comments", label: "Bình Luận & Báo Cáo", icon: MessageSquare, badge: stats?.totalReports > 0 ? `${stats.totalReports} lỗi` : null },
            { id: "media", label: "Thư Viện Media", icon: ImageIcon },
            { id: "users", label: "Độc Giả & Nạp Xu", icon: Users },
            { id: "import", label: "Nhập Hàng Loạt", icon: Upload },
            { id: "trash", label: "Thùng Rác", icon: Trash2, badge: stats?.totalTrash },
            { id: "social", label: "Mạng Xã Hội & Auto Share", icon: Share2 },
            { id: "settings", label: "Cấu Hình & SEO", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.id === "comments" && stats?.totalReports > 0
                        ? "bg-rose-500/20 text-rose-500"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Tổng Số Bộ Truyện</span>
                  <BookOpen className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {stats?.totalStories ? stats.totalStories.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <span className="text-amber-500 font-bold">{stats?.totalComics || 0} Tranh</span> ·{" "}
                  <span className="text-indigo-400 font-bold">{stats?.totalNovels || 0} Chữ</span> ·{" "}
                  <span className="text-emerald-400 font-bold">{stats?.totalBooks || 0} Sách</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Tổng Số Chương</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-500">
                  {stats?.totalChapters ? stats.totalChapters.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <span className="text-amber-500 font-bold">
                    {stats?.totalLockedChapters ? stats.totalLockedChapters.toLocaleString() : 0} VIP
                  </span>{" "}
                  ·{" "}
                  <span className="text-emerald-500 font-bold">
                    {stats?.totalChapters
                      ? (stats.totalChapters - (stats.totalLockedChapters || 0)).toLocaleString()
                      : 0}{" "}
                    Free
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Tài Khoản & Độc Giả</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-[11px] text-muted-foreground">Supabase Cloud Auth</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Trang & Bài Viết</span>
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {stats?.totalPosts || 5}
                </div>
                <div className="text-[11px] text-muted-foreground">Chính sách & Review truyện</div>
              </div>
            </div>

            {/* Quick Actions & Recent Updates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Truyện Mới Cập Nhật Gần Đây
                  </h3>
                  <button
                    onClick={() => setActiveTab("stories")}
                    className="text-xs text-rose-500 hover:underline font-bold"
                  >
                    Xem tất cả ({stats?.totalStories || 0})
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {stats?.recentStories?.map((st: any) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            st.type === "comic"
                              ? "bg-amber-500/10 text-amber-500"
                              : st.type === "book"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-indigo-500/10 text-indigo-400"
                          }`}
                        >
                          {st.type === "comic" ? "Tranh" : st.type === "book" ? "Sách" : "Chữ"}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-foreground">{st.title}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {st.total_chapters} chương · {st.total_views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/truyen/${st.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-muted hover:text-rose-500 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* System & Infrastructure */}
              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-sm border-b border-border/50 pb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" /> Hạ Tầng & Tên Miền
                </h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Tên miền chính:</span>
                    <strong className="text-foreground">doctruyen.vip</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Media CDN:</span>
                    <strong className="text-emerald-500">media.doctruyen.vip</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Google Analytics 4:</span>
                    <strong className="text-foreground">G-0CBF77MVXY</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Google Tag Manager:</span>
                    <strong className="text-foreground">GTM-N7TTTGPL</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Lưu trữ hình ảnh:</span>
                    <strong className="text-emerald-500">Cloudflare R2 Bucket</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STORIES MANAGEMENT (Comic & Novel) */}
        {/* ============================================================== */}
        {activeTab === "stories" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên truyện, tác giả hoặc slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchStories(1)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  onClick={() => fetchStories(1)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold cursor-pointer"
                >
                  Tìm
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Tất cả loại truyện</option>
                  <option value="comic">Chỉ Truyện Tranh</option>
                  <option value="novel">Chỉ Truyện Chữ</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ongoing">Đang tiến hành</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="date_desc">Mới cập nhật</option>
                  <option value="views_desc">Xem nhiều nhất</option>
                  <option value="chapters_desc">Nhiều chương nhất</option>
                  <option value="title_asc">Tên A-Z</option>
                </select>

                {/* New Story Button */}
                <button
                  onClick={() => {
                    setEditingStory(null);
                    setStoryForm({
                      title: "",
                      slug: "",
                      type: "comic",
                      author_name: "",
                      description: "",
                      cover_url: "",
                      status: "ongoing",
                      genres: "Hành Động, Phiêu Lưu",
                      seo_title: "",
                      seo_description: "",
                      focus_keyword: "",
                    });
                    setShowStoryModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Thêm Truyện
                </button>
              </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedStoryIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-card to-muted border border-rose-500/30 shadow-lg flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-rose-500" />
                  <span className="font-bold">
                    Đã chọn <strong className="text-rose-500">{selectedStoryIds.length}</strong> bộ truyện
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkChangeStatus("completed")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold cursor-pointer"
                  >
                    Đánh dấu Hoàn thành
                  </button>
                  <button
                    onClick={() => handleBulkChangeStatus("ongoing")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold cursor-pointer"
                  >
                    Đánh dấu Đang ra
                  </button>
                  <button
                    onClick={() => {
                      setTargetBuffStory(null);
                      setBuffModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" /> Buff View/Like
                  </button>
                  <button
                    onClick={handleExportSelectedJson}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Xuất JSON
                  </button>
                  <button
                    onClick={handleBulkMoveToTrash}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Đưa vào Thùng Rác
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    Xóa Vĩnh Viễn
                  </button>
                </div>
              </div>
            )}

            {/* Stories Table */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <button
                          onClick={toggleSelectAllOnPage}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {selectedStoryIds.length === stories.length && stories.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Bộ Truyện</th>
                      <th className="p-3.5">Phân Loại</th>
                      <th className="p-3.5">Số Chương</th>
                      <th className="p-3.5">Trạng Thái</th>
                      <th className="p-3.5">Lượt Xem</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loadingStories ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                          <span className="block mt-2 font-semibold">Đang tải danh sách truyện...</span>
                        </td>
                      </tr>
                    ) : stories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy bộ truyện nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      stories.map((s) => {
                        const isSelected = selectedStoryIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-muted/30 transition-colors ${
                              isSelected ? "bg-rose-500/5" : ""
                            }`}
                          >
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => toggleSelectStory(s.id)}
                                className="cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-14 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/40">
                                  {s.cover_url && (
                                    <img
                                      src={s.cover_url}
                                      alt={s.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 max-w-xs sm:max-w-md">
                                  <Link
                                    href={`/truyen/${s.slug}`}
                                    target="_blank"
                                    className="font-bold text-foreground hover:text-rose-500 transition-colors truncate"
                                  >
                                    {s.title}
                                  </Link>
                                  <span className="text-[11px] text-muted-foreground">
                                    Tác giả: {s.author_name || "Nhiều Tác Giả"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                                    /{s.slug}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  s.type === "comic"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-indigo-500/10 text-indigo-400"
                                }`}
                              >
                                {s.type === "comic" ? "Tranh" : "Chữ"}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-foreground">
                              {s.total_chapters || 0}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-amber-500/10 text-amber-500"
                                }`}
                              >
                                {s.status === "completed" ? "Hoàn thành" : "Đang ra"}
                              </span>
                            </td>
                            <td className="p-3.5 text-muted-foreground font-mono">
                              {s.total_views ? s.total_views.toLocaleString() : 0}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setTargetBuffStory(s);
                                    setBuffModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:scale-105 transition-all cursor-pointer"
                                  title="Tạo lượt xem & thích ảo"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openAiSeoForStory(s)}
                                  className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-rose-500 hover:scale-105 transition-all cursor-pointer"
                                  title="Tối ưu SEO bằng AI"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStory(s);
                                    setActiveTab("chapters");
                                    fetchChapters(s.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-muted hover:text-amber-500 transition-colors cursor-pointer"
                                  title="Quản lý chương"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStory(s);
                                    setStoryForm({
                                      title: s.title,
                                      slug: s.slug,
                                      type: s.type,
                                      author_name: s.author_name || "",
                                      description: s.description || "",
                                      cover_url: s.cover_url || "",
                                      status: s.status || "ongoing",
                                      genres: Array.isArray(s.genres) ? s.genres.join(", ") : s.genres || "",
                                      seo_title: "",
                                      seo_description: "",
                                      focus_keyword: "",
                                    });
                                    setShowStoryModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-muted hover:text-indigo-400 transition-colors cursor-pointer"
                                  title="Sửa thông tin"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Chuyển "${s.title}" vào Thùng rác?`)) {
                                      fetch("/api/admin/bulk", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "trash", ids: [s.id] }),
                                      }).then(() => {
                                        showToast("Đã đưa vào thùng rác");
                                        fetchStories(currentPage);
                                        fetchStats();
                                      });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-muted hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Xóa vào thùng rác"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng cộng{" "}
                  <strong>{totalStoriesCount.toLocaleString()}</strong> bộ truyện)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchStories(currentPage - 1)}
                    disabled={currentPage <= 1 || loadingStories}
                    className="p-2 rounded-lg bg-muted border border-border/60 hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchStories(currentPage + 1)}
                    disabled={currentPage >= totalPages || loadingStories}
                    className="p-2 rounded-lg bg-muted border border-border/60 hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: BOOKS MANAGEMENT (SÁCH EBOOK & AUDIO) */}
        {/* ============================================================== */}
        {activeTab === "books" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-500" /> Quản Lý Danh Mục Sách & Ebook
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                    {totalBooksCount || books.length} cuốn
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tuyển tập các tác phẩm phát triển bản thân, kinh doanh, triết học & kỹ năng sống
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBookImportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Nhập Sách Từ Tệp (Nhiều File)
                </button>
                <button
                  onClick={() => {
                    setEditingStory(null);
                    setStoryForm({
                      title: "",
                      slug: "",
                      type: "book",
                      author_name: "",
                      description: "",
                      cover_url: "",
                      status: "completed",
                      genres: "Sách, Phát Triển Bản Thân, Kỹ Năng Sống",
                      seo_title: "",
                      seo_description: "",
                      focus_keyword: "",
                    });
                    setShowStoryModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm Sách Mới
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-3.5">Tác Phẩm Sách</th>
                      <th className="p-3.5">Chủ Đề & Thể Loại</th>
                      <th className="p-3.5">Số Chương / Phần</th>
                      <th className="p-3.5">Lượt Xem / Thích</th>
                      <th className="p-3.5">Trạng Thái</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loadingBooks ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                          <span className="block mt-2 font-semibold">Đang tải danh mục sách...</span>
                        </td>
                      </tr>
                    ) : books.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Chưa tìm thấy cuốn sách nào. Hãy bấm &quot;Nhập Sách Từ Tệp&quot; hoặc &quot;Thêm Sách Mới&quot;!
                        </td>
                      </tr>
                    ) : (
                      books.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-14 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/40">
                                <img
                                  src={b.cover_url || "https://media.doctruyen.vip/covers/doraemon-cover.webp"}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5 max-w-xs sm:max-w-md">
                                <Link
                                  href={`/truyen/${b.slug}`}
                                  target="_blank"
                                  className="font-bold text-foreground hover:text-emerald-500 transition-colors truncate"
                                >
                                  {b.title}
                                </Link>
                                <span className="text-[11px] text-muted-foreground">
                                  Tác giả: {b.author_name || "Nhiều Tác Giả"}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70 font-mono">
                                  /{b.slug}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(Array.isArray(b.genres) ? b.genres : []).slice(0, 3).map((g: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            {b.total_chapters || 0} phần
                          </td>
                          <td className="p-3.5 text-muted-foreground font-mono">
                            <div className="flex flex-col gap-0.5 text-[11px]">
                              <span>{(b.total_views || 0).toLocaleString()} views</span>
                              <span className="text-rose-500 font-semibold">{(b.total_likes || 0).toLocaleString()} likes</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                              {b.status === "completed" ? "Hoàn thành" : "Đang cập nhật"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setTargetBuffStory(b);
                                  setBuffModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:scale-105 transition-all cursor-pointer"
                                title="Tạo lượt xem & thích ảo"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openAiSeoForStory(b)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:scale-105 transition-all cursor-pointer"
                                title="Tối ưu SEO & Tóm tắt sách bằng AI"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStory(b);
                                  setActiveTab("chapters");
                                  fetchChapters(b.id);
                                }}
                                className="p-1.5 rounded-lg bg-muted hover:text-emerald-500 transition-colors cursor-pointer"
                                title="Quản lý các chương của sách"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStory(b);
                                  setStoryForm({
                                    title: b.title,
                                    slug: b.slug,
                                    type: b.type || "book",
                                    author_name: b.author_name || "",
                                    description: b.description || "",
                                    cover_url: b.cover_url || "",
                                    status: b.status || "completed",
                                    genres: Array.isArray(b.genres) ? b.genres.join(", ") : b.genres || "",
                                    seo_title: "",
                                    seo_description: "",
                                    focus_keyword: "",
                                  });
                                  setShowStoryModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-muted hover:text-indigo-400 transition-colors cursor-pointer"
                                title="Sửa thông tin sách"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Chuyển sách "${b.title}" vào Thùng rác?`)) {
                                    fetch("/api/admin/bulk", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "trash", ids: [b.id] }),
                                    }).then(() => {
                                      showToast("Đã đưa vào thùng rác");
                                      fetchBooks(booksPage);
                                      fetchStats();
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-muted hover:text-rose-500 transition-colors cursor-pointer"
                                title="Xóa sách"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  Trang <strong>{booksPage}</strong> · Hiển thị <strong>{books.length}</strong> / <strong>{totalBooksCount}</strong> cuốn sách
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchBooks(booksPage - 1)}
                    disabled={booksPage <= 1 || loadingBooks}
                    className="p-2 rounded-lg bg-muted border border-border/60 hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchBooks(booksPage + 1)}
                    disabled={books.length < 15 || loadingBooks}
                    className="p-2 rounded-lg bg-muted border border-border/60 hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CHAPTERS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "chapters" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Story Picker */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("stories")}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    Đang quản lý chương:{" "}
                    <span className="text-rose-500">{selectedStory?.title || "Chưa chọn bộ truyện"}</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Loại: {selectedStory?.type === "comic" ? "Truyện Tranh" : "Truyện Chữ / Sách"} ·{" "}
                    {chapters.length} chương hiện có
                  </span>
                </div>
              </div>

              {selectedStory && (
                <button
                  onClick={() => {
                    setEditingChapter(null);
                    const nextNum = chapters.length > 0 ? (Math.max(...chapters.map((c) => c.chapter_number)) + 1).toString() : "1";
                    setChapterForm({
                      chapter_number: nextNum,
                      title: `Chương ${nextNum}`,
                      is_locked: false,
                      price_coins: 0,
                      content_text: "",
                      pages_images_str: "",
                    });
                    setShowChapterModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm Chương Mới
                </button>
              )}
            </div>

            {/* Chapters Table */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3.5">Số Chương</th>
                    <th className="p-3.5">Tiêu Đề Chương</th>
                    <th className="p-3.5">Trạng Thái VIP</th>
                    <th className="p-3.5">Giá Xu</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingChapters ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                        <span className="block mt-2 font-semibold">Đang tải danh sách chương...</span>
                      </td>
                    </tr>
                  ) : chapters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Vui lòng chọn một bộ truyện từ tab &quot;Quản Lý Truyện&quot; để xem các chương.
                      </td>
                    </tr>
                  ) : (
                    chapters.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">Chương {c.chapter_number}</td>
                        <td className="p-3.5 font-medium">{c.title || `Chương ${c.chapter_number}`}</td>
                        <td className="p-3.5">
                          {c.is_locked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" /> VIP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center gap-1 w-fit">
                              <Unlock className="w-3 h-3" /> Miễn phí
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-amber-500 font-bold">{c.price_coins || 0} xu</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setEditingChapter(c);
                              let imgStr = "";
                              if (c.pages_images) {
                                imgStr = Array.isArray(c.pages_images) ? c.pages_images.join("\n") : JSON.stringify(c.pages_images);
                              }
                              setChapterForm({
                                chapter_number: c.chapter_number.toString(),
                                title: c.title || "",
                                is_locked: c.is_locked || false,
                                price_coins: c.price_coins || 0,
                                content_text: c.content_text || "",
                                pages_images_str: imgStr,
                              });
                              setShowChapterModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-muted hover:text-indigo-400 mr-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xóa chương ${c.chapter_number}?`)) {
                                fetch(`/api/admin/chapters?id=${c.id}`, { method: "DELETE" }).then(() => {
                                  showToast("Đã xóa chương");
                                  if (selectedStory) fetchChapters(selectedStory.id);
                                });
                              }
                            }}
                            className="p-1.5 rounded-lg bg-muted hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4.5: BLOGS & REVIEWS & SPOILERS */}
        {/* ============================================================== */}
        {activeTab === "blogs" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" /> Quản Lý Blog, Reviews & Spoil Truyện
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold">
                    {blogs.length} bài
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bài viết đánh giá (Review), Spoil cốt truyện, Sắp ra mắt, Thông báo hệ thống & Tin tức
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingBlog(null);
                    setShowBlogModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Viết Bài Mới (Có AI)
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm bài viết theo tiêu đề hoặc từ khóa..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "Tất Cả" },
                  { id: "review", label: "Review" },
                  { id: "spoil", label: "Spoil" },
                  { id: "comingsoon", label: "Sắp Ra Mắt" },
                  { id: "notice", label: "Thông Báo" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setBlogCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      blogCategoryFilter === cat.id
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 font-bold"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blogs Table */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3.5">Bài Viết</th>
                    <th className="p-3.5">Đường Dẫn (Slug)</th>
                    <th className="p-3.5">SEO & Từ Khóa</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5">Ngày Đăng</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingBlogs ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                        <span className="block mt-2 font-semibold">Đang tải danh sách bài viết...</span>
                      </td>
                    </tr>
                  ) : blogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Chưa có bài viết blog nào. Hãy bấm &quot;Viết Bài Mới&quot; để trợ lý AI tạo bài viết đầu tiên!
                      </td>
                    </tr>
                  ) : (
                    blogs
                      .filter((b) => {
                        if (blogSearchQuery && !b.title.toLowerCase().includes(blogSearchQuery.toLowerCase())) return false;
                        if (blogCategoryFilter === "review") return b.title.includes("[Review]");
                        if (blogCategoryFilter === "spoil") return b.title.includes("[Spoil]");
                        if (blogCategoryFilter === "comingsoon") return b.title.includes("[Sắp Ra Mắt]");
                        if (blogCategoryFilter === "notice") return b.title.includes("[Thông Báo]");
                        return true;
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 font-bold text-foreground max-w-xs sm:max-w-md">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className="truncate hover:text-rose-500 cursor-pointer"
                                onClick={() => {
                                  setEditingBlog(b);
                                  setShowBlogModal(true);
                                }}
                              >
                                {b.title}
                              </span>
                              {b.excerpt && (
                                <span className="text-[11px] text-muted-foreground line-clamp-1 font-normal">
                                  {b.excerpt}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-indigo-400">/{b.slug}</td>
                          <td className="p-3.5">
                            {b.focus_keyword ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400">
                                {b.focus_keyword}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 text-[10px]">Chưa đặt</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                              {b.status || "published"}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                            {new Date(b.created_at || b.updated_at).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/blog/${b.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-muted hover:text-foreground inline-block"
                                title="Xem bài viết trên web"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => {
                                  setEditingBlog(b);
                                  setShowBlogModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-muted hover:text-indigo-400 cursor-pointer"
                                title="Sửa bài viết"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(b.id, b.title)}
                                className="p-1.5 rounded-lg bg-muted hover:text-rose-500 cursor-pointer"
                                title="Xóa bài viết"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: PAGES & POLICY ARTICLES */}
        {/* ============================================================== */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" /> Quản Lý Trang Tĩnh & Bài Viết Chính Sách
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chính sách bảo mật, Điều khoản, Cookie, DMCA và bài viết đánh giá truyện
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={postTypeFilter}
                  onChange={(e) => setPostTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="page">Chỉ các trang tĩnh (Chính sách)</option>
                  <option value="article">Bài viết tin tức / Review</option>
                </select>

                <button
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      title: "",
                      slug: "",
                      type: postTypeFilter,
                      excerpt: "",
                      content_html: "",
                      status: "published",
                      seo_title: "",
                      seo_description: "",
                      focus_keyword: "",
                    });
                    setShowPostModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tạo Trang Mới
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3.5">Tiêu Đề Trang</th>
                    <th className="p-3.5">Đường Dẫn (Slug)</th>
                    <th className="p-3.5">Phân Loại</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingPosts ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                        <span className="block mt-2 font-semibold">Đang tải danh sách trang...</span>
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Chưa có trang nào trong cơ sở dữ liệu. Bấm &quot;Tạo Trang Mới&quot; để thiết lập.
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{p.title}</td>
                        <td className="p-3.5 font-mono text-indigo-400">/{p.slug}</td>
                        <td className="p-3.5 uppercase font-black text-[10px] text-muted-foreground">{p.type}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                            {p.status || "published"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-muted hover:text-foreground inline-block mr-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingPost(p);
                              setPostForm({
                                title: p.title || "",
                                slug: p.slug || "",
                                type: p.type || "page",
                                excerpt: p.excerpt || "",
                                content_html: p.content_html || "",
                                status: p.status || "published",
                                seo_title: p.seo_title || "",
                                seo_description: p.seo_description || "",
                                focus_keyword: p.focus_keyword || "",
                              });
                              setShowPostModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-muted hover:text-indigo-400 mr-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(p.id, p.title)}
                            className="p-1.5 rounded-lg bg-muted hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: MEDIA MANAGER (Cloudflare R2 CDN) */}
        {/* ============================================================== */}
        {activeTab === "media" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm media theo tên hoặc mô tả..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchMedia()}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMedia}
                  className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
                </button>
                <button
                  onClick={() => setShowUploadMediaModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Thêm Ảnh Mới
                </button>
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {loadingMedia ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                  <span className="block mt-2 font-semibold text-xs">Đang tải thư viện media...</span>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                  Không tìm thấy hình ảnh nào trong thư viện.
                </div>
              ) : (
                mediaList.map((m) => (
                  <div
                    key={m.id}
                    className="group relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm flex flex-col hover:border-rose-500/50 transition-all"
                  >
                    <div className="aspect-[3/4] w-full bg-muted overflow-hidden relative">
                      <img
                        src={m.url}
                        alt={m.name || "media"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => copyMediaUrl(m.url)}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                          title="Sao chép link CDN"
                        >
                          {copiedMediaUrl === m.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                          title="Mở ảnh gốc"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="p-2 flex flex-col gap-0.5 text-[11px]">
                      <span className="font-bold text-foreground truncate">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground/70 truncate">{m.url}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: COMMENTS & ERROR REPORTS */}
        {/* ============================================================== */}
        {activeTab === "comments" && (
          <AdminReportsSection
            comments={comments}
            loadingComments={loadingComments}
            commentSearch={commentSearch}
            setCommentSearch={setCommentSearch}
            onRefreshComments={fetchComments}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 8: USERS & VIETQR DYNAMIC WALLET */}
        {/* ============================================================== */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Phân Loại Độc Giả & Nạp Xu Tự Động
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quản lý số dư xu, cấp độ thành viên VIP, nguồn khách hàng và sinh mã VietQR cá nhân
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userVipFilter}
                  onChange={(e) => setUserVipFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Tất cả Cấp độ</option>
                  <option value="vip_diamond">VIP Kim Cương</option>
                  <option value="vip_gold">VIP Vàng</option>
                  <option value="vip_silver">VIP Bạc</option>
                  <option value="normal">Độc giả thường</option>
                </select>

                <select
                  value={userSourceFilter}
                  onChange={(e) => setUserSourceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Tất cả Nguồn KH</option>
                  <option value="seo">Google SEO</option>
                  <option value="facebook">Facebook / Zalo</option>
                  <option value="app">App Mobile</option>
                  <option value="direct">Truy cập trực tiếp</option>
                </select>

                <button
                  onClick={fetchUsers}
                  className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3.5">Độc Giả</th>
                    <th className="p-3.5">Cấp Bậc VIP</th>
                    <th className="p-3.5">Nguồn KH</th>
                    <th className="p-3.5">Số Dư Xu</th>
                    <th className="p-3.5 text-right">Thao Tác Nạp & QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                        <span className="block mt-2 font-semibold">Đang tải danh sách độc giả...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Chưa có người dùng nào đăng ký tài khoản.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold flex items-center justify-center shrink-0">
                              {(u.display_name || u.email || "U")[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{u.display_name || "Chưa đặt tên"}</span>
                              <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                            {u.vip_level || "Thành viên"}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">Google / Direct</td>
                        <td className="p-3.5 font-bold text-amber-500 font-mono text-sm">
                          {(u.coins_balance || 0).toLocaleString()} xu
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setQrModalUser(u);
                              setQrAmount(50000);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold mr-1.5 cursor-pointer inline-flex items-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Tạo VietQR
                          </button>
                          <button
                            onClick={() => {
                              setUserCoinsModal(u);
                              setCoinAmount(100);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Coins className="w-3.5 h-3.5" /> Điều Chỉnh Xu
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: BULK IMPORT */}
        {/* ============================================================== */}
        {activeTab === "import" && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-card border border-border/50 flex flex-col gap-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-500" /> Nhập Hàng Loạt Dữ Liệu (Bulk Import Engine)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhập danh sách hàng trăm bộ truyện cùng lúc qua định dạng JSON chuẩn hoặc dán văn bản nhanh
                </p>
              </div>

              {/* Import Type Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportType("json")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    importType === "json"
                      ? "bg-rose-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  File / Dữ liệu JSON
                </button>
                <button
                  onClick={() => setImportType("text")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    importType === "text"
                      ? "bg-rose-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Dán Văn Bản Nhanh (Title | Author | Genres | Desc)
                </button>
              </div>

              {importType === "json" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mẫu JSON: [ {`{ "title": "...", "author_name": "...", "genres": ["..."], "type": "novel" }`} ]</span>
                  </div>
                  <textarea
                    rows={10}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder={`[\n  {\n    "title": "Truyện Mẫu Số 1",\n    "author_name": "Tác Giả A",\n    "genres": ["Tiên Hiệp", "Huyền Huyễn"],\n    "type": "novel",\n    "description": "Mô tả ngắn của truyện..."\n  }\n]`}
                    className="w-full p-4 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    Mỗi dòng một bộ truyện theo cú pháp: <code>Tiêu đề | Tác giả | Thể loại (cách nhau dấu phẩy) | Mô tả</code>
                  </span>
                  <textarea
                    rows={10}
                    value={importLinesText}
                    onChange={(e) => setImportLinesText(e.target.value)}
                    placeholder={`Đấu Phá Thương Khung | Thiên Tằm Thổ Đậu | Tiên Hiệp, Huyền Huyễn | Thế giới thuộc về đấu khí...\nVõ Luyện Đỉnh Phong | Mạc Mặc | Kiếm Hiệp, Tu Chân | Con đường võ đạo đỉnh cao...`}
                    className="w-full p-4 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {importStatusMsg && (
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground">
                  {importStatusMsg}
                </div>
              )}

              <button
                onClick={handleRunBulkImport}
                disabled={importing}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Đang tiến hành nhập vào CSDL..." : "Bắt Đầu Nhập Hàng Loạt"}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 10: TRASH BIN */}
        {/* ============================================================== */}
        {activeTab === "trash" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Thùng Rác (Trash Bin & Khôi Phục)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Các bộ truyện đã xóa tạm thời. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.
                </p>
              </div>

              {trashItems.length > 0 && (
                <button
                  onClick={() => handleForceDeleteFromTrash(trashItems.map((t) => t.id))}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Dọn Sạch Thùng Rác
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3.5">Tên Bộ Truyện</th>
                    <th className="p-3.5">Phân Loại</th>
                    <th className="p-3.5">Số Chương</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingTrash ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                        <span className="block mt-2 font-semibold">Đang kiểm tra thùng rác...</span>
                      </td>
                    </tr>
                  ) : trashItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        Thùng rác trống. Không có bộ truyện nào bị xóa tạm.
                      </td>
                    </tr>
                  ) : (
                    trashItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{item.title}</td>
                        <td className="p-3.5 uppercase text-[10px] text-muted-foreground">{item.type}</td>
                        <td className="p-3.5 font-bold">{item.total_chapters}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleRestoreFromTrash([item.id])}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold mr-1.5 cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục
                          </button>
                          <button
                            onClick={() => handleForceDeleteFromTrash([item.id])}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa Vĩnh Viễn
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 12: SOCIAL MEDIA, OAUTH & AUTO-SHARE */}
        {/* ============================================================== */}
        {activeTab === "social" && (
          <AdminSocialSection
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            saving={savingSettings}
            showToast={showToast}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 11: SETTINGS, SCHEMA, BRANDING & MOBILE APPS */}
        {/* ============================================================== */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6 animate-in fade-in">
            {/* Quick jump to Social & OAuth */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-rose-500/10 to-amber-500/10 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    Cấu Hình Kết Nối Mạng Xã Hội, Google/Facebook Login & Auto-Share
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Tùy chỉnh Client ID OAuth, Telegram Bot phát sóng, Fanpage Facebook, Google Indexing API.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("social")}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Mở Cấu Hình Mạng Xã Hội</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Brand & Colors */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-sm border-b border-border/50 pb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-500" /> Tùy Biến Màu Sắc & Nhận Diện Thương Hiệu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Màu Chủ Đạo (Primary Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings?.primaryColor || "#f43f5e"}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings?.primaryColor || "#f43f5e"}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Màu Điểm Nhấn (Accent Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings?.accentColor || "#f59e0b"}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings?.accentColor || "#f59e0b"}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Chế Độ Mặc Định</label>
                  <select
                    value={settings?.themeMode || "dark"}
                    onChange={(e) => setSettings({ ...settings, themeMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold"
                  >
                    <option value="dark">Tối Hiện Đại (Dark Mode)</option>
                    <option value="light">Sáng Thanh Lịch (Light Mode)</option>
                    <option value="amoled">Đen Tuyệt Đối (AMOLED Black)</option>
                  </select>
                </div>
              </div>

              {/* Logo & Favicon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Đường Dẫn Logo Website</label>
                  <input
                    type="text"
                    value={settings?.logoUrl || "https://media.doctruyen.vip/covers/logo.png"}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Favicon URL</label>
                  <input
                    type="text"
                    value={settings?.faviconUrl || "/favicon.ico"}
                    onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Apps Links */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-sm border-b border-border/50 pb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" /> Liên Kết Ứng Dụng Di Động (Android & iOS)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">File Cài Đặt Android APK Direct Link</label>
                  <input
                    type="text"
                    value={settings?.mobileApps?.androidApkUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mobileApps: { ...settings.mobileApps, androidApkUrl: e.target.value },
                      })
                    }
                    placeholder="https://media.doctruyen.vip/apps/doctruyen.apk"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Google Play Store URL</label>
                  <input
                    type="text"
                    value={settings?.mobileApps?.googlePlayUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mobileApps: { ...settings.mobileApps, googlePlayUrl: e.target.value },
                      })
                    }
                    placeholder="https://play.google.com/store/apps/details?id=vip.doctruyen.app"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Apple App Store URL</label>
                  <input
                    type="text"
                    value={settings?.mobileApps?.iosAppStoreUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mobileApps: { ...settings.mobileApps, iosAppStoreUrl: e.target.value },
                      })
                    }
                    placeholder="https://apps.apple.com/app/doctruyen-vip/id..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Apple TestFlight URL</label>
                  <input
                    type="text"
                    value={settings?.mobileApps?.iosTestFlightUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mobileApps: { ...settings.mobileApps, iosTestFlightUrl: e.target.value },
                      })
                    }
                    placeholder="https://testflight.apple.com/join/..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Banking & VietQR */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-sm border-b border-border/50 pb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-500" /> Tài Khoản Ngân Hàng Nạp Tiền & VietQR
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Ngân Hàng Thụ Hưởng</label>
                  <input
                    type="text"
                    value={settings?.banking?.bankName || "MBBank"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        banking: { ...settings.banking, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Số Tài Khoản</label>
                  <input
                    type="text"
                    value={settings?.banking?.accountNo || "0388888888"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        banking: { ...settings.banking, accountNo: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Tên Chủ Tài Khoản</label>
                  <input
                    type="text"
                    value={settings?.banking?.accountName || "DOCTRUYENVIP"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        banking: { ...settings.banking, accountName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs uppercase font-black"
                  />
                </div>
              </div>
            </div>

            {/* Submit Settings */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
              >
                {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {savingSettings ? "Đang lưu cấu hình..." : "Lưu Toàn Bộ Cấu Hình Website"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: EDIT / CREATE STORY */}
      {/* ============================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <h3 className="text-base font-extrabold text-foreground">
                {editingStory ? `Sửa Bộ Truyện: ${editingStory.title}` : "Thêm Bộ Truyện Mới"}
              </h3>
              <button
                onClick={() => setShowStoryModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Tiêu Đề Truyện *</label>
                  <input
                    type="text"
                    required
                    value={storyForm.title}
                    onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Đường Dẫn Slug *</label>
                  <input
                    type="text"
                    required
                    value={storyForm.slug}
                    onChange={(e) => setStoryForm({ ...storyForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Phân Loại</label>
                  <select
                    value={storyForm.type}
                    onChange={(e) => setStoryForm({ ...storyForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold"
                  >
                    <option value="comic">Truyện Tranh (Comic/Manga)</option>
                    <option value="novel">Truyện Chữ (Novel)</option>
                    <option value="book">Sách & Ebook (Book)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Tác Giả</label>
                  <input
                    type="text"
                    value={storyForm.author_name}
                    onChange={(e) => setStoryForm({ ...storyForm, author_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Trạng Thái</label>
                  <select
                    value={storyForm.status}
                    onChange={(e) => setStoryForm({ ...storyForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold"
                  >
                    <option value="ongoing">Đang tiến hành</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Ảnh Bìa (Cover URL)</label>
                <input
                  type="text"
                  value={storyForm.cover_url}
                  onChange={(e) => setStoryForm({ ...storyForm, cover_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Thể Loại (Cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  value={storyForm.genres}
                  onChange={(e) => setStoryForm({ ...storyForm, genres: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Mô Tả Truyện</label>
                  <button
                    type="button"
                    onClick={() => openAiSeoForStory(storyForm)}
                    className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Gợi Ý SEO Bằng AI
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={storyForm.description}
                  onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs"
                />
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:opacity-95"
                >
                  {editingStory ? "Lưu Thay Đổi" : "Thêm Truyện"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT / CREATE CHAPTER */}
      {/* ============================================================== */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <h3 className="text-base font-extrabold text-foreground">
                {editingChapter ? `Sửa Chương ${editingChapter.chapter_number}` : "Thêm Chương Mới"}
              </h3>
              <button
                onClick={() => setShowChapterModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Số Chương *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Tiêu Đề Chương</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-muted/30 border border-border/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterForm.is_locked}
                    onChange={(e) => setChapterForm({ ...chapterForm, is_locked: e.target.checked })}
                    className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="font-bold text-foreground">Khóa Chương VIP</span>
                </label>
                {chapterForm.is_locked && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">Giá Xu Mở:</label>
                    <input
                      type="number"
                      value={chapterForm.price_coins}
                      onChange={(e) => setChapterForm({ ...chapterForm, price_coins: parseInt(e.target.value) || 0 })}
                      className="w-24 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-mono font-bold text-amber-500"
                    />
                  </div>
                )}
              </div>

              {selectedStory?.type === "comic" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Danh Sách Link Ảnh Trang Truyện (Mỗi dòng một link)</label>
                  <textarea
                    rows={8}
                    value={chapterForm.pages_images_str}
                    onChange={(e) => setChapterForm({ ...chapterForm, pages_images_str: e.target.value })}
                    className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Nội Dung Văn Bản Chương</label>
                  <textarea
                    rows={12}
                    value={chapterForm.content_text}
                    onChange={(e) => setChapterForm({ ...chapterForm, content_text: e.target.value })}
                    className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs leading-relaxed"
                  />
                </div>
              )}

              <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:opacity-95"
                >
                  {editingChapter ? "Lưu Chương" : "Thêm Chương"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EDIT / CREATE POST (PAGES) */}
      {/* ============================================================== */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <h3 className="text-base font-extrabold text-foreground">
                {editingPost ? `Sửa Trang: ${editingPost.title}` : "Tạo Trang / Bài Viết Mới"}
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Tiêu Đề Trang *</label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-foreground">Đường Dẫn Slug *</label>
                  <input
                    type="text"
                    required
                    value={postForm.slug}
                    onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Tóm Tắt Ngắn (Excerpt / Meta Description)</label>
                <textarea
                  rows={2}
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Nội Dung Chi Tiết (HTML hoặc Markdown)</label>
                <textarea
                  rows={10}
                  value={postForm.content_html}
                  onChange={(e) => setPostForm({ ...postForm, content_html: e.target.value })}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:opacity-95"
                >
                  Lưu Trang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DYNAMIC VIETQR GENERATOR */}
      {/* ============================================================== */}
      {qrModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-500" /> VietQR Nạp Xu Độc Giả
              </h3>
              <button
                onClick={() => setQrModalUser(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="text-xs">
                Nạp xu cho tài khoản: <strong className="text-rose-500">{qrModalUser.email || qrModalUser.id}</strong>
              </div>

              {/* Amount Buttons */}
              <div className="flex flex-wrap justify-center gap-2">
                {[20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setQrAmount(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      qrAmount === amt
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {amt.toLocaleString()}đ ({amt / 10} xu)
                  </button>
                ))}
              </div>

              {/* Render Live VietQR Image */}
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-border/40">
                <img
                  src={`https://img.vietqr.io/image/970422-0388888888-compact2.png?amount=${qrAmount}&addInfo=NAPXU%20${qrModalUser.id.slice(0, 8)}&accountName=DOCTRUYENVIP`}
                  alt="VietQR nạp xu"
                  className="w-56 h-auto"
                />
              </div>

              <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
                <span>Cú pháp tự động: <strong>NAPXU {qrModalUser.id.slice(0, 8)}</strong></span>
                <span>Chủ TK: <strong>DOCTRUYENVIP</strong> · Ngân hàng: <strong>MBBank</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: ADJUST COINS */}
      {/* ============================================================== */}
      {userCoinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" /> Điều Chỉnh Số Dư Xu
            </h3>
            <div className="text-xs text-muted-foreground">
              Độc giả: <strong className="text-foreground">{userCoinsModal.email}</strong>
              <br />
              Số dư hiện tại: <strong className="text-amber-500 font-mono">{(userCoinsModal.coins_balance || 0).toLocaleString()} xu</strong>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Số Lượng Xu:</label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm font-bold font-mono text-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleAdjustCoins("add")}
                className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs"
              >
                + Cộng Thêm Xu
              </button>
              <button
                onClick={() => handleAdjustCoins("set")}
                className="py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border"
              >
                = Đặt Cố Định
              </button>
            </div>
            <button
              onClick={() => setUserCoinsModal(null)}
              className="text-xs text-muted-foreground hover:underline text-center"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: UPLOAD MEDIA */}
      {/* ============================================================== */}
      {showUploadMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-rose-500" /> Thêm Hình Ảnh Vào Thư Viện
            </h3>

            <form onSubmit={handleSaveMedia} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tên Hình Ảnh</label>
                <input
                  type="text"
                  required
                  placeholder="Ảnh bìa Conan tập 1..."
                  value={newMediaForm.name}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Đường Dẫn URL Ảnh (R2 / CDN) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://media.doctruyen.vip/covers/..."
                  value={newMediaForm.url}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Thẻ Alt (Mô tả SEO)</label>
                <input
                  type="text"
                  placeholder="Bìa truyện tranh..."
                  value={newMediaForm.alt_text}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, alt_text: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadMediaModal(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold"
                >
                  Lưu Vào Thư Viện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SEO Modal */}
      {targetAiStory && (
        <AdminAiSeoModal
          isOpen={aiSeoModalOpen}
          onClose={() => setAiSeoModalOpen(false)}
          story={targetAiStory}
          onApply={handleApplyAiSeoToForm}
        />
      )}

      {/* Multi-file Book Import Modal */}
      <AdminBookImportModal
        isOpen={showBookImportModal}
        onClose={() => setShowBookImportModal(false)}
        onSuccess={() => {
          showToast("Đã nhập sách thành công!");
          fetchBooks(1);
          fetchStats();
        }}
      />

      {/* Buff Views & Likes Modal */}
      <AdminBuffModal
        isOpen={buffModalOpen}
        onClose={() => setBuffModalOpen(false)}
        targetStory={targetBuffStory}
        selectedIds={selectedStoryIds}
        onSuccess={(msg) => {
          showToast(msg);
          if (activeTab === "books") fetchBooks(booksPage);
          else fetchStories(currentPage);
          fetchStats();
        }}
      />

      {/* Blog Editor & AI Modal */}
      <AdminBlogModal
        isOpen={showBlogModal}
        onClose={() => setShowBlogModal(false)}
        blogPost={editingBlog}
        onSuccess={() => {
          showToast("Đã lưu bài viết blog thành công!");
          fetchBlogs();
          fetchStats();
        }}
      />
    </div>
  );
}
