import React from 'react';
import './FamilyTree.css';

const FamilyMember = ({ member, isSelected, onSelect, onDragStart, onDoubleClick }) => {
  const { id, name, birthYear, details, x, y } = member;
  
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (e.button === 0) { // Bal egérgomb
      onSelect(id);
      onDragStart(id, e.clientX, e.clientY);
    }
  };

  return (
    <div 
      className={`family-member ${isSelected ? 'selected' : ''}`}
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <div className="member-header">
        <span className="member-name">{name}</span>
        <span className="member-birth"> ({birthYear})</span>
      </div>
      <div className="member-details">
        {details}
      </div>
      <div className="member-id">
        #{id}
      </div>
    </div>
  );
};

export default FamilyMember;