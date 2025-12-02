import React, { useState, useEffect } from 'react';
import './FamilyTree.css';

const MemberForm = ({ member, onSubmit, onCancel, onDelete, title, submitText }) => {
  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    details: '',
    x: 400,
    y: 250
  });
  
  // Ha szerkesztünk, töltjük fel a meglévő adatokat
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        birthYear: member.birthYear,
        details: member.details,
        x: member.x,
        y: member.y
      });
    }
  }, [member]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('A név megadása kötelező!');
      return;
    }
    
    const memberData = member 
      ? { ...formData, id: member.id }
      : formData;
    
    onSubmit(memberData);
  };
  
  return (
    <div className="form-container">
      <h3>{title}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Név *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Pl. Kovács János"
            required
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="birthYear">Születési év</label>
          <input
            type="text"
            id="birthYear"
            name="birthYear"
            value={formData.birthYear}
            onChange={handleChange}
            placeholder="Pl. 1970"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="details">Részletek</label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder="Pl. foglalkozás, érdekességek..."
          />
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="add">
            {submitText}
          </button>
          
          {onDelete && (
            <button 
              type="button" 
              className="reset" 
              onClick={() => {
                if (window.confirm('Biztosan törlöd ezt a családtagot?')) {
                  onDelete(member.id);
                }
              }}
            >
              Törlés
            </button>
          )}
          
          <button type="button" onClick={onCancel}>
            Mégse
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;