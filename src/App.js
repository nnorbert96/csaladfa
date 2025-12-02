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
  const [selectedMembers, setSelectedMembers] = useState(new Set());
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
    motherId: '',
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
  }, [members.length]);
  
  // Billentyűzet események
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.add(e.key);
      if (e.key === 'Shift') {
        shiftPressed.current = true;
        // Shift lenyomásakor állítsuk be a crosshair kurzort
        if (containerRef.current && !isPanning) {
          containerRef.current.style.cursor = 'crosshair';
        }
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key);
      if (e.key === 'Shift') {
        shiftPressed.current = false;
        // Shift elengedésekor NE töröljük a kijelölést, csak állítsuk vissza a kurzort
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
  
  // Kapcsolatok rajzolása
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const ctx = canvas.getContext('2d');
    
    // Canvas méret beállítás - használjuk a konténer méretét
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
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
  }, [members, connections, scale, panOffset]);
  
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
      ctx.lineTo(width, height);
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
  
  // Házastárs lekérése egy taghoz
  const getSpouse = (memberId) => {
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
  
  // Tag méretének kiszámítása dinamikusan a tartalom és zoom alapján
  const calculateMemberSize = useCallback((member, currentScale) => {
    // Alapméret a zoom alapján - ARÁNYOS a zoommal
    const baseSize = 120 * currentScale;
    
    // Szöveg hossza alapján méret
    const nameLength = member.name.length;
    const maidenNameLength = member.maidenName ? member.maidenName.length : 0;
    
    // Szülők nevei
    const parents = getParents(member.id);
    const father = parents.father ? members.find(m => m.id === parents.father) : null;
    const mother = parents.mother ? members.find(m => m.id === parents.mother) : null;
    
    // Házastárs neve
    const spouse = getSpouse(member.id);
    
    // Szélesség számítás - arányos a zoommal
    const minWidth = 180 * currentScale;
    const widthFactor = 7 * currentScale;
    const calculatedWidth = Math.max(
      minWidth, 
      baseSize + (nameLength * widthFactor) + (maidenNameLength * widthFactor * 0.7)
    );
    
    // Magasság számítás - arányos a zoommal
    const minHeight = 140 * currentScale;
    const lineHeight = 24 * currentScale;
    const lines = 3 + (member.maidenName ? 0.5 : 0) + (member.details ? 1 : 0) + (member.isDeceased ? 0.5 : 0) + ((father || mother) ? 1 : 0) + (spouse ? 1 : 0);
    const calculatedHeight = Math.max(
      minHeight, 
      baseSize + (lines * lineHeight)
    );
    
    return {
      width: calculatedWidth,
      height: calculatedHeight
    };
  }, [members, connections]);
  
  // Tag betűmérete a zoomhoz - ARÁNYOS
  const calculateFontSize = (currentScale) => {
    const baseFontSize = 14;
    return Math.max(10, baseFontSize * currentScale);
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
      details: newMember.details,
      isDeceased: newMember.isDeceased,
      x: newX,
      y: newY
    };
    
    setMembers([...members, newMemberObj]);
    
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
      details: '',
      isDeceased: false,
      fatherId: '',
      motherId: '',
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
    
    // Frissítsük a tagot
    setMembers(members.map(member => 
      member.id === editingMember.id ? editingMember : member
    ));
    
    // Szülői kapcsolatok frissítése
    const fatherId = editingMember.fatherId ? parseInt(editingMember.fatherId) : null;
    const motherId = editingMember.motherId ? parseInt(editingMember.motherId) : null;
    
    // Töröljük a régi szülői kapcsolatokat
    let filteredConnections = connections.filter(conn => 
      !(conn.to === editingMember.id && conn.type === 'szülő')
    );
    
    // Töröljük a régi házastársi kapcsolatokat is
    filteredConnections = filteredConnections.filter(conn => 
      !(conn.type === 'házasság' && 
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
  
  // Házastársi kapcsolat ellenőrzése és létrehozása
  const checkForSpouse = (member1Id, member2Id) => {
    // Ellenőrizzük, hogy már létezik-e a kapcsolat
    const alreadyExists = connections.some(conn => 
      conn.type === 'házasság' && 
      ((conn.from === member1Id && conn.to === member2Id) || 
       (conn.from === member2Id && conn.to === member1Id))
    );
    
    if (!alreadyExists) {
      const newConnection = {
        id: connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1,
        from: member1Id,
        to: member2Id,
        type: 'házasság'
      };
      
      setConnections([...connections, newConnection]);
      
      const member1Name = members.find(m => m.id === member1Id)?.name;
      const member2Name = members.find(m => m.id === member2Id)?.name;
      
      showNotification(`Házastársi kapcsolat létrehozva: ${member1Name} ↔ ${member2Name}`, 'success');
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
    const spouse = getSpouse(member.id);
    
    setEditingMember({
      ...member,
      fatherId: parents.father ? parents.father.toString() : '',
      motherId: parents.mother ? parents.mother.toString() : '',
      spouseId: spouse ? spouse.id.toString() : ''
    });
    setEditMemberDialog(true);
    setSelectedMember(member.id);
  };
  
  // Húzás kezdete egy tagra
  const handleDragStart = (memberId, clientX, clientY) => {
    // Ha van már kijelölt tag, és ez a tag is kijelölt, akkor több tagot húzunk
    if (selectedMembers.has(memberId) && selectedMembers.size > 1) {
      isDraggingRef.current = true;
      dragMemberIdRef.current = 'multiple';
      dragStartRef.current = { x: clientX, y: clientY };
    } 
    // Ha Shift nincs lenyomva, csak egy tagot mozgathatunk
    else if (!shiftPressed.current) {
      isDraggingRef.current = true;
      dragMemberIdRef.current = memberId;
      dragStartRef.current = { x: clientX, y: clientY };
      setSelectedMember(memberId);
      // Egy tag kiválasztásakor töröljük a többi kiválasztást
      setSelectedMembers(new Set([memberId]));
    }
    // Ha Shift lenyomva, csak kijelöljük, nem kezdünk húzást
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
        
        // Ellenőrizzük, hogy a tag középpontja a kijelölésben van-e
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
    
    // Panoráma - LASSÍTVA
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      // Nagyon lassú, sima mozgás
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
      
      // Ha van kijelölt tag, értesítsük a felhasználót
      if (selectedMembers.size > 0) {
        showNotification(`${selectedMembers.size} tag kiválasztva`, 'info');
      }
    }
  }, [isSelecting, selectedMembers]);

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
      
      // Ellenőrizzük, hogy egy tagra kattintottunk-e
      const clickedOnMember = e.target.closest('.family-member');
      if (clickedOnMember) {
        // Ha tagra kattintottunk Shift-tel, akkor csak hozzáadjuk a kijelöléshez
        // A kijelölés kezelése a handleMemberClick függvényben történik
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
      
      // Töröljük a korábbi kijelöléseket CSAK ha nem Shift+klikkel választottunk már ki tagokat
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
      
      // Állítsuk be a grabbing kurzort
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  }, [isPanning, shiftPressed.current, selectedMembers]);

  // Panoráma vége
  const handlePanEnd = () => {
    setIsPanning(false);
    
    // Visszaállítjuk a kurzort
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
    const padding = 100;
    
    // Számold ki a tagok határait
    const minX = Math.min(...members.map(m => m.x));
    const maxX = Math.max(...members.map(m => m.x));
    const minY = Math.min(...members.map(m => m.y));
    const maxY = Math.max(...members.map(m => m.y));
    
    const contentWidth = maxX - minX + 300;
    const contentHeight = maxY - minY + 300;
    
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
      // Dupla kattintás: szerkesztés
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
      
      // Ha több tag van kijelölve, értesítsük a felhasználót
      if (newSelected.size > 1) {
        showNotification(`${newSelected.size} tag kiválasztva`, 'info');
      }
    } else {
      // Egyébként csak egy tagot választunk ki
      setSelectedMember(memberId);
      setSelectedMembers(new Set([memberId]));
    }
  };

  // Vászonra kattintás (kijelölés törlése)
  const handleCanvasClick = (e) => {
    // Ha nem egy tagra kattintottunk, és nem Shift módban vagyunk, töröljük a kijelölést
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
            
            // Keressük a testvéreket és szülőket
            const siblings = findSiblings(member.id);
            const hasSiblings = siblings.length > 0;
            const parents = getParents(member.id);
            const father = parents.father ? members.find(m => m.id === parents.father) : null;
            const mother = parents.mother ? members.find(m => m.id === parents.mother) : null;
            const spouse = getSpouse(member.id);
            
            return (
              <div
                key={member.id}
                className={`family-member ${isSelected ? 'selected' : ''} ${member.isDeceased ? 'deceased' : ''}`}
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
                  if (e.button === 0) {
                    // Normál klikk: húzás kezdete
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
                  <div className="member-name">{member.name}</div>
                  
                  {member.maidenName && member.gender === 'female' && (
                    <div className="member-maiden-name">
                      szül. {member.maidenName}
                    </div>
                  )}
                  
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
                  
                  {spouse && (
                    <div className="member-spouse">
                      <Favorite fontSize="inherit" />
                      <span className="spouse-text">
                        Házastárs: {spouse.name}
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
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <PersonAdd /> Új családtag hozzáadása
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Alapadatok" value="basic" />
              <Tab label="Kapcsolatok" value="connections" />
            </Tabs>
          </Box>
          
          {activeTab === 'basic' && (
            <div className="dialog-section">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    autoFocus
                    fullWidth
                    label="Név *"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl component="fieldset" fullWidth>
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
                </Grid>
                
                {newMember.gender === 'female' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Leánykori név"
                      value={newMember.maidenName}
                      onChange={(e) => setNewMember({...newMember, maidenName: e.target.value})}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Születési év *"
                    value={newMember.birthYear}
                    onChange={(e) => setNewMember({...newMember, birthYear: e.target.value})}
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
                    sx={{ mt: 1 }}
                  />
                </Grid>
                
                {newMember.isDeceased && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Halálozási év"
                      value={newMember.deathYear}
                      onChange={(e) => setNewMember({...newMember, deathYear: e.target.value})}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Részletek"
                    multiline
                    rows={2}
                    value={newMember.details}
                    onChange={(e) => setNewMember({...newMember, details: e.target.value})}
                  />
                </Grid>
              </Grid>
            </div>
          )}
          
          {activeTab === 'connections' && members.length > 0 && (
            <div className="dialog-section">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <h4>Szülők</h4>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Apa</InputLabel>
                        <Select
                          value={newMember.fatherId}
                          onChange={(e) => setNewMember({...newMember, fatherId: e.target.value})}
                          label="Apa"
                        >
                          <MenuItem value="">Nincs megadva</MenuItem>
                          {members
                            .filter(m => m.gender === 'male')
                            .map(member => (
                              <MenuItem key={member.id} value={member.id}>
                                {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Anya</InputLabel>
                        <Select
                          value={newMember.motherId}
                          onChange={(e) => setNewMember({...newMember, motherId: e.target.value})}
                          label="Anya"
                        >
                          <MenuItem value="">Nincs megadva</MenuItem>
                          {members
                            .filter(m => m.gender === 'female')
                            .map(member => (
                              <MenuItem key={member.id} value={member.id}>
                                {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <h4>Házastárs</h4>
                  <FormControl fullWidth>
                    <InputLabel>Házastárs</InputLabel>
                    <Select
                      value={newMember.spouseId}
                      onChange={(e) => setNewMember({...newMember, spouseId: e.target.value})}
                      label="Házastárs"
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
                </Grid>
                
                <Grid item xs={12}>
                  {(newMember.fatherId || newMember.motherId || newMember.spouseId) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <strong>Fontos információ:</strong><br/>
                      • Szülők és házastárs is megadható egyszerre<br/>
                      • Elhunyt személyeket is választhatsz szülőként<br/>
                      • Házastárs kiválasztásával az új személy a párja mellé kerül<br/>
                      • Szülők megadásával testvéri kapcsolatokat is létrehozhat a rendszer
                    </Alert>
                  )}
                  
                  {(!newMember.fatherId && !newMember.motherId && !newMember.spouseId) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <strong>Nincs kapcsolat megadva:</strong><br/>
                      Ez a személy egyedülállóként kerül be a családfába. Később bármikor hozzáadhatsz hozzá kapcsolatokat a szerkesztés menüpontban.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </div>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Használati tippek:</strong><br/>
            • Minden tag dupla kattintással szerkeszthető<br/>
            • Kattints a "Kapcsolatok" fülre a szülők és házastárs kiválasztásához<br/>
            • Az új személy automatikusan a megfelelő helyre kerül a kapcsolatok alapján
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
      <Dialog open={editMemberDialog} onClose={() => setEditMemberDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Edit /> Családtag szerkesztése
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
              
              {activeTab === 'basic' && (
                <div className="dialog-section">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        autoFocus
                        fullWidth
                        label="Név *"
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl component="fieldset" fullWidth>
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
                    </Grid>
                    
                    {editingMember.gender === 'female' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Leánykori név"
                          value={editingMember.maidenName}
                          onChange={(e) => setEditingMember({...editingMember, maidenName: e.target.value})}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Születési év *"
                        value={editingMember.birthYear}
                        onChange={(e) => setEditingMember({...editingMember, birthYear: e.target.value})}
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
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    
                    {editingMember.isDeceased && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Halálozási év"
                          value={editingMember.deathYear}
                          onChange={(e) => setEditingMember({...editingMember, deathYear: e.target.value})}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Részletek"
                        multiline
                        rows={2}
                        value={editingMember.details}
                        onChange={(e) => setEditingMember({...editingMember, details: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                </div>
              )}
              
              {activeTab === 'connections' && members.length > 1 && (
                <div className="dialog-section">
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <h4>Szülők</h4>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Apa</InputLabel>
                            <Select
                              value={editingMember.fatherId || ''}
                              onChange={(e) => setEditingMember({...editingMember, fatherId: e.target.value})}
                              label="Apa"
                            >
                              <MenuItem value="">Nincs megadva</MenuItem>
                              {members
                                .filter(m => m.gender === 'male' && m.id !== editingMember.id)
                                .map(member => (
                                  <MenuItem key={member.id} value={member.id}>
                                    {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Anya</InputLabel>
                            <Select
                              value={editingMember.motherId || ''}
                              onChange={(e) => setEditingMember({...editingMember, motherId: e.target.value})}
                              label="Anya"
                            >
                              <MenuItem value="">Nincs megadva</MenuItem>
                              {members
                                .filter(m => m.gender === 'female' && m.id !== editingMember.id)
                                .map(member => (
                                  <MenuItem key={member.id} value={member.id}>
                                    {member.name} {member.isDeceased ? `(${member.birthYear}†)` : `(${member.birthYear})`}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <h4>Házastárs</h4>
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
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <strong>Figyelem:</strong><br/>
                        • Szülők módosítása testvéri kapcsolatokat is befolyásolhat<br/>
                        • Házastárs megváltoztatása esetén a régi házassági kapcsolat törlődik<br/>
                        • A módosítások mentése után frissülnek a kapcsolatok a vásznon
                      </Alert>
                    </Grid>
                  </Grid>
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
              <h3>✨ Új funkciók</h3>
              <ul>
                <li><strong>Arányos zoom:</strong> A tagok mérete arányosan változik a zoom szinttel</li>
                <li><strong>Több tag kijelölése:</strong> Shift + bal klikk vagy Shift + húzás téglalappal</li>
                <li><strong>Több tag egyidejű mozgatása:</strong> Kijelölt tagok együtt mozgathatók</li>
                <li><strong>Lassított panoráma:</strong> Jobb egérgomb + húzás most sokkal lassabb</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🆕 Kijelölés rendszer</h3>
              <ul>
                <li><strong>Shift + bal klikk:</strong> Több tag kijelölése (hozzáadás/eltávolítás)</li>
                <li><strong>Shift + húzás:</strong> Téglalap kijelölés</li>
                <li><strong>Kijelölt tagok mozgatása:</strong> Húzd bármelyik kijelölt tagot</li>
                <li><strong>Kijelölés törlése:</strong> Kattints a vászon üres részére</li>
                <li><strong>Kijelölt tagok száma:</strong> Megjelenik a felső sávban és az oldalsávban</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🎮 Alapvető vezérlés</h3>
              <ul>
                <li><strong>Húzd a családtagokat</strong> az egérrel a mozgatáshoz</li>
                <li><strong>Kattints duplán</strong> egy családtagra a szerkesztéshez</li>
                <li><strong>Egérgörgő</strong> az arányos zoomhoz</li>
                <li><strong>Jobb egérgomb + húzás</strong> a LASSÚ panorámázáshoz</li>
                <li><strong>Billentyűzet nyilak</strong> a vászon mozgatásához</li>
                <li><strong>➕ Gomb:</strong> Új tag hozzáadása</li>
                <li><strong>ℹ️ Gomb:</strong> Használati útmutató</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>👨‍👩‍👧‍👦 Szülők és Házastársak</h3>
              <ul>
                <li><strong>Szülők:</strong> Mind elhunyt, mind élő személyeket kiválaszthatsz</li>
                <li><strong>Házastárs:</strong> Csak azok a személyek látszanak, akiknek nincs még házastársa</li>
                <li><strong>Mindkettő egyszerre:</strong> Most már megadhatod a szülőket és a házastársat is</li>
                <li><strong>Automatikus elhelyezés:</strong> Az új személy automatikusan a megfelelő helyre kerül</li>
                <li><strong>Testvérdetektálás:</strong> Közös szülők esetén a rendszer felajánlja a testvéri kapcsolatot</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>🔗 Kapcsolatok</h3>
              <ul>
                <li><span style={{color: '#e74c3c'}}>● Piros vonal:</span> Házasság</li>
                <li><span style={{color: '#3498db'}}>● Kék szaggatott vonal:</span> Szülői kapcsolat</li>
                <li><span style={{color: '#2ecc71'}}>● Zöld vastag szaggatott vonal:</span> Testvéri kapcsolat</li>
                <li><strong>Intelligens rendszer:</strong> Automatikus kapcsolatfelismerés és -javaslat</li>
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