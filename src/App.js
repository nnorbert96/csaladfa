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
  Man,
  Favorite
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
  Divider,
  Grid,
  Tabs,
  Tab
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
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
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [scale, setScale] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [editMemberDialog, setEditMemberDialog] = useState(false);
  const [siblingDialog, setSiblingDialog] = useState({ 
    open: false, 
    member1: null, 
    member2: null, 
    commonParents: [],
    fatherName: '',
    motherName: '',
    siblingName: ''
  });
  const [newMember, setNewMember] = useState({ 
    name: '', 
    maidenName: '',
    birthYear: '', 
    deathYear: '',
    gender: 'male',
    details: '', // Üres, mivel ezt nem jelenítjük meg
    isDeceased: false,
    fatherId: '',
    motherId: '',
    siblingId: '',
    spouseId: ''
  });
  const [editingMember, setEditingMember] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState('basic');
  
  // Referenciák
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const selectionCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragMemberIdRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const keysPressed = useRef(new Set());
  const shiftPressed = useRef(false);
  const selectionStartRef = useRef(null);
  const lastClickTimeRef = useRef(0);

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
    
    // Ütközésmentesség ellenőrzése
    if (members.length > 0) {
      const adjustedMembers = checkForOverlap(members);
      setMembers(adjustedMembers);
    }
  }, [members.length]);
  
  // Ütközésmentesség ellenőrzése
  const checkForOverlap = (memberList) => {
    const adjustedMembers = [...memberList];
    const minDistance = 100; // Minimális távolság a tagok között
    
    for (let i = 0; i < adjustedMembers.length; i++) {
      for (let j = i + 1; j < adjustedMembers.length; j++) {
        const dx = adjustedMembers[i].x - adjustedMembers[j].x;
        const dy = adjustedMembers[i].y - adjustedMembers[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          // Ha túl közel vannak, mozdítsuk el őket
          const angle = Math.atan2(dy, dx);
          const pushDistance = (minDistance - distance) / scale;
          
          adjustedMembers[i].x += Math.cos(angle) * pushDistance / 2;
          adjustedMembers[i].y += Math.sin(angle) * pushDistance / 2;
          adjustedMembers[j].x -= Math.cos(angle) * pushDistance / 2;
          adjustedMembers[j].y -= Math.sin(angle) * pushDistance / 2;
        }
      }
    }
    
    return adjustedMembers;
  };
  
  // Billentyűzet események
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.add(e.key);
      if (e.key === 'Shift') {
        shiftPressed.current = true;
        if (containerRef.current && !isPanning) {
          containerRef.current.style.cursor = 'crosshair';
        }
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key);
      if (e.key === 'Shift') {
        shiftPressed.current = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = isPanning ? 'grabbing' : 'grab';
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);
  
  // Kapcsolatok rajzolása - OPTIMALIZÁLT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    
    // Csak akkor méretezzük újra, ha megváltozott
    if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Több rajzolási művelet egy requestAnimationFrame-ben
    const drawFrame = () => {
      // Törlés
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid rajzolása
      drawGrid(ctx, canvas.width, canvas.height);
      
      // Kapcsolatok rajzolása
      drawConnections(ctx);
    };
    
    requestAnimationFrame(drawFrame);
  }, [members, connections, scale, panOffset]);
  
  // Grid rajzolása - JAVÍTVA
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
    
    // Vízszintes vonalak - JAVÍTVA
    for (let y = (panOffset.y % gridSize); y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);  // Javítva: width, y (nem width, height)
      ctx.stroke();
    }
  };
  
  // Kapcsolatok rajzolása - Külön függvénybe szervezve
  const drawConnections = (ctx) => {
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
        drawArrow(ctx, fromX, fromY, toX, toY, Math.max(0.5, scale));
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
  };
  
  // Nyíl rajzolása
  const drawArrow = (ctx, fromX, fromY, toX, toY, arrowScale) => {
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
  
  // Selection rectangle rajzolása
  useEffect(() => {
    const selectionCanvas = selectionCanvasRef.current;
    if (!selectionCanvas || !containerRef.current) return;
    
    const ctx = selectionCanvas.getContext('2d');
    const container = containerRef.current;
    
    selectionCanvas.width = container.clientWidth;
    selectionCanvas.height = container.clientHeight;
    
    // Törlés
    ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    
    // Selection rectangle rajzolása
    if (selectionRect) {
      const { startX, startY, endX, endY } = selectionRect;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      
      // Átlós vonalkázás
      ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      ctx.fillRect(x, y, width, height);
      
      // Szegély
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      
      // Reset line dash
      ctx.setLineDash([]);
      
      // Számláló
      const selectedCount = Array.from(selectedMembers).length;
      if (selectedCount > 0) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.fillRect(x + 5, y + 5, 120, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${selectedCount} kiválasztva`, x + 10, y + 20);
      }
    }
  }, [selectionRect, selectedMembers]);
  
  // Szülők lekérése egy taghoz
  const getParents = useCallback((memberId) => {
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
  }, [connections, members]);
  
  // Házastárs lekérése egy taghoz
  const getSpouse = useCallback((memberId) => {
    const marriageConnections = connections.filter(
      conn => conn.type === 'házasság' && 
      (conn.from === memberId || conn.to === memberId)
    );
    
    if (marriageConnections.length > 0) {
      const connection = marriageConnections[0];
      const spouseId = connection.from === memberId ? connection.to : connection.from;
      return members.find(m => m.id === spouseId);
    }
    
    return null;
  }, [connections, members]);
  
  // Testvérek keresése egy taghoz
  const findSiblings = useCallback((memberId) => {
    const parents = getParents(memberId);
    if (!parents.father && !parents.mother) return [];
    
    const siblings = members.filter(member => {
      if (member.id === memberId) return false;
      
      const memberParents = getParents(member.id);
      return (
        (parents.father && memberParents.father === parents.father) ||
        (parents.mother && memberParents.mother === parents.mother)
      );
    });
    
    return siblings;
  }, [getParents, members]);
  
  // Tag méretének kiszámítása dinamikusan a tartalom és zoom alapján - ARÁNYOS
  const calculateMemberSize = useCallback((member, currentScale) => {
    // Alapméret a zoom alapján - ARÁNYOS a zoommal
    const baseWidth = 160 * currentScale;
    const baseHeight = 100 * currentScale;
    
    // Minimális méretek
    const minWidth = 140 * currentScale;
    const minHeight = 90 * currentScale;
    
    // Dinamikus méret a név hossza alapján
    const nameLength = member.name.length + (member.maidenName ? member.maidenName.length : 0);
    const contentWidth = Math.max(
      minWidth,
      baseWidth + (nameLength * 2 * currentScale)
    );
    
    // Magasság számítása
    const lines = 2; // Név + születési év (ha elhunyt, akkor +1 sor)
    const contentHeight = Math.max(
      minHeight,
      baseHeight + (lines * 15 * currentScale)
    );
    
    return {
      width: contentWidth,
      height: contentHeight
    };
  }, []);
  
  // Tag betűmérete a zoomhoz - ARÁNYOS
  const calculateFontSize = useCallback((currentScale) => {
    const baseFontSize = 14;
    return Math.max(10, baseFontSize * currentScale);
  }, []);
  
  // Új tag hozzáadása
  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      showNotification('Add meg a nevet!', 'warning');
      return;
    }
    
    if (!newMember.birthYear.trim()) {
      showNotification('Add meg a születési évet!', 'warning');
      return;
    }
    
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    // Tagok számának függvényében számoljuk ki a pozíciót
    let newX, newY;
    const spouse = members.find(m => m.id === parseInt(newMember.spouseId));
    
    if (spouse) {
      // Házastárs mellé helyezzük
      newX = spouse.x + 250;
      newY = spouse.y;
    } else {
      const angle = (members.length * 2 * Math.PI) / (members.length + 1);
      const radius = 350 + (members.length * 60);
      newX = centerX + radius * Math.cos(angle);
      newY = centerY + radius * Math.sin(angle);
    }
    
    const newMemberObj = {
      id: newId,
      name: newMember.name,
      maidenName: newMember.gender === 'female' ? newMember.maidenName : '',
      birthYear: newMember.birthYear,
      deathYear: newMember.isDeceased ? newMember.deathYear : '',
      gender: newMember.gender,
      details: '', // Üres, mivel ezt nem jelenítjük meg
      isDeceased: newMember.isDeceased,
      x: newX,
      y: newY
    };
    
    const updatedMembers = [...members, newMemberObj];
    const adjustedMembers = checkForOverlap(updatedMembers);
    setMembers(adjustedMembers);
    
    // Kapcsolatok létrehozása
    const newConnections = [];
    let connectionId = connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1;
    
    // Szülői kapcsolatok létrehozása
    if (newMember.fatherId) {
      newConnections.push({
        id: connectionId++,
        from: parseInt(newMember.fatherId),
        to: newId,
        type: 'szülő'
      });
    }
    
    if (newMember.motherId) {
      newConnections.push({
        id: connectionId++,
        from: parseInt(newMember.motherId),
        to: newId,
        type: 'szülő'
      });
    }
    
    // Testvér kapcsolat létrehozása
    if (newMember.siblingId) {
      newConnections.push({
        id: connectionId++,
        from: newId,
        to: parseInt(newMember.siblingId),
        type: 'testvér'
      });
    }
    
    // Házastársi kapcsolat létrehozása
    if (newMember.spouseId) {
      newConnections.push({
        id: connectionId++,
        from: newId,
        to: parseInt(newMember.spouseId),
        type: 'házasság'
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
      details: '', // Üres, mivel ezt nem jelenítjük meg
      isDeceased: false,
      fatherId: '',
      motherId: '',
      siblingId: '',
      spouseId: ''
    });
    
    setActiveTab('basic');
    setAddMemberDialog(false);
    showNotification(`${newMemberObj.name} hozzáadva a családfához`, 'success');
  };
  
  // Tag szerkesztése
  const handleEditMember = () => {
    if (!editingMember || !editingMember.name.trim()) {
      showNotification('Add meg a nevet!', 'warning');
      return;
    }
    
    if (!editingMember.birthYear.trim()) {
      showNotification('Add meg a születési évet!', 'warning');
      return;
    }
    
    // Frissítsük a tagot
    const updatedMembers = members.map(member => 
      member.id === editingMember.id ? editingMember : member
    );
    const adjustedMembers = checkForOverlap(updatedMembers);
    setMembers(adjustedMembers);
    
    // Szülői kapcsolatok frissítése
    const fatherId = editingMember.fatherId ? parseInt(editingMember.fatherId) : null;
    const motherId = editingMember.motherId ? parseInt(editingMember.motherId) : null;
    const siblingId = editingMember.siblingId ? parseInt(editingMember.siblingId) : null;
    
    // Töröljük a régi szülői kapcsolatokat
    let filteredConnections = connections.filter(conn => 
      !(conn.to === editingMember.id && conn.type === 'szülő')
    );
    
    // Töröljük a régi házastársi kapcsolatokat is
    filteredConnections = filteredConnections.filter(conn => 
      !(conn.type === 'házasság' && 
        (conn.from === editingMember.id || conn.to === editingMember.id))
    );
    
    // Töröljük a régi testvér kapcsolatokat is
    filteredConnections = filteredConnections.filter(conn => 
      !(conn.type === 'testvér' && 
        (conn.from === editingMember.id || conn.to === editingMember.id))
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
    
    // Testvér kapcsolat
    if (siblingId) {
      newConnections.push({
        id: connectionId++,
        from: editingMember.id,
        to: siblingId,
        type: 'testvér'
      });
    }
    
    // Házastársi kapcsolat
    if (editingMember.spouseId) {
      newConnections.push({
        id: connectionId++,
        from: editingMember.id,
        to: parseInt(editingMember.spouseId),
        type: 'házasság'
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
    setActiveTab('basic');
    showNotification(`${editingMember.name} adatai frissítve`, 'success');
  };
  
  // Testvér kapcsolat ellenőrzése
  const checkForSiblings = (newMemberId, fatherId, motherId) => {
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
    
    setSiblingDialog({ 
      open: false, 
      member1: null, 
      member2: null, 
      commonParents: [],
      fatherName: '',
      motherName: '',
      siblingName: ''
    });
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
      // Távolítsuk el a kiválasztott tagok közül is
      const newSelected = new Set(selectedMembers);
      newSelected.delete(id);
      setSelectedMembers(newSelected);
      showNotification(`${memberName} eltávolítva`, 'info');
    }
  };
  
  // Tag szerkesztés megnyitása
  const handleEditMemberOpen = (member) => {
    const parents = getParents(member.id);
    const siblings = findSiblings(member.id);
    const spouse = getSpouse(member.id);
    
    setEditingMember({
      ...member,
      fatherId: parents.father ? parents.father.toString() : '',
      motherId: parents.mother ? parents.mother.toString() : '',
      siblingId: siblings.length > 0 ? siblings[0].id.toString() : '',
      spouseId: spouse ? spouse.id.toString() : ''
    });
    setEditMemberDialog(true);
    setSelectedMember(member.id);
  };
  
  // Húzás kezdete egy tagra
  const handleDragStart = (memberId, clientX, clientY) => {
    if (selectedMembers.has(memberId) && selectedMembers.size > 1) {
      isDraggingRef.current = true;
      dragMemberIdRef.current = 'multiple';
      dragStartRef.current = { x: clientX, y: clientY };
    } 
    else if (!shiftPressed.current) {
      isDraggingRef.current = true;
      dragMemberIdRef.current = memberId;
      dragStartRef.current = { x: clientX, y: clientY };
      setSelectedMember(memberId);
      setSelectedMembers(new Set([memberId]));
    }
  };

  // Egér mozgás
  const handleMouseMove = useCallback((e) => {
    // Selection mode
    if (isSelecting && selectionStartRef.current) {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      setSelectionRect({
        startX: selectionStartRef.current.x,
        startY: selectionStartRef.current.y,
        endX: currentX,
        endY: currentY
      });
      
      // Ellenőrizzük, hogy mely tagok vannak a kijelölésben
      const x1 = Math.min(selectionStartRef.current.x, currentX);
      const x2 = Math.max(selectionStartRef.current.x, currentX);
      const y1 = Math.min(selectionStartRef.current.y, currentY);
      const y2 = Math.max(selectionStartRef.current.y, currentY);
      
      const newSelected = new Set();
      members.forEach(member => {
        const memberX = (member.x * scale) + panOffset.x;
        const memberY = (member.y * scale) + panOffset.y;
        const size = calculateMemberSize(member, scale);
        
        if (memberX >= x1 && memberX <= x2 && memberY >= y1 && memberY <= y2) {
          newSelected.add(member.id);
        }
      });
      
      setSelectedMembers(newSelected);
    }
    
    // Húzás egy tag
    if (isDraggingRef.current && dragMemberIdRef.current && dragMemberIdRef.current !== 'multiple') {
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
    
    // Húzás több tag
    if (isDraggingRef.current && dragMemberIdRef.current === 'multiple' && selectedMembers.size > 0) {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      
      setMembers(prev => 
        prev.map(member => 
          selectedMembers.has(member.id)
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
      
      const smoothFactor = 0.3;
      setPanOffset(prev => ({
        x: prev.x + dx * smoothFactor,
        y: prev.y + dy * smoothFactor
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, isSelecting, scale, panOffset, members, calculateMemberSize, selectedMembers]);

  // Egér fel
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragMemberIdRef.current = null;
    
    // Selection befejezése
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionRect(null);
      selectionStartRef.current = null;
      
      if (selectedMembers.size > 0) {
        showNotification(`${selectedMembers.size} tag kiválasztva`, 'info');
      }
    }
    
    // Ütközésmentesség ellenőrzése húzás után
    const adjustedMembers = checkForOverlap(members);
    if (JSON.stringify(adjustedMembers) !== JSON.stringify(members)) {
      setMembers(adjustedMembers);
    }
  }, [isSelecting, selectedMembers, members]);

  // Egér lenyomása
  const handleMouseDown = useCallback((e) => {
    // Bal egérgomb + Shift = selection mode
    if (e.button === 0 && shiftPressed.current && !isPanning) {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      
      const clickedOnMember = e.target.closest('.family-member');
      if (clickedOnMember) {
        return;
      }
      
      setIsSelecting(true);
      selectionStartRef.current = { x: startX, y: startY };
      setSelectionRect({
        startX,
        startY,
        endX: startX,
        endY: startY
      });
      
      if (selectedMembers.size === 0) {
        setSelectedMembers(new Set());
        setSelectedMember(null);
      }
      return;
    }
    
    // Jobb egérgomb panoráma
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  }, [isPanning, shiftPressed.current, selectedMembers]);

  // Panoráma vége
  const handlePanEnd = () => {
    setIsPanning(false);
    
    if (containerRef.current) {
      if (shiftPressed.current) {
        containerRef.current.style.cursor = 'crosshair';
      } else {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };
  
  // Zoom az egér görgővel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const delta = e.deltaY > 0 ? 1 - zoomFactor : 1 + zoomFactor;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    
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
    const padding = 100;
    
    const minX = Math.min(...members.map(m => m.x));
    const maxX = Math.max(...members.map(m => m.x));
    const minY = Math.min(...members.map(m => m.y));
    const maxY = Math.max(...members.map(m => m.y));
    
    const contentWidth = maxX - minX + 300;
    const contentHeight = maxY - minY + 300;
    
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
        details: '', // Üres, mivel ezt nem jelenítjük meg
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
    
    const adjustedMembers = checkForOverlap(exampleMembers);
    setMembers(adjustedMembers);
    setConnections(exampleConnections);
    setSelectedMembers(new Set());
    setSelectedMember(null);
    showNotification('Példa családfa betöltve', 'success');
  };
  
  // Minden törlése
  const clearAll = () => {
    if (window.confirm('Biztosan törlöd az összes adatot?')) {
      setMembers([]);
      setConnections([]);
      setSelectedMembers(new Set());
      setSelectedMember(null);
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
  
  // Tag klikkelése
  const handleMemberClick = (memberId, e) => {
    const now = Date.now();
    const isDoubleClick = now - lastClickTimeRef.current < 300;
    lastClickTimeRef.current = now;
    
    if (isDoubleClick) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        handleEditMemberOpen(member);
      }
      return;
    }
    
    // Ha Shift nyomva van, adjuk hozzá/vegyük ki a kijelölésből
    if (shiftPressed.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const newSelected = new Set(selectedMembers);
      if (newSelected.has(memberId)) {
        newSelected.delete(memberId);
      } else {
        newSelected.add(memberId);
      }
      setSelectedMembers(newSelected);
      setSelectedMember(newSelected.size === 1 ? memberId : null);
      
      if (newSelected.size > 1) {
        showNotification(`${newSelected.size} tag kiválasztva`, 'info');
      }
    } else {
      setSelectedMember(memberId);
      setSelectedMembers(new Set([memberId]));
    }
  };

  // Vászonra kattintás (kijelölés törlése)
  const handleCanvasClick = (e) => {
    if (!e.target.closest('.family-member') && !shiftPressed.current) {
      setSelectedMembers(new Set());
      setSelectedMember(null);
    }
  };

  // Egér események hozzáadása/eltávolítása
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handlePanEnd);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handlePanEnd);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [handleWheel, handleMouseMove, handleMouseUp, handleMouseDown, handlePanEnd]);

  // Férfi és női tagok szűrése
  const maleMembers = members.filter(m => m.gender === 'male');
  const femaleMembers = members.filter(m => m.gender === 'female');
  
  // Elérhető házastársak (kivéve önmaga)
  const availableSpouses = members.filter(member => {
    const spouse = getSpouse(member.id);
    return !spouse && member.id !== editingMember?.id;
  });

  // Függőleges téglalap alakú adatlap stílus
  const verticalFormStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '8px',
  };

  // Függőleges kapcsolat sor stílus
  const relationshipRowStyle = {
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
  };

  return (
    <div className="App">
      {/* Oldalsó menü - JAVÍTVA: PaperProps helyett Box */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 350,
            backgroundColor: '#1a2530',
            color: 'white',
            padding: '25px',
            height: '100%',
            overflowY: 'auto'
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
              <p className="keyboard-info" style={{ color: '#2ecc71', marginTop: '5px' }}>
                Shift + bal klikk: Több tag kijelölése
              </p>
              <p className="keyboard-info" style={{ color: '#e67e22', marginTop: '5px' }}>
                Dupla klikk: Tag szerkesztése
              </p>
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
              {selectedMembers.size > 0 && (
                <Chip 
                  label={`${selectedMembers.size} kiválasztva`} 
                  color="success" 
                  size="small"
                  sx={{ mt: 1, ml: 1 }}
                />
              )}
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
                  <span className="stat-label">Házasságok:</span>
                  <span className="stat-value">
                    {connections.filter(c => c.type === 'házasság').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Kijelölt:</span>
                  <span className="stat-value">
                    {selectedMembers.size > 0 ? `${selectedMembers.size} tag` : 
                     selectedMember ? members.find(m => m.id === selectedMember)?.name : 'nincs'}
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
              <h3>🎮 Új Vezérlés</h3>
              <div className="controls-list">
                <div className="control-item">
                  <DragIndicator /> Húzd a tagokat
                </div>
                <div className="control-item">
                  <span style={{color: '#2ecc71'}}>⇧ Shift + bal klikk:</span> Több tag kijelölése
                </div>
                <div className="control-item">
                  <span style={{color: '#2ecc71'}}>⇧ Shift + húzás:</span> Téglalap kijelölés
                </div>
                <div className="control-item">
                  🖱️ Jobb klikk + húzás: LASSÚ panoráma
                </div>
                <div className="control-item">
                  🔍 Görgő: Zoom (dinamikus, arányos)
                </div>
                <div className="control-item">
                  🏷️ Dupla klikk: Szerkesztés
                </div>
                <div className="control-item">
                  ❌ Kereszt ikon: Törlés
                </div>
                <div className="control-item">
                  <Favorite /> Házastárs hozzáadása
                </div>
              </div>
            </div>
          </div>
        </Box>
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
          {selectedMembers.size > 0 && (
            <span className="selection-info" style={{color: '#2ecc71', marginLeft: '10px'}}>
              {selectedMembers.size} kiválasztva
            </span>
          )}
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

      {/* Kijelölt tagok száma */}
      {selectedMembers.size > 0 && (
        <div className="selection-count">
          <Group fontSize="small" />
          {selectedMembers.size} tag kiválasztva
        </div>
      )}

      {/* Fő tartalom */}
      <div className="main-content">
        {/* Vászon háttérben */}
        <div className="canvas-background">
          <canvas ref={canvasRef} className="connections-canvas" />
          <canvas ref={selectionCanvasRef} className="selection-canvas" />
        </div>
        
        {/* Tagok konténere előtérben */}
        <div 
          className="canvas-container"
          ref={containerRef}
          onClick={handleCanvasClick}
          style={{
            cursor: shiftPressed.current ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
          }}
        >
          {members.map(member => {
            const size = calculateMemberSize(member, scale);
            const fontSize = calculateFontSize(scale);
            const isSelected = selectedMembers.has(member.id) || selectedMember === member.id;
            
            return (
              <div
                key={member.id}
                className={`family-member ${member.gender === 'male' ? 'male' : 'female'} ${isSelected ? 'selected' : ''} ${member.isDeceased ? 'deceased' : ''}`}
                style={{
                  left: `${(member.x * scale) + panOffset.x}px`,
                  top: `${(member.y * scale) + panOffset.y}px`,
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${fontSize}px`,
                  borderRadius: `${Math.min(20, size.width / 15)}px`,
                  padding: `${Math.min(15, size.width / 25)}px`,
                  borderWidth: `${3 * Math.min(1, scale)}px`,
                  transformOrigin: 'center center',
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    handleDragStart(member.id, e.clientX, e.clientY);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMemberClick(member.id, e);
                }}
              >
                <div className="member-content">
                  <div className="member-gender">
                    {member.gender === 'male' ? <Male /> : 
                     member.gender === 'female' ? <Female /> : <Transgender />}
                  </div>
                  
                  {/* Csak a név */}
                  <div className="member-name">{member.name}</div>
                  
                  {/* Leánykori név (csak nőknek) */}
                  {member.maidenName && member.gender === 'female' && (
                    <div className="member-maiden-name">
                      szül. {member.maidenName}
                    </div>
                  )}
                  
                  {/* Születési/halálozási év */}
                  <div className="member-years">
                    {member.isDeceased && member.deathYear ? (
                      <>
                        <Cake fontSize="inherit" /> {member.birthYear} - {member.deathYear}
                        <span className="deceased-badge">†</span>
                      </>
                    ) : (
                      <>
                        <Cake fontSize="inherit" /> {member.birthYear}
                      </>
                    )}
                  </div>
                  
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

      {/* Jobb alsó sarok gombok - Plusz gomb felette, Info alatta */}
      <div className="floating-buttons-container">
        <Tooltip title="Új családtag hozzáadása">
          <IconButton 
            onClick={() => setAddMemberDialog(true)}
            className="floating-button"
            sx={{ 
              backgroundColor: '#2ecc71',
              color: 'white',
              '&:hover': {
                backgroundColor: '#27ae60',
                transform: 'scale(1.1)',
              }
            }}
          >
            <Add fontSize="large" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Használati útmutató">
          <IconButton 
            onClick={() => setInfoOpen(true)}
            className="floating-button"
            sx={{ 
              backgroundColor: '#3498db',
              color: 'white',
              '&:hover': {
                backgroundColor: '#2980b9',
                transform: 'scale(1.1)',
              }
            }}
          >
            <Info fontSize="large" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Új tag dialógus - Függőleges téglalap alakú */}
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 24px'
        }}>
          <PersonAdd sx={{ mr: 1 }} /> Új családtag hozzáadása
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Alapadatok" value="basic" />
              <Tab label="Kapcsolatok" value="connections" />
            </Tabs>
          </Box>
          
          <div style={verticalFormStyle}>
            {activeTab === 'basic' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    autoFocus
                    fullWidth
                    label="Név *"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Nem</InputLabel>
                    <Select
                      value={newMember.gender}
                      onChange={(e) => setNewMember({...newMember, gender: e.target.value})}
                      label="Nem"
                    >
                      <MenuItem value="male">Férfi</MenuItem>
                      <MenuItem value="female">Nő</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {newMember.gender === 'female' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Leánykori név"
                      value={newMember.maidenName}
                      onChange={(e) => setNewMember({...newMember, maidenName: e.target.value})}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Születési év *"
                    value={newMember.birthYear}
                    onChange={(e) => setNewMember({...newMember, birthYear: e.target.value})}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newMember.isDeceased}
                        onChange={handleDeceasedChange}
                        color="primary"
                      />
                    }
                    label="Elhunyt"
                    sx={{ mb: 2, mt: 1 }}
                  />
                </Grid>
                
                {newMember.isDeceased && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Halálozási év"
                      value={newMember.deathYear}
                      onChange={(e) => setNewMember({...newMember, deathYear: e.target.value})}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                )}
              </Grid>
            )}
            
            {activeTab === 'connections' && members.length > 0 && (
              <div className="vertical-connections">
                <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
                  Kapcsolatok kiválasztása
                </Typography>
                
                {/* Apa - külön sorban */}
                <div style={relationshipRowStyle}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#3498db' }}>
                    <Man sx={{ mr: 1, verticalAlign: 'middle' }} /> Apa
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Apa kiválasztása</InputLabel>
                    <Select
                      value={newMember.fatherId}
                      onChange={(e) => setNewMember({...newMember, fatherId: e.target.value})}
                      label="Apa kiválasztása"
                    >
                      <MenuItem value="">Nincs megadva</MenuItem>
                      {maleMembers.map(member => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                
                {/* Anya - külön sorban */}
                <div style={relationshipRowStyle}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#e91e63' }}>
                    <Woman sx={{ mr: 1, verticalAlign: 'middle' }} /> Anya
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Anya kiválasztása</InputLabel>
                    <Select
                      value={newMember.motherId}
                      onChange={(e) => setNewMember({...newMember, motherId: e.target.value})}
                      label="Anya kiválasztása"
                    >
                      <MenuItem value="">Nincs megadva</MenuItem>
                      {femaleMembers.map(member => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                
                {/* Testvér - külön sorban */}
                <div style={relationshipRowStyle}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#2ecc71' }}>
                    <Group sx={{ mr: 1, verticalAlign: 'middle' }} /> Testvér
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Testvér kiválasztása</InputLabel>
                    <Select
                      value={newMember.siblingId}
                      onChange={(e) => setNewMember({...newMember, siblingId: e.target.value})}
                      label="Testvér kiválasztása"
                    >
                      <MenuItem value="">Nincs megadva</MenuItem>
                      {members.map(member => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                          {member.gender === 'male' ? ' 👨' : ' 👩'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                
                {/* Házastárs - külön sorban */}
                <div style={relationshipRowStyle}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#e74c3c' }}>
                    <Favorite sx={{ mr: 1, verticalAlign: 'middle' }} /> Házastárs
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Házastárs kiválasztása</InputLabel>
                    <Select
                      value={newMember.spouseId}
                      onChange={(e) => setNewMember({...newMember, spouseId: e.target.value})}
                      label="Házastárs kiválasztása"
                    >
                      <MenuItem value="">Nincs megadva</MenuItem>
                      {availableSpouses.map(member => (
                        <MenuItem 
                          key={member.id} 
                          value={member.id}
                          sx={{ 
                            color: member.gender === 'male' ? '#3498db' : '#e91e63'
                          }}
                        >
                          {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                          {member.gender === 'male' ? ' 👨' : ' 👩'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Fontos:</strong> A kapcsolatok kiválasztása nem kötelező. 
                  Az új személy automatikusan elhelyezésre kerül a vásznon.
                </Alert>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialog(false)}>Mégse</Button>
          <Button onClick={handleAddMember} variant="contained" color="primary">
            Hozzáadás
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag szerkesztése dialógus - Függőleges téglalap alakú */}
      <Dialog open={editMemberDialog} onClose={() => setEditMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 24px'
        }}>
          <Edit sx={{ mr: 1 }} /> Családtag szerkesztése
        </DialogTitle>
        <DialogContent>
          {editingMember && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Alapadatok" value="basic" />
                  <Tab label="Kapcsolatok" value="connections" />
                </Tabs>
              </Box>
              
              <div style={verticalFormStyle}>
                {activeTab === 'basic' && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        autoFocus
                        fullWidth
                        label="Név *"
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Nem</InputLabel>
                        <Select
                          value={editingMember.gender}
                          onChange={(e) => setEditingMember({...editingMember, gender: e.target.value})}
                          label="Nem"
                        >
                          <MenuItem value="male">Férfi</MenuItem>
                          <MenuItem value="female">Nő</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {editingMember.gender === 'female' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Leánykori név"
                          value={editingMember.maidenName}
                          onChange={(e) => setEditingMember({...editingMember, maidenName: e.target.value})}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Születési év *"
                        value={editingMember.birthYear}
                        onChange={(e) => setEditingMember({...editingMember, birthYear: e.target.value})}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingMember.isDeceased}
                            onChange={handleEditDeceasedChange}
                            color="primary"
                          />
                        }
                        label="Elhunyt"
                        sx={{ mb: 2, mt: 1 }}
                      />
                    </Grid>
                    
                    {editingMember.isDeceased && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Halálozási év"
                          value={editingMember.deathYear}
                          onChange={(e) => setEditingMember({...editingMember, deathYear: e.target.value})}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                )}
                
                {activeTab === 'connections' && members.length > 1 && (
                  <div className="vertical-connections">
                    <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
                      Kapcsolatok szerkesztése
                    </Typography>
                    
                    {/* Apa */}
                    <div style={relationshipRowStyle}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: '#3498db' }}>
                        <Man sx={{ mr: 1, verticalAlign: 'middle' }} /> Apa
                      </Typography>
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
                                {member.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </div>
                    
                    {/* Anya */}
                    <div style={relationshipRowStyle}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: '#e91e63' }}>
                        <Woman sx={{ mr: 1, verticalAlign: 'middle' }} /> Anya
                      </Typography>
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
                                {member.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </div>
                    
                    {/* Testvér */}
                    <div style={relationshipRowStyle}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: '#2ecc71' }}>
                        <Group sx={{ mr: 1, verticalAlign: 'middle' }} /> Testvér
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>Testvér</InputLabel>
                        <Select
                          value={editingMember.siblingId || ''}
                          onChange={(e) => setEditingMember({...editingMember, siblingId: e.target.value})}
                          label="Testvér"
                        >
                          <MenuItem value="">Nincs megadva</MenuItem>
                          {members
                            .filter(m => m.id !== editingMember.id)
                            .map(member => (
                              <MenuItem key={member.id} value={member.id}>
                                {member.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </div>
                    
                    {/* Házastárs */}
                    <div style={relationshipRowStyle}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: '#e74c3c' }}>
                        <Favorite sx={{ mr: 1, verticalAlign: 'middle' }} /> Házastárs
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>Házastárs</InputLabel>
                        <Select
                          value={editingMember.spouseId || ''}
                          onChange={(e) => setEditingMember({...editingMember, spouseId: e.target.value})}
                          label="Házastárs"
                        >
                          <MenuItem value="">Nincs megadva</MenuItem>
                          {members
                            .filter(m => m.id !== editingMember.id)
                            .map(member => (
                              <MenuItem key={member.id} value={member.id}>
                                {member.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </div>
                    
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <strong>Figyelem:</strong> A kapcsolatok módosítása frissíti a vásznon látható kapcsolatokat.
                    </Alert>
                  </div>
                )}
              </div>
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
      <Dialog open={siblingDialog.open} onClose={() => setSiblingDialog({ 
        open: false, 
        member1: null, 
        member2: null, 
        commonParents: [],
        fatherName: '',
        motherName: '',
        siblingName: ''
      })}>
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
            </Alert>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSiblingDialog({ 
            open: false, 
            member1: null, 
            member2: null, 
            commonParents: [],
            fatherName: '',
            motherName: '',
            siblingName: ''
          })}>
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
              <h3>✨ Főbb információk</h3>
              <ul>
                <li><strong>Tiszta nézet:</strong> Csak név, leánykori név és születési/halálozási év jelenik meg</li>
                <li><strong>Kapcsolatok:</strong> Minden kapcsolatot a vonalak reprezentálnak</li>
                <li><strong>Arányos zoom:</strong> A tagok mérete arányosan változik a zoom szinttel</li>
                <li><strong>Ütközésmentesség:</strong> A tagok automatikusan elkerülik egymást</li>
                <li><strong>Függőleges adatlapok:</strong> Modern, vertikális elrendezés</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🎮 Alapvető vezérlés</h3>
              <ul>
                <li><strong>➕ Jobb alsó gomb:</strong> Új tag hozzáadása</li>
                <li><strong>ℹ️ Alsó gomb:</strong> Használati útmutató</li>
                <li><strong>Húzd a családtagokat:</strong> Mozgathatók az egérrel</li>
                <li><strong>Dupla kattintás:</strong> Tag szerkesztése</li>
                <li><strong>Egérgörgő:</strong> Arányos zoom</li>
                <li><strong>Jobb egérgomb + húzás:</strong> Panorámázás</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>👨‍👩‍👧‍👦 Kapcsolatok</h3>
              <ul>
                <li><strong>Apa/Anya:</strong> Szülők kiválasztása</li>
                <li><strong>Testvér:</strong> Testvéri kapcsolat létrehozása</li>
                <li><strong>Házastárs:</strong> Házassági kapcsolat létrehozása</li>
                <li><strong>Automatikus elhelyezés:</strong> Az új személy a megfelelő helyre kerül</li>
              </ul>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} variant="contained" color="primary">
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