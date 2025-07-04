import React from 'react';

/**
 * A simple button component
 */
const Button = ({ text, onClick, className }) => {
  return (
    <button 
      className={`btn ${className || ''}`} 
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
