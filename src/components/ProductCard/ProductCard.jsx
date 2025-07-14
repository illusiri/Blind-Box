import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ProductCard.css';

export default function ProductCard({ product, isAddNew = false, onAddClick, onDelete, showDelete = false }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation(); // 防止事件冒泡
    
    if (window.confirm('确定要删除这个商品吗？此操作不可撤销。')) {
      setIsDeleting(true);
      try {
        await onDelete(product.id);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isAddNew) {
    return (
      <div className="product-card add-new-card" onClick={onAddClick}>
        <div className="add-new-content">
          <div className="add-icon">+</div>
          <p>添加新商品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-card">
      {showDelete && (
        <button 
          className={`delete-button ${isDeleting ? 'deleting' : ''}`}
          onClick={handleDelete}
          disabled={isDeleting}
          title="删除商品"
        >
          {isDeleting ? '删除中...' : '×'}
        </button>
      )}
      <img src={product.item_image} alt={product.item_name} className="product-image" />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-item">
          <span className="item-label">商品:</span>
          <span className="item-name">{product.item_name}</span>
        </div>
        <div className="product-price">¥{product.price}</div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    item_image: PropTypes.string,
    item_name: PropTypes.string
  }),
  isAddNew: PropTypes.bool,
  onAddClick: PropTypes.func,
  onDelete: PropTypes.func,
  showDelete: PropTypes.bool
};