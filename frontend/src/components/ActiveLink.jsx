import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ActiveLink = ({ to, children, className }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`${className} ${isActive ? 'active-link' : ''}`}>
      {children}
    </Link>
  );
};

export default ActiveLink;
