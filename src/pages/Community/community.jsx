import React, { useState, useEffect } from 'react';
import ImageGallery from '../../components/ImageGallery/ImageGallery';
import './Community.css';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image_url: '' });
  const [posting, setPosting] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0
  });

  // 获取当前用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }, []);

  // 获取帖子列表
  const fetchPosts = async (page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/community/posts?page=${page}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setPosts(data.posts);
        setPagination(data.pagination);
      } else {
        setError(data.error || '获取帖子失败');
      }
    } catch (err) {
      console.error('获取帖子错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 创建帖子
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    if (!newPost.content.trim()) {
      alert('请输入帖子内容');
      return;
    }

    setPosting(true);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          content: newPost.content.trim(),
          image_url: newPost.image_url || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 重置表单
        setNewPost({ content: '', image_url: '' });
        setShowCreatePost(false);
        // 刷新帖子列表
        fetchPosts(1);
        alert('帖子发布成功！');
      } else {
        alert(data.error || '发布失败');
      }
    } catch (err) {
      console.error('发布帖子错误:', err);
      alert('发布失败，请检查网络连接');
    } finally {
      setPosting(false);
    }
  };

  // 处理图片选择
  const handleImageSelect = (imageUrl) => {
    setNewPost({ ...newPost, image_url: imageUrl });
  };

  // 格式化时间
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理分页
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchPosts(newPage);
    }
  };

  if (loading) {
    return (
      <div className="community-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-container">
        <div className="error">
          {error}
          <button onClick={() => fetchPosts()} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="community-container">
      <div className="community-header">
        <h1>社区广场</h1>
        <p>分享你的盲盒收藏和心得</p>
      </div>

      {/* 发帖区域 */}
      {currentUser ? (
        <div className="create-post-section">
          {!showCreatePost ? (
            <button 
              onClick={() => setShowCreatePost(true)}
              className="create-post-button"
            >
              + 发布新帖子
            </button>
          ) : (
            <form onSubmit={handleCreatePost} className="create-post-form">
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="分享你的想法..."
                className="post-content-input"
                rows="4"
                required
              />
              
              {newPost.image_url && (
                <div className="post-image-preview">
                  <img src={newPost.image_url} alt="帖子图片" />
                  <button
                    type="button"
                    onClick={() => setNewPost({ ...newPost, image_url: '' })}
                    className="remove-image-button"
                  >
                   x
                  </button>
                </div>
              )}
              
              <div className="post-actions">
                <button
                  type="button"
                  onClick={() => setShowImageGallery(true)}
                  className="add-image-button"
                >
                  添加图片
                </button>
                
                <div className="post-submit-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPost({ content: '', image_url: '' });
                    }}
                    className="cancel-post-button"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={posting}
                    className="submit-post-button"
                  >
                    {posting ? '发布中...' : '发布'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="login-prompt">
          <p>请登录后发布帖子</p>
        </div>
      )}

      {/* 帖子列表 */}
      {posts.length === 0 ? (
        <div className="empty-state">
          <p>还没有人发布帖子</p>
        </div>
      ) : (
        <>
          <div className="posts-list">
            {posts.map(post => (
              <PostCard key={post.id} post={post} formatDate={formatDate} />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="pagination-button"
              >
                上一页
              </button>
              
              <span className="pagination-info">
                第 {pagination.current_page} 页 / 共 {pagination.total_pages} 页
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className="pagination-button"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      <ImageGallery
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onImageSelect={handleImageSelect}
      />
    </div>
  );
}

// 帖子卡片组件
function PostCard({ post, formatDate }) {
  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <span className="author-name">{post.username}</span>
          <span className="post-time">{formatDate(post.created_at)}</span>
        </div>
      </div>
      
      <div className="post-content">
        <p>{post.content}</p>
        {post.image_url && (
          <div className="post-image">
            <img src={post.image_url} alt="帖子图片" />
          </div>
        )}
      </div>
    </div>
  );
}