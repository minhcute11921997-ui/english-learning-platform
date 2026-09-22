import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { communityApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { HiArrowLeft, HiShieldCheck } from 'react-icons/hi';

export default function CommunitySubmitPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content_type: 'vocab_set',
    title: '',
    description: '',
    raw_content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await communityApi.submitPost({
        content_type: formData.content_type,
        title: formData.title,
        description: `${formData.description}\n\nNội dung chi tiết:\n${formData.raw_content}`
      });
      toast.success('Gửi bài thành công! Bài viết sẽ được hiển thị sau khi ban quản trị phê duyệt.');
      navigate('/community');
    } catch (err) {
      toast.error(err.message || 'Gửi bài thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600"
      >
        <HiArrowLeft /> Quay lại trang cộng đồng
      </Link>

      <div className="card p-6 sm:p-8 space-y-6 border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đóng Góp Bài Học Cho Cộng Đồng</h1>
          <p className="text-sm text-gray-600">
            Nội dung do bạn chia sẻ sẽ được ban quản trị kiểm duyệt tính chính xác trước khi xuất bản cho tất cả mọi người cùng học.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Loại nội dung chia sẻ</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer text-center text-sm font-semibold transition-all ${
                  formData.content_type === 'vocab_set'
                    ? 'border-primary-600 bg-primary-50 text-primary-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="content_type"
                  value="vocab_set"
                  checked={formData.content_type === 'vocab_set'}
                  onChange={() => setFormData({ ...formData, content_type: 'vocab_set' })}
                  className="sr-only"
                />
                Bộ từ vựng
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer text-center text-sm font-semibold transition-all ${
                  formData.content_type === 'reading'
                    ? 'border-primary-600 bg-primary-50 text-primary-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="content_type"
                  value="reading"
                  checked={formData.content_type === 'reading'}
                  onChange={() => setFormData({ ...formData, content_type: 'reading' })}
                  className="sr-only"
                />
                Bài đọc hiểu
              </label>
            </div>
          </div>

          <Input
            label="Tiêu đề bài viết / Bộ từ vựng"
            placeholder="Ví dụ: Bộ từ vựng du lịch thông dụng, Bài đọc về mùa thu..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="label">Mô tả ngắn</label>
            <textarea
              className="input h-20 resize-none text-sm"
              placeholder="Giới thiệu nội dung, đối tượng phù hợp..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Chi tiết nội dung (Từ vựng hoặc Đoạn văn kèm câu hỏi)</label>
            <textarea
              className="input h-48 resize-none font-mono text-xs"
              placeholder="Nhập danh sách từ vựng kèm nghĩa tiếng Việt, hoặc đoạn văn tiếng Anh và các câu hỏi trắc nghiệm..."
              value={formData.raw_content}
              onChange={(e) => setFormData({ ...formData, raw_content: e.target.value })}
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-start gap-2">
            <HiShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Quy định kiểm duyệt: Vui lòng không chia sẻ nội dung vi phạm thuần phong mỹ tục hoặc bản quyền. Ban quản trị sẽ rà soát và phản hồi trong thời gian sớm nhất.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/community')}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Gửi kiểm duyệt
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
