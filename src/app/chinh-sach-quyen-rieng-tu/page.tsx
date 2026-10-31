import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  Trash2,
  Cookie,
  UserCheck,
  Mail,
  Server,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Quyền Riêng Tư | DocTruyen.VIP",
  description:
    "Chính sách quyền riêng tư, quy định bảo vệ dữ liệu cá nhân, xử lý đăng nhập Google/Facebook và hướng dẫn xóa dữ liệu người dùng trên nền tảng DocTruyen.VIP.",
  alternates: {
    canonical: "https://doctruyen.vip/chinh-sach-quyen-rieng-tu",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>

        {/* Header */}
        <header className="border-b border-border/50 pb-6 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold w-fit border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> Cam Kết Bảo Vệ Quyền Riêng Tư & GDPR / Meta Standard
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Chính Sách Quyền Riêng Tư (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Cập nhật lần cuối: Tháng 10 năm 2026 · Áp dụng cho website <strong>DocTruyen.vip</strong> và toàn bộ ứng dụng di động liên kết.
          </p>
        </header>

        {/* Content */}
        <main className="flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-500" /> 1. Cam Kết Chung & Phạm Vi Thu Thập
            </h2>
            <p>
              DocTruyen.vip tôn trọng tuyệt đối quyền riêng tư và quyền bảo mật thông tin cá nhân của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu khi bạn truy cập trang web hoặc sử dụng dịch vụ của DocTruyen.vip.
            </p>
            <p>Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Thông tin đăng nhập liên kết (Google & Facebook Login):</strong> Khi bạn lựa chọn đăng nhập nhanh bằng tài khoản Google hoặc Facebook, chúng tôi nhận các thông tin cơ bản công khai gồm: Họ tên hiển thị, địa chỉ Email và Ảnh đại diện (Avatar). Chúng tôi không bao giờ yêu cầu hay lưu trữ mật khẩu tài khoản Google/Facebook của bạn.
              </li>
              <li>
                <strong>Dữ liệu hoạt động đọc truyện:</strong> Tủ truyện cá nhân, dấu trang (bookmark), chương đã đọc, lịch sử mở khóa chương bằng xu hoặc VIP để bạn có thể đồng bộ xuyên suốt giữa các thiết bị (Máy tính, Điện thoại, Ứng dụng Android/iOS).
              </li>
              <li>
                <strong>Dữ liệu giao dịch nạp xu:</strong> Mã giao dịch đối soát, số xu nạp, thời gian giao dịch qua chuyển khoản VietQR / SePay / PayPal. Chúng tôi không bao giờ lưu trữ mật khẩu ngân hàng, mã OTP hay thông tin thẻ tín dụng nhạy cảm.
              </li>
              <li>
                <strong>Dữ liệu kỹ thuật ẩn danh:</strong> Địa chỉ IP (được mã hóa), thông tin trình duyệt, hệ điều hành nhằm tối ưu tốc độ phân phối nội dung qua CDN Cloudflare và phòng chống các cuộc tấn công DDoS.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" /> 2. Mục Đích Sử Dụng Thông Tin
            </h2>
            <p>Thông tin của người dùng được sử dụng cho các mục đích hợp pháp sau:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Duy trì tài khoản:</strong> Xác thực danh tính độc giả, quản lý số dư xu và kích hoạt gói thành viên VIP.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Đồng bộ trải nghiệm:</strong> Lưu tiến độ đọc từng chương, danh sách theo dõi và thông báo khi có chương mới.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Bảo mật & Phòng chống gian lận:</strong> Phát hiện các hành vi gian lận xu, spam bình luận hoặc tấn công phá hoại hệ thống.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Hỗ trợ kỹ thuật:</strong> Tiếp nhận phản hồi lỗi chương, hỗ trợ độc giả 24/7 khi gặp sự cố đọc hoặc nạp xu.
                </span>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" /> 3. Lưu Trữ & Bảo Mật Dữ Liệu
            </h2>
            <p>
              Toàn bộ dữ liệu người dùng được lưu trữ trên hệ sinh thái điện toán đám mây cao cấp của Supabase (PostgreSQL Enterprise) và hệ thống mạng toàn cầu Cloudflare với kết nối SSL/TLS 256-bit chuẩn quân sự.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Tuyệt đối không bán dữ liệu:</strong> Chúng tôi không bao giờ bán, cho thuê hoặc tiết lộ dữ liệu cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc tiếp thị.
              </li>
              <li>
                <strong>Kiểm soát quyền truy cập:</strong> Dữ liệu chỉ được truy cập bởi đội ngũ kỹ thuật có thẩm quyền nhằm mục đích bảo trì và khắc phục sự cố hệ thống.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Cookie className="w-5 h-5 text-amber-600" /> 4. Chính Sách Cookie & Lưu Trữ Trình Duyệt
            </h2>
            <p>
              DocTruyen.vip sử dụng Cookie và Web Storage (localStorage) để mang lại trải nghiệm tiện lợi nhất:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Cookie bắt buộc:</strong> Giữ phiên đăng nhập an toàn, lưu giỏ xu nạp và phòng chống tấn công CSRF.
              </li>
              <li>
                <strong>Cookie cá nhân hóa:</strong> Ghi nhớ chế độ đọc (Sáng/Tối), cỡ chữ phóng to/thu nhỏ, màu nền đọc truyện yêu thích.
              </li>
              <li>
                <strong>Cookie phân tích:</strong> Phối hợp cùng Google Analytics để đo lường lượng truy cập thực tế của từng bộ truyện, giúp bảng xếp hạng truyện đề cử luôn minh bạch và chính xác.
              </li>
            </ul>
            <p>
              Bạn có thể dễ dàng quản lý, từ chối hoặc điều chỉnh cài đặt cookie bất kỳ lúc nào thông qua thanh <strong>Thông báo Cookie</strong> ở chân website hoặc trong phần cài đặt trình duyệt của bạn.
            </p>
          </section>

          {/* Section 5 - USER DATA DELETION (CRITICAL FOR FACEBOOK META REVIEW) */}
          <section className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" /> 5. Hướng Dẫn Yêu Cầu Xóa Dữ Liệu Người Dùng (Data Deletion Instructions)
            </h2>
            <p className="text-foreground">
              Theo Điều khoản Nền tảng của Meta (Facebook Platform Terms) và quy định bảo vệ dữ liệu quốc tế, bạn có toàn quyền yêu cầu xóa vĩnh viễn dữ liệu tài khoản và các thông tin liên kết của bạn khỏi hệ thống DocTruyen.vip bất cứ khi nào bạn muốn:
            </p>
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="p-4 rounded-xl bg-muted/60 border border-border/60 flex flex-col gap-1.5">
                <span className="font-bold text-sm text-foreground">
                  Cách 1: Xóa trực tiếp trong trang quản lý tài khoản
                </span>
                <p className="text-xs text-muted-foreground">
                  Đăng nhập vào DocTruyen.vip &gt; Vào mục{" "}
                  <Link href="/tai-khoan" className="text-rose-500 underline font-semibold">
                    Tài Khoản
                  </Link>{" "}
                  &gt; Chọn <strong>Cài đặt tài khoản</strong> &gt; Nhấn <strong>Yêu cầu xóa tài khoản và dữ liệu</strong>. Hệ thống sẽ tiến hành xóa vĩnh viễn email, tên hiển thị, tủ truyện và lịch sử đọc sau khi bạn xác nhận.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/60 border border-border/60 flex flex-col gap-1.5">
                <span className="font-bold text-sm text-foreground">
                  Cách 2: Gỡ bỏ quyền truy cập ứng dụng trên Facebook
                </span>
                <p className="text-xs text-muted-foreground">
                  Truy cập tài khoản Facebook của bạn &gt; Vào <strong>Cài đặt & Quyền riêng tư</strong> &gt; <strong>Cài đặt</strong> &gt; <strong>Ứng dụng và trang web</strong> &gt; Tìm ứng dụng <strong>DocTruyen.VIP</strong> &gt; Nhấn <strong>Gỡ</strong>. Bạn cũng có thể chọn ô yêu cầu Facebook thông báo cho DocTruyen.vip xóa dữ liệu đã liên kết.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/60 border border-border/60 flex flex-col gap-1.5">
                <span className="font-bold text-sm text-foreground">
                  Cách 3: Gửi yêu cầu qua Email quản trị
                </span>
                <p className="text-xs text-muted-foreground">
                  Gửi email trực tiếp từ địa chỉ bạn đã đăng ký tới:{" "}
                  <a href="mailto:contact@doctruyen.vip" className="text-rose-500 font-bold underline">
                    contact@doctruyen.vip
                  </a>{" "}
                  hoặc{" "}
                  <a href="mailto:admin@doctruyen.vip" className="text-rose-500 font-bold underline">
                    admin@doctruyen.vip
                  </a>{" "}
                  với tiêu đề <em>&quot;Yêu cầu xóa dữ liệu tài khoản DocTruyen.VIP&quot;</em>. Đội ngũ kỹ thuật của chúng tôi sẽ xử lý và gửi xác nhận xóa hoàn tất trong vòng tối đa 24 giờ làm việc.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-500" /> 6. Thông Tin Liên Hệ & Giải Đáp Thắc Mắc
            </h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc khiếu nại nào liên quan đến Chính sách quyền riêng tư này hoặc quy trình xử lý dữ liệu của DocTruyen.vip, vui lòng liên hệ với chúng tôi qua:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Nền tảng:</strong> DocTruyen.VIP – Cổng đọc truyện trực tuyến bản quyền & cộng đồng.
              </li>
              <li>
                <strong>Email hỗ trợ chính thức:</strong>{" "}
                <a href="mailto:contact@doctruyen.vip" className="text-rose-500 font-bold underline">
                  contact@doctruyen.vip
                </a>
              </li>
              <li>
                <strong>Trang liên hệ trực tiếp:</strong>{" "}
                <Link href="/lien-he" className="text-rose-500 font-bold underline">
                  https://doctruyen.vip/lien-he
                </Link>
              </li>
              <li>
                <strong>Địa chỉ website:</strong> https://doctruyen.vip
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
