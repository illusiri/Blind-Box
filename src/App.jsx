import './App.css'
import Header from './components/Header/Header.jsx'
import './components/Header/Header.css'
import React from 'react'
import Home from './pages/Home/Home.jsx';
import './pages/Home/Home.css';
import Order from './pages/Orders/orders.jsx';
import './pages/Orders/orders.css';
import Community from './pages/Community/community.jsx';
import './pages/Community/community.css';
import Sign from './pages/Sign/sign.jsx'; // 导入新的登录组件
import PropTypes from 'prop-types'


function Sidebar({ setPageIndex, pageIndex }) { // 添加pageIndex属性

  function handleMenuClick(index) {
        setPageIndex(index);
    }
    const menuItems = [
        { id: 1, name: "首页"},
        { id: 2, name: "我的"},
        { id: 3, name: "订单"},
        { id: 4, name: "社区"},
    ]

    return <div className="sidebar">
        <h2>导航菜单</h2>       
       
        <ul>
            {menuItems.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleMenuClick(item.id)} 
                  className={`sidebar-menu-item ${pageIndex === item.id ? 'active' : ''}`}
                >
                    {item.name}
                </button>
            ))}
        </ul>
    </div>
} 

Sidebar.propTypes = {
  pageIndex: PropTypes.number.isRequired,
  setPageIndex: PropTypes.func.isRequired
};

function App() {
  const [pageIndex, setPageIndex] = React.useState(1);

  const renderPage = () => {
    switch (pageIndex) {
      case 1:
        return <Home />;
      case 2:
        return <Sign />; 
      case 3:
        return <Order />;
      case 4:
        return <Community />;
      default:
        return <Home />;
    }
  };

  return <div className="app-container">
    <Sidebar pageIndex={pageIndex} setPageIndex={setPageIndex} /> {/* 传递pageIndex */}
    <div className="content-area">
      <Header />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  </div>
  
}

export default App
