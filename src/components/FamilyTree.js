import React, { useState, useEffect, useRef, useCallback } from 'react';
import FamilyMember from './FamilyMember';
import ConnectionCanvas from './ConnectionCanvas';
import MemberForm from './MemberForm';
import './FamilyTree.css';

const FamilyTree = () => {
  // Állapotok
  const [members, setMembers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Referenciák
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragMemberIdRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Alapértelmezett adatok betöltése
  useEffect(() => {
    const savedMembers = localStorage.getItem('familyMembers');
    const savedConnections = localStorage.getItem('familyConnections');
    
    if (savedMembers && savedConnections) {
      setMembers(JSON.parse(savedMembers));
      setConnections(JSON.parse(savedConnections));
      showStatusMessage('Családfa betöltve a helyi tárolóból');
    } else {
      // Példa adatok
      const initialMembers = [
        { id: 1, name: 'Nagypapa József', birthYear: '1940', details: 'Családfő, nyugdíjas', x: 400, y: 50 },
        { id: 2, name: 'Nagymama Erzsébet', birthYear: '1945', details: 'Nagymama, háziasszony', x: 600, y: 50 },
        { id: 3, name: 'Apa János', birthYear: '1970', details: 'Mérnök, 52 éves', x: 300, y: 200 },
        { id: 4, name: 'Anya Mária', birthYear: '1972', details: 'Tanár, 50 éves', x: 500, y: 200 },
        { id: 5, name: 'Gyerek 1 - Péter', birthYear: '2000', details: 'Egyetemista, 23 éves', x: 300, y: 350 },
        { id: 6, name: 'Gyerek 2 - Anna', birthYear: '2005', details: 'Középiskolás, 18 éves', x: 500, y: 350 },
      ];
      
      const initialConnections = [
        { from: 1, to: 2, type: 'marriage' },
        { from: 1, to: 3, type: 'parent' },
        { from: 2, to: 3, type: 'parent' },
        { from: 3, to: 4, type: 'marriage' },
        { from: 3, to: 5, type: 'parent' },
        { from: 4, to: 5, type: 'parent' },
        { from: 3, to: 6, type: 'parent' },
        { from: 4, to: 6, type: 'parent' },
      ];
      
      setMembers(initialMembers);
      setConnections(initialConnections);
      showStatusMessage('Példa családfa betöltve. Kezdj el hozzáadni saját családtagokat!');
    }
  }, []);

  // Adatok mentése helyi tárolóba
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem('familyMembers', JSON.stringify(members));
      localStorage.setItem('familyConnections', JSON.stringify(connections));
    }
  }, [members, connections]);

  // Státuszüzenet megjelenítése
  const showStatusMessage = (message) => {
    setStatusMessage(message);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 3000);
  };

  // Új családtag hozzáadása
  const handleAddMember = (memberData) => {
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const newMember = {
      id: newId,
      name: memberData.name,
      birthYear: memberData.birthYear,
      details: memberData.details,
      x: memberData.x || 400,
      y: memberData.y || 250
    };
    
    setMembers([...members, newMember]);
    setIsAddingMember(false);
    showStatusMessage(`"${memberData.name}" hozzáadva a családfához`);
  };

  // Családtag szerkesztése
  const handleUpdateMember = (updatedMember) => {
    setMembers(members.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    ));
    setEditingMember(null);
    showStatusMessage(`"${updatedMember.name}" adatai frissítve`);
  };

  // Családtag törlése
  const handleDeleteMember = (id) => {
    const memberName = members.find(m => m.id === id)?.name || '';
    setMembers(members.filter(member => member.id !== id));
    
    // Kapcsolatok törlése is
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id));
    
    if (selectedMember === id) setSelectedMember(null);
    if (editingMember?.id === id) setEditingMember(null);
    
    showStatusMessage(`"${memberName}" eltávolítva a családfából`);
  };

  // Kapcsolat hozzáadása
  const handleAddConnection = () => {
    if (!selectedMember) {
      showStatusMessage('Előbb válassz ki egy családtagot a kapcsolathoz!');
      return;
    }
    
    const otherMembers = members.filter(m => m.id !== selectedMember);
    if (otherMembers.length === 0) {
      showStatusMessage('Nincs másik családtag, akivel kapcsolatot létrehozhatnál!');
      return;
    }
    
    // Egyszerű kapcsolat hozzáadása az első elérhető taggal
    const otherMemberId = otherMembers[0].id;
    const newConnection = {
      from: selectedMember,
      to: otherMemberId,
      type: 'parent' // Alapértelmezett kapcsolat típus
    };
    
    // Ellenőrizzük, hogy már létezik-e ez a kapcsolat
    const exists = connections.some(conn => 
      (conn.from === selectedMember && conn.to === otherMemberId) ||
      (conn.from === otherMemberId && conn.to === selectedMember)
    );
    
    if (!exists) {
      setConnections([...connections, newConnection]);
      showStatusMessage('Kapcsolat létrehozva');
    } else {
      showStatusMessage('Ez a kapcsolat már létezik');
    }
  };

  // Kapcsolat törlése
  const handleDeleteConnection = () => {
    if (connections.length === 0) {
      showStatusMessage('Nincsenek kapcsolatok a törléshez');
      return;
    }
    
    // Az utolsó kapcsolat törlése
    const lastConnection = connections[connections.length - 1];
    const fromName = members.find(m => m.id === lastConnection.from)?.name || '';
    const toName = members.find(m => m.id === lastConnection.to)?.name || '';
    
    setConnections(connections.slice(0, -1));
    showStatusMessage(`Kapcsolat törölve: ${fromName} ↔ ${toName}`);
  };

  // Elem húzásának kezdete
  const handleDragStart = (memberId, clientX, clientY) => {
    isDraggingRef.current = true;
    dragMemberIdRef.current = memberId;
    dragStartRef.current = { x: clientX, y: clientY };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Elem húzása közben
  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current && dragMemberIdRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === dragMemberIdRef.current 
            ? { ...member, x: member.x + dx / scale, y: member.y + dy / scale }
            : member
        )
      );
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
    
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [scale]);

  // Elem húzásának vége
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragMemberIdRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Panoráma kezdete
  const handlePanStart = (e) => {
    if (e.button === 2 || e.ctrlKey) { // Jobb egérgomb vagy Ctrl
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handlePanEnd);
    }
  };

  // Panoráma vége
  const handlePanEnd = () => {
    isPanningRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handlePanEnd);
  };

  // Zoom be
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  // Zoom ki
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Reset zoom és pozíció
  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    showStatusMessage('Nézet alaphelyzetbe állítva');
  };

  // Példaadatok betöltése
  const handleLoadExample = () => {
    const exampleMembers = [
      { id: 1, name: 'Nagypapa József', birthYear: '1940', details: 'Családfő, nyugdíjas', x: 400, y: 50 },
      { id: 2, name: 'Nagymama Erzsébet', birthYear: '1945', details: 'Nagymama, háziasszony', x: 600, y: 50 },
      { id: 3, name: 'Apa János', birthYear: '1970', details: 'Mérnök', x: 300, y: 200 },
      { id: 4, name: 'Anya Mária', birthYear: '1972', details: 'Tanár', x: 500, y: 200 },
      { id: 5, name: 'Gyerek 1 - Péter', birthYear: '2000', details: 'Egyetemista', x: 300, y: 350 },
      { id: 6, name: 'Gyerek 2 - Anna', birthYear: '2005', details: 'Középiskolás', x: 500, y: 350 },
    ];
    
    const exampleConnections = [
      { from: 1, to: 2, type: 'marriage' },
      { from: 1, to: 3, type: 'parent' },
      { from: 2, to: 3, type: 'parent' },
      { from: 3, to: 4, type: 'marriage' },
      { from: 3, to: 5, type: 'parent' },
      { from: 4, to: 5, type: 'parent' },
      { from: 3, to: 6, type: 'parent' },
      { from: 4, to: 6, type: 'parent' },
    ];
    
    setMembers(exampleMembers);
    setConnections(exampleConnections);
    showStatusMessage('Példa családfa betöltve');
  };

  // Minden adat törlése
  const handleClearAll = () => {
    if (window.confirm('Biztosan törölni szeretnéd az összes családtagot és kapcsolatot?')) {
      setMembers([]);
      setConnections([]);
      setSelectedMember(null);
      setEditingMember(null);
      localStorage.removeItem('familyMembers');
      localStorage.removeItem('familyConnections');
      showStatusMessage('Összes adat törölve');
    }
  };

  // Vászon kattintás (kijelölés törlése)
  const handleCanvasClick = (e) => {
    if (e.target === containerRef.current) {
      setSelectedMember(null);
    }
  };

  // Kontextusmenü tiltása (jobbklikk)
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Komponens eltávolításakor eseményfigyelők eltávolítása
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handlePanEnd);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="family-tree-container">
      {/* Vezérlő gombok */}
      <div className="controls">
        <button className="add" onClick={() => setIsAddingMember(true)}>
          + Új családtag
        </button>
        
        <button onClick={handleAddConnection}>
          Kapcsolat hozzáadása
        </button>
        
        <button onClick={handleDeleteConnection}>
          Utolsó kapcsolat törlése
        </button>
        
        <div className="zoom-controls">
          <button onClick={handleZoomOut}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn}>+</button>
        </div>
        
        <button onClick={handleResetView}>
          Nézet reset
        </button>
        
        <button onClick={handleLoadExample}>
          Példa betöltése
        </button>
        
        <button className="reset" onClick={handleClearAll}>
          Minden törlése
        </button>
      </div>

      {/* Tippek */}
      <div className="tip">
        <h4>Használati útmutató:</h4>
        <ul>
          <li><strong>Húzd a családtagokat</strong> egérrel a vásznon</li>
          <li><strong>Kattints duplán</strong> egy családtagra a szerkesztéshez</li>
          <li><strong>Ctrl+egérhúzás</strong> vagy <strong>jobbklikk+húzás</strong> a panorámázáshoz</li>
          <li><strong>Válassz ki egy családtagot</strong>, majd nyomd a "Kapcsolat hozzáadása" gombot</li>
          <li><strong>Adatok automatikusan mentődnek</strong> a böngésződbe</li>
        </ul>
      </div>

      {/* Form-ok */}
      {isAddingMember && (
        <MemberForm
          onSubmit={handleAddMember}
          onCancel={() => setIsAddingMember(false)}
          title="Új családtag hozzáadása"
          submitText="Hozzáadás"
        />
      )}
      
      {editingMember && (
        <MemberForm
          member={editingMember}
          onSubmit={handleUpdateMember}
          onCancel={() => setEditingMember(null)}
          onDelete={handleDeleteMember}
          title="Családtag szerkesztése"
          submitText="Mentés"
        />
      )}

      {/* Vászon */}
      <div 
        className="canvas-container"
        ref={containerRef}
        onClick={handleCanvasClick}
        onMouseDown={handlePanStart}
        onContextMenu={handleContextMenu}
      >
        <div 
          className="canvas"
          style={{
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Kapcsolatok */}
          <ConnectionCanvas members={members} connections={connections} />
          
          {/* Családtagok */}
          {members.map(member => (
            <FamilyMember
              key={member.id}
              member={member}
              isSelected={selectedMember === member.id}
              onSelect={setSelectedMember}
              onDragStart={handleDragStart}
              onDoubleClick={() => {
                setEditingMember(member);
                setSelectedMember(member.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Státuszüzenet */}
      {showStatus && (
        <div className="status-bar">
          {statusMessage}
        </div>
      )}

      {/* Információ a kijelölt tagról */}
      {selectedMember && (
        <div className="selected-info">
          Kijelölt: {members.find(m => m.id === selectedMember)?.name}
        </div>
      )}
    </div>
  );
};

export default FamilyTree;