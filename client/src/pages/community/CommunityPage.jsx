import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { communityApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiGlobe,
  HiThumbUp,
  HiPlus,
  HiBookOpen,
  HiAcademicCap,
  HiUser
} from 'react-icons/hi';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [contentType, setContentType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [contentType]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const res = await communityApi.getPosts({ content_type: contentType || undefined });
      setPosts(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải bài viết cộng đồng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await communityApi.upvote(id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, upvote_count: res.data.upvote_count } : p))
      );
      toast.success('Đã bình chọn cho bài viết!');
    } catch (err) {
      toast.error(err.message || 'Bình chọn thất bại');
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Góc Học Tập Cộng Đồng</h1>
          <p className="text-gray-600">
            Khám phá các bài học, bộ từ vựng và bài đọc do các thành viên đóng góp sau khi đã kiểm duyệt
          </p>
        </div>

        <Link to="/community/submit" className="btn btn-primary gap-2">
          <HiPlus /> Đóng góp bài học
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 text-sm font-semibold gap-2">
        <button
          onClick={() => setContentType('')}
          className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
            contentType === '' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setContentType('vocab_set')}
          className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            contentType === 'vocab_set' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          <HiBookOpen /> Bộ từ vựng
        </button>
        <button
          onClick={() => setContentType('reading')}
          className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            contentType === 'reading' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          <HiAcademicCap /> Bài đọc hiểu
        </button>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="card p-6 border hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge bg-purple-100 text-purple-700 text-xs font-semibold capitalize">
                  {post.content_type === 'vocab_set' ? 'Bộ từ vựng' : 'Bài đọc'}
                </span>

                <button
                  onClick={() => handleUpvote(post.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 cursor-pointer bg-gray-50 hover:bg-primary-50 px-2.5 py-1 rounded-full transition-colors border"
                >
                  <HiThumbUp className="w-4 h-4" /> {post.upvote_count}
                </button>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{post.description}</p>
            </div>

            <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <HiUser className="w-3.5 h-3.5" />
                {post.author?.full_name || post.author?.username}
              </span>
              <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card text-center p-12 max-w-md mx-auto space-y-4">
          <HiGlobe className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">Chưa có bài viết nào</h3>
          <p className="text-sm text-gray-500">
            Hãy là người đầu tiên chia sẻ bộ từ vựng hoặc bài đọc hữu ích cho cộng đồng!
          </p>
          <Link to="/community/submit" className="btn btn-primary inline-flex gap-2 text-sm">
            <HiPlus /> Đóng góp ngay
          </Link>
        </div>
      )}
    </div>
  );
}
