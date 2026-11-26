import { Link } from 'react-router-dom';
import Brand from '../../components/layout/Brand';

export default function LegalPage({ mode = 'privacy' }) {
  const isPrivacy = mode === 'privacy';

  return (
    <div className="min-h-screen bg-[#fffcf6] text-slate-800 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Brand />
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/terms" className={!isPrivacy ? 'text-blue-700 font-bold' : 'text-slate-600 hover:underline'}>
              Điều khoản
            </Link>
            <Link to="/privacy" className={isPrivacy ? 'text-blue-700 font-bold' : 'text-slate-600 hover:underline'}>
              Bảo mật
            </Link>
            <Link to="/" className="text-blue-600 hover:underline">
              Trang chủ →
            </Link>
          </div>
        </div>

        <article className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-9 shadow-sm space-y-5">
          <h1 className="page-title">
            {isPrivacy ? 'Chính sách Bảo mật (Privacy Policy)' : 'Điều khoản Sử dụng (Terms of Service)'}
          </h1>
          <p className="text-xs text-slate-500">Cập nhật lần cuối: 26/11/2026</p>

          {isPrivacy ? (
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">1. Dữ liệu chúng tôi thu thập</h2>
                <p>
                  EngLearn chỉ lưu trữ thông tin cần thiết để vận hành tài khoản và cá nhân hóa việc học: tên đăng nhập, địa chỉ email, họ tên, mục tiêu học tập, tiến độ ôn tập SM-2 và danh sách từ vựng cá nhân do bạn tạo.
                </p>
              </section>
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">2. Xử lý hình ảnh AI Vision</h2>
                <p>
                  Hình ảnh bạn tải lên công cụ nhận diện tranh/tác phẩm mỹ nghệ được xử lý tạm thời trong bộ nhớ để trả kết quả thuật ngữ. Hệ thống chỉ lưu mã băm SHA-256 khi bạn chủ động gửi phản hồi cải thiện độ chính xác.
                </p>
              </section>
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">3. Quyền kiểm soát dữ liệu của bạn</h2>
                <p>
                  Tại trang <strong>Hồ sơ học tập</strong>, bạn có thể tải xuống toàn bộ dữ liệu cá nhân dưới dạng JSON hoặc xóa vĩnh viễn tài khoản của mình bất kỳ lúc nào.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">1. Phạm vi sử dụng</h2>
                <p>
                  EngLearn.art là nền tảng giáo dục hỗ trợ học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công Mỹ nghệ. Bạn cam kết sử dụng hệ thống cho mục đích học tập và không thực hiện hành vi tấn công, thu thập dữ liệu trái phép hoặc tải lên nội dung vi phạm pháp luật.
                </p>
              </section>
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">2. Bảo mật tài khoản</h2>
                <p>
                  Bạn có trách nhiệm bảo vệ mật khẩu của mình. Hệ thống sẽ tự động tạm khóa đăng nhập trong 15 phút nếu phát hiện nhập sai mật khẩu liên tiếp quá 5 lần để bảo vệ tài khoản.
                </p>
              </section>
              <section className="space-y-1.5">
                <h2 className="font-bold text-slate-900">3. Bản quyền nội dung</h2>
                <p>
                  Các hình ảnh minh họa tác phẩm mỹ thuật và định nghĩa từ điển đều ghi rõ nguồn tham chiếu (Oxford Art, Tate, MoMA, Wikimedia Commons) phục vụ mục đích học tập phi thương mại.
                </p>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
