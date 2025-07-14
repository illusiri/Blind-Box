import React, { useState, useEffect } from 'react';
import ProductDisplay from '../../components/ProductDisplay/ProductDisplay';
import './Home.css';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // 添加搜索状态
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

  // 获取商品列表
  const fetchProducts = async (page = 1, search = '') => {
    setLoading(true);
    setError('');
    
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        setError(data.error || '获取商品列表失败');
      }
    } catch (err) {
      console.error('获取商品列表错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1, searchTerm); // 搜索时重置到第一页
  };

  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchTerm('');
    fetchProducts(1, ''); // 重新获取所有商品
  };

  // 处理购买
  const handleBuy = async (product) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const confirmed = window.confirm(
      `确定要购买 "${product.name}" 吗？\n价格: ¥${product.price}\n卖家: ${product.seller_username}`
    );

    if (confirmed) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            buyer_id: currentUser.id,
            seller_id: product.user_id,
            product_id: product.id,
            price: product.price
          })
        });

        const data = await response.json();

        if (response.ok) {
          // 显示获得的奖励
          if (data.reward) {
            alert(`购买成功！\n您获得了：${data.reward.name}\n请前往订单页面查看详情。`);
          } else {
            alert('购买成功！请前往订单页面查看详情。');
          }
          // 刷新商品列表
          fetchProducts(pagination.current_page, searchTerm);
        } else {
          alert(data.error || '购买失败，请重试');
        }
      } catch (err) {
        console.error('购买错误:', err);
        alert('购买失败，请检查网络连接');
      }
    }
  };

  // 处理分页
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchProducts(newPage, searchTerm);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">
          {error}
          <button onClick={() => fetchProducts(1, searchTerm)} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>商品市场</h1>
        <p>发现更多精彩的盲盒商品</p>
      </div>

      {/* 搜索区域 */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="搜索商品名称或卖家..."
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="clear-search-button"
                title="清空搜索"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="search-button">
            搜索
          </button>
        </form>
        
        {searchTerm && (
          <div className="search-info">
            搜索 "{searchTerm}" 的结果：共找到 {pagination.total_items} 个商品
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <div>
              <p>没有找到匹配 "{searchTerm}" 的商品</p>
              <button onClick={clearSearch} className="clear-search-link">
                查看所有商品
              </button>
            </div>
          ) : (
            <p>暂时没有商品</p>
          )}
        </div>
      ) : (
        <>
          <div className="products-list">
            {products.map(product => (
              <ProductDisplay
                key={product.id}
                product={product}
                currentUser={currentUser}
                onBuy={handleBuy}
              />
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
                （共 {pagination.total_items} 个商品）
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
    </div>
  );
}
