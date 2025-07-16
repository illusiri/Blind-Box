import React from 'react';
import './Header.css';

import hechengyuIcon from '../../assets/hechengyu.png';

export default function Header() {
   return (
      <div className="header">
         <div className="header-content">
            <img src={hechengyuIcon} alt="Logo" className="header-icon" />
            <h1>illusiri的妙妙商店</h1>
            <img src={hechengyuIcon} alt="Logo" className="header-icon" />
         </div>
      </div>
   );
}
