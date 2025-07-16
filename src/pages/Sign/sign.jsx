import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ProductCard from '../../components/ProductCard/ProductCard';
import AddProductModal from '../../components/AddProductModal/AddProductModal';
import './Sign.css';

export default function Sign() {
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 检查用户是否已登录
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchUserProducts(user.id);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 获取用户商品列表
  const fetchUserProducts = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}/products`);
      const data = await response.json();
      
      if (response.ok) {
        setUserProducts(data);
      } else {
        console.error('获取商品列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取商品列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除商品
  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除商品失败');
      }

      // 从本地状态中移除已删除的商品
      setUserProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );

      alert('商品删除成功');
    } catch (error) {
      console.error('删除商品错误:', error);
      throw error; // 重新抛出错误
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserProducts([]);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    fetchUserProducts(user.id);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleProductAdded = () => {
    // 刷新商品列表
    if (currentUser) {
      fetchUserProducts(currentUser.id);
    }
  };

  if (currentUser) {
    return (
      <div className="profile-container">
        <h2>个人中心</h2>
        <div className="user-info">
          <p><strong>用户名:</strong> {currentUser.username}</p>
          <p><strong>邮箱:</strong> {currentUser.email}</p>
          <p><strong>注册时间:</strong> {new Date(currentUser.created_at).toLocaleString()}</p>
        </div>
        
        <div className="user-products-section">
          <h3>我的商品</h3>
          {loading ? (
            <p>加载中...</p>
          ) : (
            <div className="products-grid">
              {userProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  showDelete={true}
                  onDelete={handleDeleteProduct}
                />
              ))}
              <ProductCard 
                isAddNew={true} 
                onAddClick={handleAddProduct}
              />
            </div>
          )}
        </div>
        
        <button onClick={handleLogout} className="logout-button">退出登录</button>
        
        <AddProductModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSubmit={handleProductAdded}
          userId={currentUser.id}
        />
      </div>
    );
  }

  return (
    <div className="sign-container">
      {isLogin ? (
        <Login 
          onSwitchToRegister={() => setIsLogin(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}