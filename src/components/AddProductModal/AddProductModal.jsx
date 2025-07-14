import React, { useState } from 'react';
import ImageGallery from '../ImageGallery/ImageGallery';
import './AddProductModal.css';

export default function AddProductModal({ isOpen, onClose, onSubmit, userId }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cover_image: '' // 统一使用cover_image作为封面图片字段
  });
  const [subProducts, setSubProducts] = useState([{ name: '', image_url: '', quantity: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [selectingCoverImage, setSelectingCoverImage] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubProductChange = (index, field, value) => {
    const updatedSubProducts = [...subProducts];
    updatedSubProducts[index][field] = value;
    setSubProducts(updatedSubProducts);
  };

  const addSubProduct = () => {
    if (subProducts.length < 10) {
      setSubProducts([...subProducts, { name: '', image_url: '', quantity: '' }]);
    }
  };

  const removeSubProduct = (index) => {
    if (subProducts.length > 1) {
      const updatedSubProducts = subProducts.filter((_, i) => i !== index);
      setSubProducts(updatedSubProducts);
    }
  };

  const handleImageSelect = (imageUrl) => {
    if (selectingCoverImage) {
      setFormData(prev => ({
        ...prev,
        cover_image: imageUrl
      }));
      setSelectingCoverImage(false);
    } else if (currentImageIndex !== null) {
      handleSubProductChange(currentImageIndex, 'image_url', imageUrl);
    }
    setShowGallery(false);
  };

  const openImageGallery = (index = null, isCover = false) => {
    if (isCover) {
      setSelectingCoverImage(true);
      setCurrentImageIndex(null);
    } else {
      setCurrentImageIndex(index);
      setSelectingCoverImage(false);
    }
    setShowGallery(true);
  };

  const validateForm = () => {
    if (!formData.name || !formData.description || !formData.price) {
      setError('请填写所有基本信息');
      return false;
    }

    if (subProducts.length < 2) {
      setError('盲盒至少需要2个子商品');
      return false;
    }

    for (let i = 0; i < subProducts.length; i++) {
      const sub = subProducts[i];
      if (!sub.name || !sub.image_url || !sub.quantity) {
        setError(`请完善第${i + 1}个子商品的信息`);
        return false;
      }
      if (parseInt(sub.quantity) <= 0) {
        setError(`第${i + 1}个子商品数量必须大于0`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          ...formData,
          price: parseFloat(formData.price),
          sub_products: subProducts.map(sub => ({
            ...sub,
            quantity: parseInt(sub.quantity)
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加商品失败');
      }

      setFormData({
        name: '',
        description: '',
        price: '',
        cover_image: ''
      });
      setSubProducts([{ name: '', image_url: '', quantity: '' }]);

      onSubmit();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>创建盲盒商品</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="add-product-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-section">
              <h3>基本信息</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">盲盒名称</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">价格</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">盲盒描述</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>

              {/* 封面图片选择 */}
              <div className="form-group">
                <label>盲盒封面图片（可选）</label>
                <div className="image-upload-section">
                  {formData.cover_image ? (
                    <div className="image-preview-small">
                      <img src={formData.cover_image} alt="封面预览" />
                      <button
                        type="button"
                        onClick={() => openImageGallery(null, true)}
                        className="change-image-small"
                      >
                        更换封面
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                        className="remove-image-small"
                      >
                        移除封面
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openImageGallery(null, true)}
                      className="select-image-button"
                    >
                      选择封面图片
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="sub-products-header">
                <h3>子商品配置</h3>
                <button
                  type="button"
                  onClick={addSubProduct}
                  className="add-sub-product-button"
                  disabled={subProducts.length >= 10}
                >
                  + 添加子商品
                </button>
              </div>

              <div className="sub-products-list">
                {subProducts.map((subProduct, index) => (
                  <div key={index} className="sub-product-item">
                    <div className="sub-product-header">
                      <span className="sub-product-title">子商品 {index + 1}</span>
                      {subProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubProduct(index)}
                          className="remove-sub-product"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    <div className="sub-product-form">
                      <div className="form-group">
                        <label>商品名称</label>
                        <input
                          type="text"
                          value={subProduct.name}
                          onChange={(e) => handleSubProductChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>数量</label>
                        <input
                          type="number"
                          value={subProduct.quantity}
                          onChange={(e) => handleSubProductChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>商品图片</label>
                        <div className="image-upload-section">
                          {subProduct.image_url ? (
                            <div className="image-preview-small">
                              <img src={subProduct.image_url} alt="商品预览" />
                              <button
                                type="button"
                                onClick={() => openImageGallery(index)}
                                className="change-image-small"
                              >
                                更换
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openImageGallery(index)}
                              className="select-image-button"
                            >
                              选择图片
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                取消
              </button>
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? '创建中...' : '创建盲盒'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImageGallery
        isOpen={showGallery}
        onClose={() => {
          setShowGallery(false);
          setCurrentImageIndex(null);
          setSelectingCoverImage(false);
        }}
        onImageSelect={handleImageSelect}
      />
    </>
  );
}