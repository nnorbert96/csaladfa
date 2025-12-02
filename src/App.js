import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { 
  Menu as MenuIcon, 
  Info, 
  ZoomIn, 
  ZoomOut, 
  Home,
  PersonAdd,
  Delete,
  Close,
  DragIndicator,
  ZoomOutMap,
  FamilyRestroom,
  Settings,
  Expand,
  Compress,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Male,
  Female,
  Transgender,
  Cake,
  DateRange,
  Group,
  Add,
  Edit,
  Person,
  Woman,
  Man
} from '@mui/icons-material';
import {
  Drawer,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Slider,
  Alert,
  Snackbar,
  Chip,
  RadioGroup,
  Radio,
  FormLabel,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Typography,
  Divider
} from '@mui/material';

function App() {
  // Állapotok
  const [members, setMembers] = useState([
    { 
      id: 1, 
      name: 'Kovács József', 
      maidenName: '',
      birthYear: '1940', 
      deathYear: '',
      gender: 'male',
      details: 'Családfő', 
      x: 500, 
      y: 100,
      isDeceased: false
    },
    { 
      id: 2, 
      name: 'Nagy Erzsébet', 
      maidenName: 'Szabó',
      birthYear: '1945', 
      deathYear: '2020',
      gender: 'female',
      details: 'Nagymama', 
      x: 700, 
      y: 100,
      isDeceased: true
    },
    { 
      id: 3, 
      name: 'Kovács János', 
      maidenName: '',
      birthYear: '1970', 
      deathYear: '',
      gender: 'male',
      details: 'Mérnök', 
      x: 400, 
      y: 250,
      isDeceased: false
    },
    { 
      id: 4, 
      name: 'Tóth Mária', 
      maidenName: 'Kiss',
      birthYear: '1972', 
      deathYear: '',
      gender: 'female',
      details: 'Tanár', 
      x: 600, 
      y: 250,
      isDeceased: false
    },
    { 
      id: 5, 
      name: 'Kovács Péter', 
      maidenName: '',
      birthYear: '2000', 
      deathYear: '',
      gender: 'male',
      details: 'Egyetemista', 
      x: 400, 
      y: 400,
      isDeceased: false
    },
  ]);
  
  const [connections, setConnections] = useState([
    { id: 1, from: 1, to: 2, type: 'házasság' },
    { id: 2, from: 1, to: 3, type: 'szülő' },
    { id: 3, from: 2, to: 3, type: 'szülő' },
    { id: 4, from: 3, to: 4, type: 'házasság' },
    { id: 5, from: 3, to: 5, type: 'szülő' },
    { id: 6, from: 4, to: 5, type: 'szülő' },
  ]);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [scale, setScale] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [editMemberDialog, setEditMemberDialog] = useState(false);
  const [siblingDialog, setSiblingDialog] = useState({ open: false, member1: null, member2: null, commonParents: [] });
  const [newMember, setNewMember] = useState({ 
    name: '', 
    maidenName: '',
    birthYear: '', 
    deathYear: '',
    gender: 'male',
    details: '',
    isDeceased: false,
    fatherId: '',
    motherId: ''
  });
  const [editingMember, setEditingMember] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [panVelocity, setPanVelocity] = useState({ x: 0, y: 0 });
  const [animationFrameId, setAnimationFrameId] = useState(null);
  
  // Referenciák
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragMemberIdRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const keysPressed = useRef(new Set());

  // Betöltés mentésből
  useEffect(() => {
    const saved = localStorage.getItem('familyTreeAdvanced');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.members) setMembers(data.members);
        if (data.connections) setConnections(data.connections);
      } catch (e) {
        console.log('Nem sikerült betölteni a mentett adatokat');
      }
    }
  }, []);
  
  // Mentés
  useEffect(() => {
    const data = { members, connections };
    localStorage.setItem('familyTreeAdvanced', JSON.stringify(data));
  }, [members, connections]);
  
  // Vászon méretének frissítése tagok számának függvényében
  useEffect(() => {
    const baseSize = 2000;
    const growthFactor = 1.5;
    const memberCount = members.length;
    
    // Exponenciális növekedés
    const newSize = Math.max(baseSize, baseSize * Math.pow(growthFactor, memberCount / 10));
    setCanvasSize({ 
      width: newSize, 
      height: newSize 
    });
  }, [members.length]);
  
  // Billentyűzet események
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.add(e.key);
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Billentyűzet alapú panoráma animáció
  useEffect(() => {
    const panSpeed = 20;
    
    const handleKeyboardPan = () => {
      if (keysPressed.current.size === 0) {
        setPanVelocity({ x: 0, y: 0 });
        return;
      }
      
      let dx = 0;
      let dy = 0;
      
      if (keysPressed.current.has('ArrowUp')) dy += panSpeed;
      if (keysPressed.current.has('ArrowDown')) dy -= panSpeed;
      if (keysPressed.current.has('ArrowLeft')) dx += panSpeed;
      if (keysPressed.current.has('ArrowRight')) dx -= panSpeed;
      
      setPanVelocity({ x: dx, y: dy });
      
      // Sima mozgás
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    };
    
    const id = requestAnimationFrame(handleKeyboardPan);
    setAnimationFrameId(id);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [keysPressed.current.size]);
  
  // Intelligens testvér detektálás új kapcsolat hozzáadásakor
  useEffect(() => {
    if (!newMember.fatherId || !newMember.motherId) return;
    
    // Várjunk amíg a felhasználó befejezi a kitöltést
    if (addMemberDialog) return;
    
    // Ellenőrizzük az összes meglévő tagot, hogy van-e testvére
    const fatherId = parseInt(newMember.fatherId);
    const motherId = parseInt(newMember.motherId);
    
    // Keressük az összes gyermeket akiknek ugyanazok a szülei
    const siblings = members.filter(member => {
      const memberParents = getParents(member.id);
      return memberParents.father === fatherId && memberParents.mother === motherId;
    });
    
    if (siblings.length > 0) {
      // Várjunk egy kicsit, hogy ne zavarjuk a felhasználót
      setTimeout(() => {
        const father = members.find(m => m.id === fatherId);
        const mother = members.find(m => m.id === motherId);
        
        if (father && mother) {
          setSiblingDialog({
            open: true,
            member1: null, // Új tag lesz
            member2: siblings[0].id,
            commonParents: [fatherId, motherId],
            fatherName: father.name,
            motherName: mother.name,
            siblingName: siblings[0].name
          });
        }
      }, 500);
    }
  }, [newMember.fatherId, newMember.motherId, members, addMemberDialog]);
  
  // Kapcsolatok rajzolása
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const ctx = canvas.getContext('2d');
    
    // Canvas méret beállítás
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Törlés
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid rajzolása
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Kapcsolatok rajzolása
    connections.forEach(conn => {
      const from = members.find(m => m.id === conn.from);
      const to = members.find(m => m.id === conn.to);
      
      if (!from || !to) return;
      
      // Átalakítás a zoom és pan miatt
      const fromX = (from.x * scale) + panOffset.x;
      const fromY = (from.y * scale) + panOffset.y;
      const toX = (to.x * scale) + panOffset.x;
      const toY = (to.y * scale) + panOffset.y;
      
      // Vonal stílus
      ctx.lineWidth = 2 * Math.max(0.5, scale);
      ctx.setLineDash([]);
      
      if (conn.type === 'házasság') {
        ctx.strokeStyle = '#e74c3c';
      } else if (conn.type === 'testvér') {
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3 * Math.max(0.5, scale);
        ctx.setLineDash([10 * Math.max(0.5, scale), 5 * Math.max(0.5, scale)]);
      } else {
        ctx.strokeStyle = '#3498db';
        ctx.setLineDash([5 * Math.max(0.5, scale), 5 * Math.max(0.5, scale)]);
      }
      
      // Vonal
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      
      // Nyíl a kapcsolat típusától függően
      if (conn.type === 'szülő') {
        drawArrow(ctx, fromX, fromY, toX, toY, false, Math.max(0.5, scale));
      }
      
      // Kapcsolat típus felirat
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(midX - 40 * Math.max(0.5, scale), midY - 15 * Math.max(0.5, scale), 80 * Math.max(0.5, scale), 30 * Math.max(0.5, scale));
      ctx.strokeStyle = conn.type === 'házasság' ? '#e74c3c' : 
                       conn.type === 'testvér' ? '#2ecc71' : '#3498db';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 40 * Math.max(0.5, scale), midY - 15 * Math.max(0.5, scale), 80 * Math.max(0.5, scale), 30 * Math.max(0.5, scale));
      
      ctx.fillStyle = conn.type === 'házasság' ? '#e74c3c' : 
                     conn.type === 'testvér' ? '#2ecc71' : '#3498db';
      ctx.font = `${12 * Math.max(0.5, scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(conn.type, midX, midY);
    });
  }, [members, connections, scale, panOffset, canvasSize]);
  
  // Grid rajzolása
  const drawGrid = (ctx, width, height) => {
    const gridSize = 50 * scale;
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.lineWidth = 1;
    
    // Függőleges vonalak
    for (let x = (panOffset.x % gridSize); x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Vízszintes vonalak
    for (let y = (panOffset.y % gridSize); y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  // Nyíl rajzolása
  const drawArrow = (ctx, fromX, fromY, toX, toY, reverse = false, arrowScale) => {
    const headlen = 15 * arrowScale;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Nyílfej
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
  
  // Szülők lekérése egy taghoz
  const getParents = (memberId) => {
    const parentConnections = connections.filter(
      conn => conn.to === memberId && conn.type === 'szülő'
    );
    
    const father = parentConnections.find(conn => {
      const parent = members.find(m => m.id === conn.from);
      return parent && parent.gender === 'male';
    });
    
    const mother = parentConnections.find(conn => {
      const parent = members.find(m => m.id === conn.from);
      return parent && parent.gender === 'female';
    });
    
    return {
      father: father ? father.from : null,
      mother: mother ? mother.from : null
    };
  };
  
  // Testvérek keresése egy taghoz
  const findSiblings = (memberId) => {
    const parents = getParents(memberId);
    if (!parents.father && !parents.mother) return [];
    
    // Gyűjtsük össze az összes gyermeket akiknek ugyanazok a szülei
    const siblings = members.filter(member => {
      if (member.id === memberId) return false;
      
      const memberParents = getParents(member.id);
      return (
        (parents.father && memberParents.father === parents.father) ||
        (parents.mother && memberParents.mother === parents.mother)
      );
    });
    
    return siblings;
  };
  
  // Tag méretének kiszámítása dinamikusan a tartalom alapján
  const calculateMemberSize = useCallback((member, currentScale) => {
    // Alapméret a zoom alapján
    const baseSize = 120 * Math.pow(currentScale, 0.7);
    
    // Szöveg hossza alapján méret
    const fullName = member.maidenName && member.gender === 'female' 
      ? `${member.name} (szül. ${member.maidenName})`
      : member.name;
    
    const nameLength = fullName.length;
    const yearText = member.isDeceased && member.deathYear 
      ? `${member.birthYear} - ${member.deathYear}`
      : member.birthYear;
    
    const detailsLength = member.details ? member.details.length : 0;
    
    // Szülők nevei
    const parents = getParents(member.id);
    const father = parents.father ? members.find(m => m.id === parents.father) : null;
    const mother = parents.mother ? members.find(m => m.id === parents.mother) : null;
    const parentsText = father || mother ? `Szülők: ${father ? father.name : '?'} & ${mother ? mother.name : '?'}` : '';
    const parentsLength = parentsText.length;
    
    // Szélesség számítás
    const minWidth = 200;
    const widthFactor = 8;
    const calculatedWidth = Math.max(
      minWidth, 
      baseSize + (nameLength * widthFactor * currentScale)
    );
    
    // Magasság számítás
    const minHeight = 140;
    const lineHeight = 24;
    const lines = 3 + (detailsLength > 0 ? 1 : 0) + (member.isDeceased ? 0.5 : 0) + (parentsText ? 1 : 0);
    const calculatedHeight = Math.max(
      minHeight, 
      baseSize + (lines * lineHeight * currentScale)
    );
    
    return {
      width: calculatedWidth,
      height: calculatedHeight
    };
  }, [members, connections]);
  
  // Tag betűmérete a zoomhoz
  const calculateFontSize = (currentScale) => {
    const baseFontSize = 14;
    // Exponenciális betűméret változás
    const exponentialFactor = Math.pow(currentScale, 0.6);
    return Math.max(10, Math.min(20, baseFontSize * exponentialFactor));
  };
  
  // Új tag hozzáadása
  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      showNotification('Add meg a nevet!', 'warning');
      return;
    }
    
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    // Tagok számának függvényében számoljuk ki a pozíciót
    const angle = (members.length * 2 * Math.PI) / (members.length + 1);
    const radius = 300 + (members.length * 50);
    
    const newMemberObj = {
      id: newId,
      name: newMember.name,
      maidenName: newMember.gender === 'female' ? newMember.maidenName : '',
      birthYear: newMember.birthYear,
      deathYear: newMember.isDeceased ? newMember.deathYear : '',
      gender: newMember.gender,
      details: newMember.details,
      isDeceased: newMember.isDeceased,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
    
    setMembers([...members, newMemberObj]);
    
    // Szülői kapcsolatok létrehozása
    const newConnections = [];
    let connectionId = connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1;
    
    // Apa kapcsolat
    if (newMember.fatherId) {
      newConnections.push({
        id: connectionId++,
        from: parseInt(newMember.fatherId),
        to: newId,
        type: 'szülő'
      });
    }
    
    // Anya kapcsolat
    if (newMember.motherId) {
      newConnections.push({
        id: connectionId++,
        from: parseInt(newMember.motherId),
        to: newId,
        type: 'szülő'
      });
    }
    
    // Hozzáadjuk az új kapcsolatokat
    if (newConnections.length > 0) {
      setConnections([...connections, ...newConnections]);
      
      // Ellenőrizzük testvéri kapcsolatokat
      if (newMember.fatherId && newMember.motherId) {
        checkForSiblings(newId, parseInt(newMember.fatherId), parseInt(newMember.motherId));
      }
    }
    
    // Űrlap visszaállítása
    setNewMember({ 
      name: '', 
      maidenName: '',
      birthYear: '', 
      deathYear: '',
      gender: 'male',
      details: '',
      isDeceased: false,
      fatherId: '',
      motherId: ''
    });
    
    setAddMemberDialog(false);
    showNotification(`${newMemberObj.name} hozzáadva a családfához`, 'success');
  };
  
  // Tag szerkesztése
  const handleEditMember = () => {
    if (!editingMember || !editingMember.name.trim()) {
      showNotification('Add meg a nevet!', 'warning');
      return;
    }
    
    // Frissítsük a tagot
    setMembers(members.map(member => 
      member.id === editingMember.id ? editingMember : member
    ));
    
    // Szülői kapcsolatok frissítése
    const fatherId = editingMember.fatherId ? parseInt(editingMember.fatherId) : null;
    const motherId = editingMember.motherId ? parseInt(editingMember.motherId) : null;
    
    // Töröljük a régi szülői kapcsolatokat
    const filteredConnections = connections.filter(conn => 
      !(conn.to === editingMember.id && conn.type === 'szülő')
    );
    
    const newConnections = [];
    let connectionId = connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1;
    
    // Apa kapcsolat
    if (fatherId) {
      newConnections.push({
        id: connectionId++,
        from: fatherId,
        to: editingMember.id,
        type: 'szülő'
      });
    }
    
    // Anya kapcsolat
    if (motherId) {
      newConnections.push({
        id: connectionId++,
        from: motherId,
        to: editingMember.id,
        type: 'szülő'
      });
    }
    
    // Frissítjük a kapcsolatokat
    setConnections([...filteredConnections, ...newConnections]);
    
    // Ellenőrizzük testvéri kapcsolatokat
    if (fatherId && motherId) {
      checkForSiblings(editingMember.id, fatherId, motherId);
    }
    
    // Dialógus bezárása
    setEditMemberDialog(false);
    setEditingMember(null);
    showNotification(`${editingMember.name} adatai frissítve`, 'success');
  };
  
  // Testvér kapcsolat ellenőrzése
  const checkForSiblings = (newMemberId, fatherId, motherId) => {
    // Keressük az összes gyermeket akiknek ugyanazok a szülei
    const siblings = members.filter(member => {
      if (member.id === newMemberId) return false;
      
      const parents = getParents(member.id);
      return (
        (parents.father === fatherId && parents.mother === motherId) ||
        (parents.father === fatherId && !motherId) ||
        (parents.mother === motherId && !fatherId)
      );
    });
    
    // Hozzunk létre testvéri kapcsolatokat
    siblings.forEach(sibling => {
      // Ellenőrizzük, hogy már létezik-e a kapcsolat
      const alreadyExists = connections.some(conn => 
        conn.type === 'testvér' && 
        ((conn.from === newMemberId && conn.to === sibling.id) || 
         (conn.from === sibling.id && conn.to === newMemberId))
      );
      
      if (!alreadyExists) {
        const newConnection = {
          id: connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1,
          from: newMemberId,
          to: sibling.id,
          type: 'testvér'
        };
        
        setConnections(prev => [...prev, newConnection]);
      }
    });
    
    // Ha van testvér, értesítsük a felhasználót
    if (siblings.length > 0) {
      const father = members.find(m => m.id === fatherId);
      const mother = members.find(m => m.id === motherId);
      const sibling = siblings[0];
      
      if (father || mother) {
        setSiblingDialog({
          open: true,
          member1: newMemberId,
          member2: sibling.id,
          commonParents: [fatherId, motherId].filter(id => id),
          fatherName: father ? father.name : 'ismeretlen apa',
          motherName: mother ? mother.name : 'ismeretlen anya',
          siblingName: sibling.name
        });
      }
    }
  };
  
  // Testvér kapcsolat létrehozása
  const handleCreateSiblingConnection = () => {
    const { member1, member2, commonParents } = siblingDialog;
    
    if (!member1 || !member2) return;
    
    // Ellenőrizzük, hogy már létezik-e a kapcsolat
    const alreadyExists = connections.some(conn => 
      conn.type === 'testvér' && 
      ((conn.from === member1 && conn.to === member2) || 
       (conn.from === member2 && conn.to === member1))
    );
    
    if (!alreadyExists) {
      const newConnection = {
        id: connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1,
        from: member1,
        to: member2,
        type: 'testvér'
      };
      
      setConnections([...connections, newConnection]);
      
      const member1Name = members.find(m => m.id === member1)?.name;
      const member2Name = members.find(m => m.id === member2)?.name;
      
      showNotification(`Testvéri kapcsolat létrehozva: ${member1Name} ↔ ${member2Name}`, 'success');
    }
    
    setSiblingDialog({ open: false, member1: null, member2: null, commonParents: [] });
  };
  
  // Tag törlése
  const handleDeleteMember = (id) => {
    if (window.confirm('Biztosan törlöd ezt a családtagot?')) {
      const memberName = members.find(m => m.id === id)?.name;
      setMembers(members.filter(m => m.id !== id));
      setConnections(connections.filter(c => c.from !== id && c.to !== id));
      if (selectedMember === id) setSelectedMember(null);
      if (editingMember?.id === id) {
        setEditingMember(null);
        setEditMemberDialog(false);
      }
      showNotification(`${memberName} eltávolítva`, 'info');
    }
  };
  
  // Tag szerkesztés megnyitása
  const handleEditMemberOpen = (member) => {
    const parents = getParents(member.id);
    setEditingMember({
      ...member,
      fatherId: parents.father ? parents.father.toString() : '',
      motherId: parents.mother ? parents.mother.toString() : ''
    });
    setEditMemberDialog(true);
    setSelectedMember(member.id);
  };
  
  // Húzás kezdete
  const handleDragStart = (memberId, clientX, clientY) => {
    isDraggingRef.current = true;
    dragMemberIdRef.current = memberId;
    dragStartRef.current = { x: clientX, y: clientY };
    setSelectedMember(memberId);
  };
  
  // Egér mozgás
  const handleMouseMove = useCallback((e) => {
    // Húzás
    if (isDraggingRef.current && dragMemberIdRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      
      setMembers(prev => 
        prev.map(member => 
          member.id === dragMemberIdRef.current 
            ? { ...member, x: member.x + dx, y: member.y + dy }
            : member
        )
      );
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
    
    // Panoráma
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      // Sima, csillapított mozgás
      const smoothFactor = 0.8;
      setPanOffset(prev => ({
        x: prev.x + dx * smoothFactor,
        y: prev.y + dy * smoothFactor
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, scale]);
  
  // Egér fel
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragMemberIdRef.current = null;
  }, []);
  
  // Jobb egérgomb panoráma
  const handlePanStart = (e) => {
    if (e.button === 2) { // Jobb egérgomb
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanVelocity({ x: 0, y: 0 });
    }
  };
  
  // Panoráma vége
  const handlePanEnd = () => {
    setIsPanning(false);
    // Kis mértékű tehetetlenség
    if (panVelocity.x !== 0 || panVelocity.y !== 0) {
      setTimeout(() => {
        setPanVelocity({ x: 0, y: 0 });
      }, 300);
    }
  };
  
  // Zoom az egér görgővel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const delta = e.deltaY > 0 ? 1 - zoomFactor : 1 + zoomFactor;
    
    // Kurzor pozíciójához relatív zoom
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Számoljuk ki az új skálát
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    
    // Számoljuk ki az új offsetet a kurzor pozíciójának megtartásához
    const scaleRatio = newScale / scale;
    setPanOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleRatio,
      y: mouseY - (mouseY - prev.y) * scaleRatio
    }));
    
    setScale(newScale);
  }, [scale]);
  
  // Reset nézet
  const handleResetView = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    showNotification('Nézet alaphelyzetbe állítva', 'info');
  };
  
  // Fit to screen
  const handleFitToScreen = () => {
    if (members.length === 0) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const padding = 50;
    
    // Számold ki a tagok határait
    const minX = Math.min(...members.map(m => m.x));
    const maxX = Math.max(...members.map(m => m.x));
    const minY = Math.min(...members.map(m => m.y));
    const maxY = Math.max(...members.map(m => m.y));
    
    const contentWidth = maxX - minX + 200;
    const contentHeight = maxY - minY + 200;
    
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    // Középre igazítás
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    setScale(newScale);
    setPanOffset({
      x: rect.width / 2 - centerX * newScale,
      y: rect.height / 2 - centerY * newScale
    });
    
    showNotification('Vászon az ablakhoz igazítva', 'success');
  };
  
  // Példaadatok betöltése
  const loadExample = () => {
    const exampleMembers = [
      { 
        id: 1, 
        name: 'Kovács József', 
        maidenName: '',
        birthYear: '1940', 
        deathYear: '',
        gender: 'male',
        details: 'Családfő', 
        x: 500, 
        y: 100,
        isDeceased: false
      },
      { 
        id: 2, 
        name: 'Nagy Erzsébet', 
        maidenName: 'Szabó',
        birthYear: '1945', 
        deathYear: '2020',
        gender: 'female',
        details: 'Nagymama', 
        x: 700, 
        y: 100,
        isDeceased: true
      },
      { 
        id: 3, 
        name: 'Kovács János', 
        maidenName: '',
        birthYear: '1970', 
        deathYear: '',
        gender: 'male',
        details: 'Mérnök', 
        x: 400, 
        y: 250,
        isDeceased: false
      },
      { 
        id: 4, 
        name: 'Tóth Mária', 
        maidenName: 'Kiss',
        birthYear: '1972', 
        deathYear: '',
        gender: 'female',
        details: 'Tanár', 
        x: 600, 
        y: 250,
        isDeceased: false
      },
      { 
        id: 5, 
        name: 'Kovács Péter', 
        maidenName: '',
        birthYear: '2000', 
        deathYear: '',
        gender: 'male',
        details: 'Egyetemista', 
        x: 400, 
        y: 400,
        isDeceased: false
      },
      { 
        id: 6, 
        name: 'Kovács Anna', 
        maidenName: '',
        birthYear: '2005', 
        deathYear: '',
        gender: 'female',
        details: 'Középiskolás', 
        x: 600, 
        y: 400,
        isDeceased: false
      },
    ];
    
    const exampleConnections = [
      { id: 1, from: 1, to: 2, type: 'házasság' },
      { id: 2, from: 1, to: 3, type: 'szülő' },
      { id: 3, from: 2, to: 3, type: 'szülő' },
      { id: 4, from: 3, to: 4, type: 'házasság' },
      { id: 5, from: 3, to: 5, type: 'szülő' },
      { id: 6, from: 4, to: 5, type: 'szülő' },
      { id: 7, from: 3, to: 6, type: 'szülő' },
      { id: 8, from: 4, to: 6, type: 'szülő' },
    ];
    
    setMembers(exampleMembers);
    setConnections(exampleConnections);
    showNotification('Példa családfa betöltve', 'success');
  };
  
  // Minden törlése
  const clearAll = () => {
    if (window.confirm('Biztosan törlöd az összes adatot?')) {
      setMembers([]);
      setConnections([]);
      localStorage.removeItem('familyTreeAdvanced');
      showNotification('Összes adat törölve', 'info');
    }
  };
  
  // Értesítés mutatása
  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };
  
  // Értesítés bezárása
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Nem kiválasztása
  const handleGenderChange = (event, newGender) => {
    if (newGender !== null) {
      setNewMember(prev => ({ 
        ...prev, 
        gender: newGender,
        maidenName: newGender === 'female' ? prev.maidenName : ''
      }));
    }
  };
  
  // Szerkesztésnél nem kiválasztása
  const handleEditGenderChange = (event, newGender) => {
    if (newGender !== null && editingMember) {
      setEditingMember({ 
        ...editingMember, 
        gender: newGender,
        maidenName: newGender === 'female' ? editingMember.maidenName : ''
      });
    }
  };
  
  // Elhunyt állapot váltása
  const handleDeceasedChange = (e) => {
    setNewMember(prev => ({ 
      ...prev, 
      isDeceased: e.target.checked,
      deathYear: e.target.checked ? prev.deathYear : ''
    }));
  };
  
  // Szerkesztésnél elhunyt állapot váltása
  const handleEditDeceasedChange = (e) => {
    if (editingMember) {
      setEditingMember({ 
        ...editingMember, 
        isDeceased: e.target.checked,
        deathYear: e.target.checked ? editingMember.deathYear : ''
      });
    }
  };
  
  // Billentyűzet navigáció gombok
  const handleKeyboardPan = (direction) => {
    const speed = 50;
    let dx = 0;
    let dy = 0;
    
    switch(direction) {
      case 'up': dy = speed; break;
      case 'down': dy = -speed; break;
      case 'left': dx = speed; break;
      case 'right': dx = -speed; break;
    }
    
    setPanOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
  };
  
  // Egér események hozzáadása/eltávolítása
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handlePanEnd);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handlePanEnd);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // Férfi és női tagok szűrése
  const maleMembers = members.filter(m => m.gender === 'male' && !m.isDeceased);
  const femaleMembers = members.filter(m => m.gender === 'female' && !m.isDeceased);

  return (
    <div className="App">
      {/* Oldalsó menü */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 350,
            backgroundColor: '#1a2530',
            color: 'white',
            padding: '25px'
          }
        }}
      >
        <div className="sidebar-header">
          <h2><FamilyRestroom /> Családfa</h2>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3><Settings /> Nézet</h3>
            <div className="zoom-controls">
              <IconButton 
                onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                sx={{ color: 'white' }}
              >
                <ZoomOut />
              </IconButton>
              <div className="zoom-display">
                <span>{Math.round(scale * 100)}%</span>
                <div className="zoom-factor">
                  Méret tényező: {scale.toFixed(2)}
                </div>
              </div>
              <IconButton 
                onClick={() => setScale(s => Math.min(5, s + 0.1))}
                sx={{ color: 'white' }}
              >
                <ZoomIn />
              </IconButton>
            </div>
            
            <div className="zoom-slider">
              <Slider
                value={scale}
                onChange={(e, newValue) => setScale(newValue)}
                min={0.1}
                max={3}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                sx={{ color: '#3498db' }}
              />
            </div>
            
            <div className="view-buttons">
              <Button
                variant="outlined"
                fullWidth
                onClick={handleResetView}
                sx={{ mt: 1, mb: 1, color: 'white', borderColor: 'white' }}
                startIcon={<Home />}
              >
                Alaphelyzet
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleFitToScreen}
                sx={{ color: 'white', borderColor: 'white' }}
                startIcon={<ZoomOutMap />}
              >
                Ablakhoz igazítás
              </Button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>🎮 Billentyűzet vezérlés</h3>
            <div className="keyboard-controls">
              <div className="keyboard-row">
                <IconButton 
                  onClick={() => handleKeyboardPan('up')}
                  sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <KeyboardArrowUp />
                </IconButton>
              </div>
              <div className="keyboard-row">
                <IconButton 
                  onClick={() => handleKeyboardPan('left')}
                  sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <KeyboardArrowLeft />
                </IconButton>
                <IconButton 
                  onClick={() => handleKeyboardPan('down')}
                  sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <KeyboardArrowDown />
                </IconButton>
                <IconButton 
                  onClick={() => handleKeyboardPan('right')}
                  sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </div>
            </div>
            <p className="keyboard-info">Nyilak: vászon mozgatása</p>
          </div>
          
          <div className="sidebar-section">
            <h3><Expand /> Vászon méret</h3>
            <p>Szélesség: {Math.round(canvasSize.width)}px</p>
            <p>Magasság: {Math.round(canvasSize.height)}px</p>
            <p>Növekedési tényező: 1.5ˣ</p>
            <Chip 
              label={`${members.length} tag`} 
              color="primary" 
              size="small"
              sx={{ mt: 1 }}
            />
          </div>
          
          <div className="sidebar-section">
            <h3>📊 Statisztika</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">Családtagok:</span>
                <span className="stat-value">{members.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Kapcsolatok:</span>
                <span className="stat-value">{connections.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Testvérek:</span>
                <span className="stat-value">
                  {connections.filter(c => c.type === 'testvér').length / 2}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Kijelölt:</span>
                <span className="stat-value">
                  {selectedMember ? members.find(m => m.id === selectedMember)?.name : 'nincs'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3><Delete /> Adatkezelés</h3>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={loadExample}
              sx={{ mb: 1 }}
            >
              Példa betöltése
            </Button>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={clearAll}
            >
              Minden törlése
            </Button>
          </div>
          
          <div className="sidebar-section">
            <h3>🎮 Vezérlés</h3>
            <div className="controls-list">
              <div className="control-item">
                <DragIndicator /> Húzd a tagokat
              </div>
              <div className="control-item">
                🖱️ Jobb klikk + húzás: Panoráma
              </div>
              <div className="control-item">
                🔍 Görgő: Zoom (dinamikus)
              </div>
              <div className="control-item">
                🏷️ Dupla klikk: Szerkesztés
              </div>
              <div className="control-item">
                ❌ Kereszt ikon: Törlés
              </div>
              <div className="control-item">
                <Group /> Intelligens testvérdetektálás
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Felső sáv */}
      <div className="top-bar">
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'white' }}>
          <MenuIcon />
        </IconButton>
        <h1>🌳 Családfa Vászon</h1>
        <div className="canvas-size-info">
          <span>Vászon: {Math.round(canvasSize.width)}×{Math.round(canvasSize.height)}px</span>
          <span className="zoom-info">Zoom: {Math.round(scale * 100)}%</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="stats-info">
          {members.length} tag • {connections.length} kapcsolat
        </div>
        <Tooltip title="Ablakhoz igazítás">
          <IconButton onClick={handleFitToScreen} sx={{ color: 'white' }}>
            <Compress />
          </IconButton>
        </Tooltip>
        <Tooltip title="Nézet alaphelyzet">
          <IconButton onClick={handleResetView} sx={{ color: 'white' }}>
            <Home />
          </IconButton>
        </Tooltip>
      </div>

      {/* Fő tartalom */}
      <div className="main-content">
        {/* Vászon */}
        <div 
          className="canvas-container"
          ref={containerRef}
          onMouseDown={handlePanStart}
          style={{
            cursor: isPanning ? 'grabbing' : 'grab'
          }}
        >
          <canvas ref={canvasRef} className="connections-canvas" />
          
          {members.map(member => {
            const size = calculateMemberSize(member, scale);
            const fontSize = calculateFontSize(scale);
            const fullName = member.maidenName && member.gender === 'female' 
              ? `${member.name} (szül. ${member.maidenName})`
              : member.name;
            
            // Keressük a testvéreket és szülőket
            const siblings = findSiblings(member.id);
            const hasSiblings = siblings.length > 0;
            const parents = getParents(member.id);
            const father = parents.father ? members.find(m => m.id === parents.father) : null;
            const mother = parents.mother ? members.find(m => m.id === parents.mother) : null;
            
            return (
              <div
                key={member.id}
                className={`family-member ${selectedMember === member.id ? 'selected' : ''} ${member.isDeceased ? 'deceased' : ''}`}
                style={{
                  left: `${(member.x * scale) + panOffset.x}px`,
                  top: `${(member.y * scale) + panOffset.y}px`,
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${fontSize}px`,
                  borderRadius: `${Math.min(20, size.width / 15)}px`,
                  padding: `${Math.min(20, size.width / 20)}px`,
                  borderColor: member.gender === 'male' ? '#3498db' : 
                              member.gender === 'female' ? '#e91e63' : '#9b59b6',
                  backgroundColor: member.isDeceased 
                    ? (member.gender === 'male' ? 'rgba(52, 152, 219, 0.1)' : 
                       member.gender === 'female' ? 'rgba(233, 30, 99, 0.1)' : 'rgba(155, 89, 182, 0.1)')
                    : (member.gender === 'male' ? 'rgba(52, 152, 219, 0.05)' : 
                       member.gender === 'female' ? 'rgba(233, 30, 99, 0.05)' : 'rgba(155, 89, 182, 0.05)')
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) handleDragStart(member.id, e.clientX, e.clientY);
                }}
                onDoubleClick={() => handleEditMemberOpen(member)}
              >
                <div className="member-content">
                  <div className="member-gender">
                    {member.gender === 'male' ? <Male /> : 
                     member.gender === 'female' ? <Female /> : <Transgender />}
                  </div>
                  <div className="member-name">{fullName}</div>
                  <div className="member-years">
                    {member.isDeceased && member.deathYear ? (
                      <>
                        <Cake fontSize="inherit" /> {member.birthYear} - <DateRange fontSize="inherit" /> {member.deathYear}
                        <span className="deceased-badge">†</span>
                      </>
                    ) : (
                      <>
                        <Cake fontSize="inherit" /> {member.birthYear}
                      </>
                    )}
                  </div>
                  
                  {(father || mother) && (
                    <div className="member-parents">
                      {father && <Man fontSize="inherit" />} {mother && <Woman fontSize="inherit" />}
                      <span className="parents-text">
                        {father ? father.name : '?'} & {mother ? mother.name : '?'}
                      </span>
                    </div>
                  )}
                  
                  {member.details && <div className="member-details">{member.details}</div>}
                  
                  {hasSiblings && (
                    <div className="sibling-info">
                      <Group fontSize="inherit" /> {siblings.length} testvér
                    </div>
                  )}
                  
                  <div className="member-actions">
                    <Tooltip title="Szerkesztés">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMemberOpen(member);
                        }}
                        sx={{ 
                          color: '#3498db',
                          fontSize: `${fontSize * 0.8}px`,
                          mr: 0.5
                        }}
                      >
                        <Edit fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Törlés">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(member.id);
                        }}
                        sx={{ 
                          color: '#e74c3c',
                          fontSize: `${fontSize * 0.8}px`
                        }}
                      >
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobb alsó sarok gombok */}
      <div className="bottom-right-buttons">
        <div className="button-stack">
          <Tooltip title="Új családtag hozzáadása">
            <IconButton 
              onClick={() => setAddMemberDialog(true)}
              sx={{ 
                backgroundColor: '#2ecc71',
                color: 'white',
                width: '60px',
                height: '60px',
                marginBottom: '15px',
                '&:hover': { backgroundColor: '#27ae60' }
              }}
            >
              <Add fontSize="large" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Használati útmutató">
            <IconButton 
              onClick={() => setInfoOpen(true)}
              sx={{ 
                backgroundColor: '#3498db',
                color: 'white',
                width: '60px',
                height: '60px',
                '&:hover': { backgroundColor: '#2980b9' }
              }}
            >
              <Info fontSize="large" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Új tag dialógus */}
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PersonAdd /> Új családtag hozzáadása
        </DialogTitle>
        <DialogContent>
          <div className="dialog-section">
            <h4>Alapadatok</h4>
            <TextField
              autoFocus
              margin="dense"
              label="Név *"
              fullWidth
              value={newMember.name}
              onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Nem</FormLabel>
              <ToggleButtonGroup
                value={newMember.gender}
                exclusive
                onChange={handleGenderChange}
                aria-label="nem"
                fullWidth
                sx={{ mt: 1 }}
              >
                <ToggleButton value="male" aria-label="férfi">
                  <Male sx={{ mr: 1 }} /> Férfi
                </ToggleButton>
                <ToggleButton value="female" aria-label="nő">
                  <Female sx={{ mr: 1 }} /> Nő
                </ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
            
            {newMember.gender === 'female' && (
              <TextField
                margin="dense"
                label="Leánykori név"
                fullWidth
                value={newMember.maidenName}
                onChange={(e) => setNewMember({...newMember, maidenName: e.target.value})}
                sx={{ mb: 2 }}
              />
            )}
            
            <div className="form-row">
              <TextField
                margin="dense"
                label="Születési év *"
                fullWidth
                value={newMember.birthYear}
                onChange={(e) => setNewMember({...newMember, birthYear: e.target.value})}
                sx={{ mr: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newMember.isDeceased}
                    onChange={handleDeceasedChange}
                    color="primary"
                  />
                }
                label="Elhunyt"
                sx={{ mt: 2 }}
              />
            </div>
            
            {newMember.isDeceased && (
              <TextField
                margin="dense"
                label="Halálozási év"
                fullWidth
                value={newMember.deathYear}
                onChange={(e) => setNewMember({...newMember, deathYear: e.target.value})}
                sx={{ mb: 2 }}
              />
            )}
            
            <TextField
              margin="dense"
              label="Részletek"
              fullWidth
              multiline
              rows={2}
              value={newMember.details}
              onChange={(e) => setNewMember({...newMember, details: e.target.value})}
              sx={{ mb: 3 }}
            />
          </div>
          
          {members.length > 0 && (
            <div className="dialog-section">
              <h4>Szülők</h4>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Apa</InputLabel>
                  <Select
                    value={newMember.fatherId}
                    onChange={(e) => setNewMember({...newMember, fatherId: e.target.value})}
                    label="Apa"
                  >
                    <MenuItem value="">Nincs megadva</MenuItem>
                    {maleMembers.map(member => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name} ({member.birthYear})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Anya</InputLabel>
                  <Select
                    value={newMember.motherId}
                    onChange={(e) => setNewMember({...newMember, motherId: e.target.value})}
                    label="Anya"
                  >
                    <MenuItem value="">Nincs megadva</MenuItem>
                    {femaleMembers.map(member => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name} ({member.birthYear})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {(newMember.fatherId || newMember.motherId) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Intelligens testvérdetektálás:</strong><br/>
                  Ha ugyanazok a szülők már szerepelnek egy másik személynél, 
                  a rendszer automatikusan felajánlja a testvéri kapcsolat létrehozását.
                </Alert>
              )}
            </div>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Fontos tudnivalók:</strong><br/>
            • Minden tag dupla kattintással szerkeszthető<br/>
            • Szülők megadása opcionális<br/>
            • Testvérek automatikus felismerése közös szülők esetén
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialog(false)}>Mégse</Button>
          <Button onClick={handleAddMember} variant="contained" color="primary">
            Hozzáadás
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag szerkesztése dialógus */}
      <Dialog open={editMemberDialog} onClose={() => setEditMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Edit /> Családtag szerkesztése
        </DialogTitle>
        <DialogContent>
          {editingMember && (
            <>
              <div className="dialog-section">
                <h4>Alapadatok</h4>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Név *"
                  fullWidth
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                  sx={{ mb: 2 }}
                />
                
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Nem</FormLabel>
                  <ToggleButtonGroup
                    value={editingMember.gender}
                    exclusive
                    onChange={handleEditGenderChange}
                    aria-label="nem"
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    <ToggleButton value="male" aria-label="férfi">
                      <Male sx={{ mr: 1 }} /> Férfi
                    </ToggleButton>
                    <ToggleButton value="female" aria-label="nő">
                      <Female sx={{ mr: 1 }} /> Nő
                    </ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>
                
                {editingMember.gender === 'female' && (
                  <TextField
                    margin="dense"
                    label="Leánykori név"
                    fullWidth
                    value={editingMember.maidenName}
                    onChange={(e) => setEditingMember({...editingMember, maidenName: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                )}
                
                <div className="form-row">
                  <TextField
                    margin="dense"
                    label="Születési év *"
                    fullWidth
                    value={editingMember.birthYear}
                    onChange={(e) => setEditingMember({...editingMember, birthYear: e.target.value})}
                    sx={{ mr: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingMember.isDeceased}
                        onChange={handleEditDeceasedChange}
                        color="primary"
                      />
                    }
                    label="Elhunyt"
                    sx={{ mt: 2 }}
                  />
                </div>
                
                {editingMember.isDeceased && (
                  <TextField
                    margin="dense"
                    label="Halálozási év"
                    fullWidth
                    value={editingMember.deathYear}
                    onChange={(e) => setEditingMember({...editingMember, deathYear: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                )}
                
                <TextField
                  margin="dense"
                  label="Részletek"
                  fullWidth
                  multiline
                  rows={2}
                  value={editingMember.details}
                  onChange={(e) => setEditingMember({...editingMember, details: e.target.value})}
                  sx={{ mb: 3 }}
                />
              </div>
              
              {members.length > 1 && (
                <div className="dialog-section">
                  <h4>Szülők</h4>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Apa</InputLabel>
                      <Select
                        value={editingMember.fatherId || ''}
                        onChange={(e) => setEditingMember({...editingMember, fatherId: e.target.value})}
                        label="Apa"
                      >
                        <MenuItem value="">Nincs megadva</MenuItem>
                        {maleMembers
                          .filter(m => m.id !== editingMember.id)
                          .map(member => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.name} ({member.birthYear})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Anya</InputLabel>
                      <Select
                        value={editingMember.motherId || ''}
                        onChange={(e) => setEditingMember({...editingMember, motherId: e.target.value})}
                        label="Anya"
                      >
                        <MenuItem value="">Nincs megadva</MenuItem>
                        {femaleMembers
                          .filter(m => m.id !== editingMember.id)
                          .map(member => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.name} ({member.birthYear})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Figyelem:</strong> A szülők módosítása tesvéri kapcsolatokat is befolyásolhat.
                    A rendszer automatikusan felajánlja a testvéri kapcsolatokat az új szülők alapján.
                  </Alert>
                </div>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (window.confirm('Biztosan törlöd ezt a családtagot?')) {
                handleDeleteMember(editingMember.id);
                setEditMemberDialog(false);
              }
            }}
            color="error"
          >
            Törlés
          </Button>
          <Button onClick={() => setEditMemberDialog(false)}>Mégse</Button>
          <Button onClick={handleEditMember} variant="contained" color="primary">
            Mentés
          </Button>
        </DialogActions>
      </Dialog>

      {/* Testvér dialógus */}
      <Dialog open={siblingDialog.open} onClose={() => setSiblingDialog({ open: false, member1: null, member2: null, commonParents: [] })}>
        <DialogTitle>
          <Group /> Testvéri kapcsolat felismerve!
        </DialogTitle>
        <DialogContent>
          <div className="sibling-dialog-content">
            <Typography variant="body1" gutterBottom>
              Azonos szülők detektálva:
            </Typography>
            
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Apa:</strong> {siblingDialog.fatherName || 'Ismeretlen'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Anya:</strong> {siblingDialog.motherName || 'Ismeretlen'}
              </Typography>
            </Box>
            
            <Typography variant="body1" gutterBottom>
              Ez azt jelenti, hogy az új személy testvére a következő személynek:
            </Typography>
            
            <Box sx={{ bgcolor: '#e8f5e8', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Testvér:</strong> {siblingDialog.siblingName}
              </Typography>
            </Box>
            
            <Typography variant="body1" gutterBottom>
              Szeretnéd testvéri kapcsolatként jelölni őket?
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              A testvéri kapcsolat zöld, vastag szaggatott vonallal jelenik meg a vásznon.
              Ez automatikusan jelzi, hogy a két személynek közös szülei vannak.
            </Alert>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSiblingDialog({ open: false, member1: null, member2: null, commonParents: [] })}>
            Nem
          </Button>
          <Button onClick={handleCreateSiblingConnection} variant="contained" color="success">
            Igen, testvérek
          </Button>
        </DialogActions>
      </Dialog>

      {/* Információs dialógus */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>📚 Használati útmutató</DialogTitle>
        <DialogContent>
          <div className="info-content">
            <div className="info-section">
              <h3>🎮 Alapvető vezérlés</h3>
              <ul>
                <li><strong>Húzd a családtagokat</strong> az egérrel a mozgatáshoz</li>
                <li><strong>Kattints duplán</strong> egy családtagra a szerkesztéshez (új ablakban)</li>
                <li><strong>Egérgörgő</strong> a zoomhoz (dinamikus méretezés)</li>
                <li><strong>Jobb egérgomb + húzás</strong> a sima panorámázáshoz</li>
                <li><strong>Billentyűzet nyilak</strong> a vászon mozgatásához</li>
                <li><strong>➕ Gomb jobb alsó sarokban:</strong> Új tag hozzáadása</li>
                <li><strong>ℹ️ Gomb alatta:</strong> Használati útmutató</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>👨‍👩‍👧‍👦 Szülők és Testvérek</h3>
              <ul>
                <li><strong>Szülők kiválasztása:</strong> Új tag hozzáadásakor vagy szerkesztéskor külön választhatod ki az apát és az anyát</li>
                <li><strong>Automatikus testvérdetektálás:</strong> Ha két személynek ugyanazok a szülei, a rendszer felkínálja a testvéri kapcsolat létrehozását</li>
                <li><strong>Testvér ikon:</strong> Testvérekkel rendelkező személyeknél megjelenik egy testvér ikon és a testvérek száma</li>
                <li><strong>Szülők megjelenítése:</strong> Minden családtag dobozában láthatóak a szülők nevei ikonokkal</li>
                <li><strong>Közös szülők = Testvérek:</strong> Ugyanazon apa és anya gyermekei automatikusan testvéreknek számítanak</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>✏️ Szerkesztés</h3>
              <ul>
                <li><strong>Dupla kattintás:</strong> Bármelyik családtagon duplán kattintva megnyílik a szerkesztő ablak</li>
                <li><strong>Teljes szerkesztő felület:</strong> Ugyanaz az ablak mint az új tag hozzáadásánál, de szerkesztési módban</li>
                <li><strong>Szülők módosítása:</strong> Szerkesztéskor is módosíthatod az apa és anya adatait</li>
                <li><strong>Törlés gomb:</strong> A szerkesztő ablakban is van törlés gomb</li>
                <li><strong>Automatikus frissítés:</strong> Szülők módosításakor automatikusan frissülnek a testvéri kapcsolatok</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🔗 Kapcsolatok</h3>
              <ul>
                <li><span style={{color: '#e74c3c'}}>● Piros vonal:</span> Házasság</li>
                <li><span style={{color: '#3498db'}}>● Kék szaggatott vonal:</span> Szülői kapcsolat</li>
                <li><span style={{color: '#2ecc71'}}>● Zöld vastag szaggatott vonal:</span> Testvéri kapcsolat</li>
                <li><strong>Automatikus kapcsolatok:</strong> Szülők kiválasztásakor automatikusan létrejönnek a megfelelő kapcsolatok</li>
                <li><strong>Intelligens rendszer:</strong> A rendszer automatikusan felismeri és javasolja a kapcsolatokat</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🎨 Vizuális jelölések</h3>
              <ul>
                <li><span style={{color: '#3498db'}}>● Kék szegély:</span> Férfi</li>
                <li><span style={{color: '#e91e63'}}>● Rózsaszín szegély:</span> Nő</li>
                <li><span style={{color: '#666', opacity: 0.7}}>● Szürke háttér:</span> Elhunyt személy</li>
                <li><strong>👨 ikon:</strong> Apa neve mellett</li>
                <li><strong>👩 ikon:</strong> Anya neve mellett</li>
                <li><strong>👥 ikon:</strong> Testvérekkel rendelkező személy</li>
                <li><strong>✏️ ikon:</strong> Szerkesztés gomb a jobb felső sarokban</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>💾 Adatkezelés</h3>
              <ul>
                <li>Minden változás automatikusan mentődik a böngésződbe</li>
                <li>Az adatok csak ezen a számítógépen és böngészőben érhetők el</li>
                <li>"Példa betöltése": Tesztadatok betöltése</li>
                <li>"Minden törlése": Összes adat eltávolítása</li>
              </ul>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(true)} variant="contained" color="primary">
            Értettem
          </Button>
        </DialogActions>
      </Dialog>

      {/* Értesítés */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;