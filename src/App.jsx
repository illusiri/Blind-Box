import './App.css';
import Header from './components/Header/Header.jsx';
import './components/Header/Header.css';
import React from 'react';
import Home from './pages/Home/Home.jsx';
import './pages/Home/Home.css';
import Order from './pages/Orders/orders.jsx';
import './pages/Orders/orders.css';
import Community from './pages/Community/community.jsx';
import './pages/Community/community.css';
import Sign from './pages/Sign/sign.jsx'; 
import PropTypes from 'prop-types';


import homeIcon from './assets/icons/home.png'; 
import profileIcon from './assets/icons/profile.png';
import orderIcon from './assets/icons/order.png';
import communityIcon from './assets/icons/community.png';

function Sidebar({ setPageIndex, pageIndex }) { 
  function handleMenuClick(index) {
    setPageIndex(index);
  }
  
  const menuItems = [
    { id: 1, name: "首页", icon: homeIcon },
    { id: 2, name: "我的", icon: profileIcon },
    { id: 3, name: "订单", icon: orderIcon },
    { id: 4, name: "社区", icon: communityIcon },
  ];

  return (
    <div className="sidebar">
      <ul>
        {menuItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => handleMenuClick(item.id)} 
            className={`sidebar-menu-item ${pageIndex === item.id ? 'active' : ''}`}
          >
            <img src={item.icon} alt={item.name} className="sidebar-icon" />
            <span className="sidebar-text">{item.name}</span>
          </button>
        ))}
      </ul>
    </div>
  );
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
    <Sidebar pageIndex={pageIndex} setPageIndex={setPageIndex} /> 
    <div className="content-area">
      <Header />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  </div>
  
}

export default App
