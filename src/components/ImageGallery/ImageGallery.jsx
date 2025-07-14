import React, { useState, useEffect } from 'react';
import ImageUpload from '../ImageUpload/ImageUpload';
import './ImageGallery.css';

export default function ImageGallery({ isOpen, onClose, onImageSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      
      if (response.ok) {
        setImages(data);
      } else {
        console.error('获取图片列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取图片列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
      onClose();
      setSelectedImage(null);
    }
  };

  const handleImageUpload = (imageUrl) => {
    // 刷新图片列表
    fetchImages();
    // 自动选择刚上传的图片
    setSelectedImage(imageUrl);
    setShowUpload(false);
  };

  const handleDelete = async (filename) => {
    if (window.confirm('确定要删除这张图片吗？')) {
      try {
        const response = await fetch(`/api/upload/${filename}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setImages(images.filter(img => img.filename !== filename));
          if (selectedImage && selectedImage.includes(filename)) {
            setSelectedImage(null);
          }
        } else {
          alert('删除失败');
        }
      } catch (error) {
        console.error('删除图片错误:', error);
        alert('删除失败');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <h3>选择图片</h3>
          <div className="gallery-actions">
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="upload-toggle-button"
            >
              {showUpload ? '取消上传' : '上传新图片'}
            </button>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>
        
        {showUpload && (
          <div className="upload-section">
            <ImageUpload onImageSelect={handleImageUpload} />
          </div>
        )}
        
        <div className="gallery-content">
          {loading ? (
            <div className="gallery-loading">加载中...</div>
          ) : (
            <div className="images-grid">
              {images.map((image) => (
                <div 
                  key={image.filename} 
                  className={`image-item ${selectedImage === image.url ? 'selected' : ''}`}
                  onClick={() => handleImageClick(image.url)}
                >
                  <img src={image.url} alt={image.filename} />
                  <div className="image-overlay">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.filename);
                      }}
                      className="delete-image"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="gallery-footer">
          <button onClick={onClose} className="cancel-gallery">取消</button>
          <button 
            onClick={handleConfirm} 
            className="confirm-gallery"
            disabled={!selectedImage}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}