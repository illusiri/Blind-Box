import React from 'react';
import './ProductDisplay.css';

export default function ProductDisplay({ product, onBuy, currentUser }) {
  // 内联base64占位符图片，避免404循环
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNhYWEiPuebkeWQrOebuOWFs+Wbvue7hDwvdGV4dD48L3N2Zz4=';
  
  const handleBuyClick = () => {
    if (!currentUser) {
      alert('请先登录再购买商品');
      return;
    }
    
    if (currentUser.id === product.user_id) {
      alert('不能购买自己的商品');
      return;
    }
    
    onBuy(product);
  };

  // 确定显示的图片 - 优先显示封面图片，如果没有则使用占位符
  const displayImage = product.cover_image || fallbackImage;
  const isOutOfStock = product.remaining_quantity <= 0;

  return (
    <div className="product-display">
      <div className="product-display-image">
        <img 
          src={displayImage} 
          alt={product.name}
          onError={(e) => {
            // 防止无限循环：使用内联base64图片
            if (e.target.src !== fallbackImage) {
              e.target.src = fallbackImage;
            }
          }}
        />
        {isOutOfStock && <div className="out-of-stock-overlay">已售完</div>}
      </div>
      
      <div className="product-display-info">
        <h3 className="product-display-title">{product.name}</h3>
        <p className="product-display-description">{product.description}</p>
        
        <div className="product-display-details">
          <div className="product-display-quantity">
            <span className="label">剩余数量:</span>
            <span className="value">{product.remaining_quantity}/{product.total_quantity}</span>
          </div>
          
          <div className="product-display-seller">
            <span className="label">卖家:</span>
            <span className="value">{product.seller_username}</span>
          </div>
          
          <div className="product-display-time">
            <span className="label">发布时间:</span>
            <span className="value">{new Date(product.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="product-display-footer">
          <div className="product-display-price">¥{product.price}</div>
          <button 
            className={`buy-button ${isOutOfStock ? 'disabled' : ''}`}
            onClick={handleBuyClick}
            disabled={currentUser && currentUser.id === product.user_id || isOutOfStock}
          >
            {currentUser && currentUser.id === product.user_id 
              ? '自己的商品' 
              : isOutOfStock 
                ? '已售完' 
                : '立即购买'
            }
          </button>
        </div>
      </div>
    </div>
  );
}