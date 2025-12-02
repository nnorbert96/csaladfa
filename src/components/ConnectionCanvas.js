import React, { useRef, useEffect } from 'react';
import './FamilyTree.css';

const ConnectionCanvas = ({ members, connections }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Canvas méreteinek beállítása
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    
    // Törlés
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Kapcsolatok rajzolása
    connections.forEach(connection => {
      const fromMember = members.find(m => m.id === connection.from);
      const toMember = members.find(m => m.id === connection.to);
      
      if (!fromMember || !toMember) return;
      
      // Vonal stílusa a kapcsolat típusa alapján
      if (connection.type === 'marriage') {
        ctx.strokeStyle = '#e74c3c'; // Piros házassághoz
        ctx.lineWidth = 3;
        ctx.setLineDash([]); // Folytonos vonal
      } else {
        ctx.strokeStyle = '#3498db'; // Kék szülői kapcsolathoz
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Szaggatott vonal
      }
      
      // Vonal rajzolása
      ctx.beginPath();
      ctx.moveTo(fromMember.x, fromMember.y);
      ctx.lineTo(toMember.x, toMember.y);
      ctx.stroke();
      
      // Nyíl a vonal végére (szülői kapcsolatoknál)
      if (connection.type === 'parent') {
        drawArrow(ctx, fromMember.x, fromMember.y, toMember.x, toMember.y);
      }
    });
  }, [members, connections]);
  
  // Nyíl rajzolása
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="connection-canvas"
    />
  );
};

export default ConnectionCanvas;