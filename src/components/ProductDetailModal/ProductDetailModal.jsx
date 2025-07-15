import React, { useState } from 'react';
import './ProductDetailModal.css';

export default function ProductDetailModal({ isOpen, onClose, product, onBuy, currentUser, purchaseResult }) {
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const isOutOfStock = product?.remaining_quantity <= 0;
  const isOwnProduct = currentUser && product && currentUser.id === product.user_id;
  
  const handleBuyClick = async () => {
    setLoading(true);
    await onBuy(product);
    setLoading(false);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        {purchaseResult ? (
          // 展示购买结果
          <div className="purchase-result">
            <h2>购买成功！</h2>
            <div className="reward-display">
              <img 
                src={purchaseResult.image} 
                alt={purchaseResult.name}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPuWbvueJh+aAgOeUqDwvdGV4dD48L3N2Zz4=';
                }} 
                className="reward-image" 
              />
              <h3 className="reward-name">您获得了：{purchaseResult.name}</h3>
            </div>
            <p className="result-hint">请前往订单页面查看详情</p>
            <button className="continue-button" onClick={onClose}>确认</button>
          </div>
        ) : (
          // 展示商品详情
          <div className="product-detail">
            <div className="product-detail-header">
              <h2>{product?.name}</h2>
            </div>
            
            <div className="product-detail-body">
              <div className="product-image-container">
                <img 
                  src={product?.cover_image} 
                  alt={product?.name}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPuWbvueJh+aAgOeUqDwvdGV4dD48L3N2Zz4=';
                  }} 
                  className="product-detail-image" 
                />
              </div>
              
              <div className="product-info-container">
                <p className="product-description">{product?.description}</p>
                
                <div className="product-meta">
                  <div className="meta-item">
                    <span className="label">卖家:</span>
                    <span className="value">{product?.seller_username}</span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="label">剩余数量:</span>
                    <span className="value">{product?.remaining_quantity}/{product?.total_quantity}</span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="label">发布时间:</span>
                    <span className="value">{product && new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="product-price">¥{product?.price}</div>
                
                <button 
                  className={`buy-button ${isOutOfStock || isOwnProduct ? 'disabled' : ''}`}
                  onClick={handleBuyClick}
                  disabled={isOutOfStock || isOwnProduct || loading || !currentUser}
                >
                  {!currentUser 
                    ? '请先登录' 
                    : isOwnProduct 
                      ? '自己的商品' 
                      : isOutOfStock 
                        ? '已售完' 
                        : loading 
                          ? '购买中...' 
                          : '立即购买'
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}