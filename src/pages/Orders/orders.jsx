import React, { useState, useEffect } from 'react';
import './orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取当前用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchUserOrders(user.id);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setError('请重新登录');
      }
    } else {
      setError('请先登录查看订单');
      setLoading(false);
    }
  }, []);

  // 获取用户订单列表
  const fetchUserOrders = async (userId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/user/${userId}/orders`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data);
      } else {
        setError(data.error || '获取订单列表失败');
      }
    } catch (err) {
      console.error('获取订单列表错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '未知时间';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '时间格式错误';
    }
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const subProductName = order.sub_product_name || '';
    const sellerUsername = order.seller_username || '';
    const searchLower = searchTerm.toLowerCase();
    
    return subProductName.toLowerCase().includes(searchLower) ||
           sellerUsername.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <div className="error-message">
          {error}
          {currentUser && (
            <button 
              onClick={() => fetchUserOrders(currentUser.id)} 
              className="retry-button"
            >
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>我的订单</h1>
        <p>查看您的购买记录</p>
      </div>

      <div className="orders-controls">
        <input
          type="text"
          placeholder="搜索商品名称或卖家..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          {orders.length === 0 ? (
            <p>您还没有任何订单</p>
          ) : (
            <p>没有找到匹配的订单</p>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.order_id} 
              order={order} 
              formatDate={formatDate} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 订单卡片组件
function OrderCard({ order, formatDate }) {
  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-id">订单号: #{order.order_id}</div>
        <div className="order-date">{formatDate(order.purchase_time)}</div>
      </div>
      
      <div className="order-content">
        <div className="order-item">
          <div className="item-image">
            <img src={order.sub_product_image} alt={order.sub_product_name} onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNhYWEiPuebkeWQrOebuOWFs+Wbvue7hDwvdGV4dD48L3N2Zz4=';
            }} />
          </div>
          <div className="item-details">
            <h3 className="item-name">{order.sub_product_name}</h3>
            <p className="product-name">
              <span className="label">盲盒:</span>
              <span className="value">{order.product_name}</span>
            </p>
            <p className="seller-info">
              <span className="label">卖家:</span>
              <span className="value">{order.seller_username}</span>
            </p>
          </div>
        </div>
        
        <div className="order-price">
          <span className="price">¥{Number(order.price).toFixed(2)}</span>
          <div className="order-status completed">已完成</div>
        </div>
      </div>
    </div>
  );
}



