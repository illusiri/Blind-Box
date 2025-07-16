import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './ImageUpload.css';

export default function ImageUpload({ onImageSelect, selectedImage }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        onImageSelect(data.imageUrl);
      } else {
        alert(data.error || '图片上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">商品图片</label>
      
      {selectedImage ? (
        <div className="image-preview">
          <img src={selectedImage} alt="商品预览" className="preview-image" />
          <div className="image-actions">
            <button 
              type="button" 
              onClick={handleClick}
              className="change-image-button"
              disabled={uploading}
            >
              {uploading ? '上传中...' : '更换图片'}
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="uploading">
              <div className="spinner"></div>
              <p>上传中...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p>点击选择图片或拖拽图片到此处</p>
              <p className="upload-hint">支持 JPG、PNG、GIF 格式，最大 5MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

ImageUpload.propTypes = {
  onImageSelect: PropTypes.func.isRequired,
  selectedImage: PropTypes.string
};