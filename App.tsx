
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Clock, 
  Car, 
  User, 
  MessageCircle, 
  ArrowLeft, 
  Send, 
  Shield, 
  Menu,
  CheckCircle,
  Loader2,
  Moon,
  Sun,
  Locate,
  LogOut,
  Mail,
  Lock,
  History,
  Ghost,
  Calendar,
  CheckCircle2,
  Plus,
  Bell,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Leaf,
  Globe,
  Filter,
  DollarSign,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Download,
  Share2,
  Trash2,
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { MapRoute } from './components/MapRoute';
import { SafetyChecklist } from './components/SafetyChecklist';
import { SUGGESTED_LOCATIONS, MOCK_RIDE_HISTORY, LOCATION_COORDINATES, MOCK_USER, MOCK_NEW_DRIVER_MATCH, MOCK_NEW_RIDER_MATCH, MOCK_DRIVERS, MOCK_PASSENGERS, MOCK_NOTIFICATIONS, MOCK_PAYMENT_METHODS } from './constants';
import { findMatchesForRide } from './services/matchingService';
import { RideRequest, MatchCandidate, ChatMessage, UserRole, UserProfile, RideHistoryItem, PaymentMethod } from './types';

// Helper to parse time strings like "08:30 AM" into minutes for sorting
const parseTime = (timeStr: string): number => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  } catch (e) {
    return 0;
  }
};

export default function App() {
  // App Config State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showNewMatchToast, setShowNewMatchToast] = useState(false);

  // State Machine
  const [view, setView] = useState<'HOME' | 'MATCHING' | 'MATCH_LIST' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'COMMUNITY' | 'NOTIFICATIONS' | 'PAYMENT_METHODS'>('HOME');
  
  // User Inputs
  const [role, setRole] = useState<UserRole>('RIDER');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [time, setTime] = useState('08:30');
  const [price, setPrice] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Coordinates for Map
  const [fromCoords, setFromCoords] = useState<[number, number] | undefined>(undefined);
  const [toCoords, setToCoords] = useState<[number, number] | undefined>(undefined);
  // Real-time Driver Location State
  const [driverCoords, setDriverCoords] = useState<[number, number] | undefined>(undefined);
  
  // App Data
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [safetyCleared, setSafetyCleared] = useState(false);
  
  // Dynamic Data
  const [rideHistory, setRideHistory] = useState<RideHistoryItem[]>(MOCK_RIDE_HISTORY);
  const [isRideBooked, setIsRideBooked] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<RideHistoryItem | null>(null);

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVC, setNewCardCVC] = useState('');

  // Community Feed State
  const [communityDrivers, setCommunityDrivers] = useState<MatchCandidate[]>(MOCK_DRIVERS);
  const [communityPassengers, setCommunityPassengers] = useState<MatchCandidate[]>(MOCK_PASSENGERS);
  // Independent toggle for community view (defaults to opposite of current role)
  const [communityViewMode, setCommunityViewMode] = useState<UserRole>('DRIVER');
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  
  // Community Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'TIME_ASC' | 'TIME_DESC' | 'DETOUR_ASC'>('RECOMMENDED');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(20);

  // Refs for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync Community View with Role changes initially
  useEffect(() => {
    setCommunityViewMode(role === 'RIDER' ? 'DRIVER' : 'RIDER');
  }, [role]);

  // Update Map Coords when inputs change
  useEffect(() => {
    if (LOCATION_COORDINATES[origin]) {
      setFromCoords(LOCATION_COORDINATES[origin]);
    }
    if (LOCATION_COORDINATES[destination]) {
      setToCoords(LOCATION_COORDINATES[destination]);
    }
  }, [origin, destination]);

  // Real-time Match Simulation
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (view === 'MATCH_LIST') {
      // Simulate a new match arriving after 5 seconds
      timeoutId = setTimeout(() => {
        const newMatch = role === 'RIDER' ? MOCK_NEW_DRIVER_MATCH : MOCK_NEW_RIDER_MATCH;
        
        // Check if it already exists to prevent duplicate additions on re-renders
        setMatches(prev => {
          if (prev.find(m => m.id === newMatch.id)) return prev;
          
          setShowNewMatchToast(true);
          // Hide toast after 4s
          setTimeout(() => setShowNewMatchToast(false), 4000);
          
          return [newMatch, ...prev];
        });
      }, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [view, role]);

  // Real-time Driver Location Simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    // Only run simulation if ride is booked and we have necessary coordinates
    if (isRideBooked && selectedMatch && fromCoords) {
      // Determine Start and End points for the simulation
      // If I am a Rider, Driver moves from THEIR origin to MY pickup (fromCoords)
      // If I am a Driver, I move from MY origin (fromCoords) to PASSENGER's pickup (selectedMatch.origin)
      
      let startCoords: [number, number];
      let endCoords: [number, number];

      if (role === 'RIDER') {
        const matchOriginCoords = LOCATION_COORDINATES[selectedMatch.origin];
        // If match origin coords unknown, simulate an offset start
        startCoords = matchOriginCoords || [fromCoords[0] + 0.02, fromCoords[1] + 0.02];
        endCoords = fromCoords;
      } else {
        // I am the driver moving to the passenger
        startCoords = fromCoords;
        const matchOriginCoords = LOCATION_COORDINATES[selectedMatch.origin];
        endCoords = matchOriginCoords || [fromCoords[0] + 0.02, fromCoords[1] + 0.02];
      }

      let progress = 0;
      const duration = 30000; // 30 seconds to arrive for demo purposes
      const step = 100; // Update every 100ms

      interval = setInterval(() => {
        progress += step / duration;
        
        if (progress >= 1) {
          setDriverCoords(endCoords);
          clearInterval(interval);
          // Optional: Add "Driver Arrived" notification logic here
        } else {
          // Linear interpolation
          const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * progress;
          const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * progress;
          setDriverCoords([lat, lng]);
        }
      }, step);
    } else {
      setDriverCoords(undefined);
    }

    return () => clearInterval(interval);
  }, [isRideBooked, selectedMatch, fromCoords, role]);

  // Handle Geolocation
  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setTimeout(() => {
            const coordText = `Current Location`;
            setOrigin(coordText);
            setFromCoords([latitude, longitude]);
            setIsLocating(false);
          }, 1000); // Simulated delay for realism
        },
        (error) => {
          console.error("Geo error:", error);
          alert("Could not access location. Please check settings.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Handle Authentication
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    
    // Simulate API Auth Delay
    setTimeout(() => {
      setIsAuthLoading(false);
      const user = { ...MOCK_USER };
      if (authMode === 'SIGNUP' && authName) {
        user.name = authName;
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
    }, 1500);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setIsAuthenticated(false);
    setView('HOME');
    setMessages([]);
    setMatches([]);
    setOrigin('');
    setDestination('');
    setAuthEmail('');
    setAuthPass('');
    setShowLogoutConfirm(false);
  };

  // Payment Logic
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardNumber.length < 15 || !newCardExpiry || !newCardCVC) return;

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: newCardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD',
      last4: newCardNumber.slice(-4),
      expiry: newCardExpiry,
      isDefault: paymentMethods.length === 0 // If first card, make default
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCVC('');
    setShowAddCardModal(false);
  };

  const handleDeleteCard = (id: string) => {
    const isDeletingDefault = paymentMethods.find(p => p.id === id)?.isDefault;
    const remaining = paymentMethods.filter(p => p.id !== id);
    
    // If deleting default, make the new first item default
    if (isDeletingDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    
    setPaymentMethods(remaining);
  };

  const handleSetDefaultPayment = (id: string) => {
    const updated = paymentMethods.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    setPaymentMethods(updated);
  };

  // Handle Finding Rides or Publishing Rides
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    
    setView('MATCHING');
    
    // 1. Create a new "Post" for the community feed
    const newPost: MatchCandidate = {
      id: `${role.toLowerCase()}-${Date.now()}`,
      user: currentUser!,
      matchScore: 100, // Self match
      detourMinutes: 0,
      price: role === 'DRIVER' && price ? parseFloat(price) : undefined,
      role: role,
      origin: origin,
      destination: destination,
      departureTime: time
    };

    // 2. Add to appropriate pool
    if (role === 'DRIVER') {
      setCommunityDrivers(prev => [newPost, ...prev]);
    } else {
      setCommunityPassengers(prev => [newPost, ...prev]);
    }

    // 3. Simulate Matching API Call
    const results = await findMatchesForRide({
      id: 'req-' + Date.now(),
      role,
      origin,
      destination,
      time,
      status: 'PENDING'
    });
    
    setMatches(results);

    // If I'm a driver, I "Published" the ride, so show success first
    if (role === 'DRIVER') {
       setShowPublishSuccess(true);
    } else {
       // If Rider, go straight to list
       setView('MATCH_LIST');
    }
  };

  const handlePublishSuccessDismiss = () => {
    setShowPublishSuccess(false);
    setView('COMMUNITY'); // Redirect to community to see their post effectively
    // Auto-switch view to show my post type (Drivers) so user can see their listing
    setCommunityViewMode('DRIVER');
  };

  // Handle entering a chat
  const handleStartChat = (match: MatchCandidate) => {
    setSelectedMatch(match);
    setIsRideBooked(false); // Reset booking status for new chat
    setDriverCoords(undefined); // Reset driver location
    setMessages([
      {
        id: 'sys-1',
        senderId: 'system',
        text: `You connected with ${match.user.name}! Discuss the details below.`,
        timestamp: new Date(),
        isSystem: true
      }
    ]);
    setView('CHAT');
  };

  // Handle Confirm/Book Ride
  const handleConfirmRide = () => {
    if (!selectedMatch) return;
    
    setIsRideBooked(true);
    
    // Add system message
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'system',
      text: role === 'RIDER' ? 'Ride booked successfully!' : 'Passenger request accepted!',
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, confirmMsg]);

    // Add to History
    const newHistoryItem: RideHistoryItem = {
      id: `new-${Date.now()}`,
      date: 'Today • ' + selectedMatch.departureTime,
      origin: selectedMatch.origin,
      destination: selectedMatch.destination,
      role: role,
      price: selectedMatch.price || 0,
      driverName: role === 'RIDER' ? selectedMatch.user.name : undefined,
      riderName: role === 'DRIVER' ? selectedMatch.user.name : undefined,
      status: 'UPCOMING'
    };
    
    setRideHistory(prev => [newHistoryItem, ...prev]);
  };

  // Handle Sending Messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate "Real-time" reply from the match
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedMatch?.user.id || 'them',
        text: role === 'RIDER' 
          ? "Hey! I can pick you up at that time. Does the main stop work?" 
          : "Hi! That works perfectly. I'll be at the pickup spot.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // PDF Download Logic
  const handleDownloadPDF = (receipt: RideHistoryItem) => {
    const doc = new jsPDF();
    
    // Header background
    doc.setFillColor(22, 163, 74); // Green-600
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Ride Share Lite", 105, 25, { align: "center" });
    
    // Content reset
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    let y = 60;
    
    // Price
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text(`$${receipt.price.toFixed(2)}`, 105, y, { align: "center" });
    y += 10;
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(receipt.date, 105, y, { align: "center" });
    y += 20;

    // Divider
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 15;

    const drawRow = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(label, 20, y);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(value, 190, y, { align: "right" });
      
      y += 12;
    };

    drawRow("Status", receipt.status);
    drawRow("Role", receipt.role === 'DRIVER' ? "Driver" : "Rider");
    drawRow("From", receipt.origin);
    drawRow("To", receipt.destination);
    
    y += 5;
    doc.line(20, y, 190, y);
    y += 15;
    
    // Breakdown
    const baseFare = receipt.price * 0.8;
    const serviceFee = receipt.price * 0.15;
    const tax = receipt.price * 0.05;
    
    drawRow("Base Fare", `$${baseFare.toFixed(2)}`);
    drawRow("Service Fee", `$${serviceFee.toFixed(2)}`);
    drawRow("Tax", `$${tax.toFixed(2)}`);
    
    y += 10;
    doc.setFillColor(240, 253, 244); // Light green bg
    doc.rect(20, y - 8, 170, 16, 'F');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid", 25, y+2);
    doc.text(`$${receipt.price.toFixed(2)}`, 185, y+2, { align: "right" });
    
    doc.save(`Receipt_${receipt.id}.pdf`);
  };

  // Share Receipt Logic
  const handleShareReceipt = async (receipt: RideHistoryItem) => {
    const shareText = `Ride Share Lite Receipt\nDate: ${receipt.date}\nTotal: $${receipt.price.toFixed(2)}\nFrom: ${receipt.origin}\nTo: ${receipt.destination}`;
    const shareData = {
      title: 'Ride Receipt',
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Receipt details copied to clipboard!");
      } catch (err) {
        alert("Could not share receipt.");
      }
    }
  };

  // --- VIEWS ---

  const renderAuth = () => (
    <div className="flex flex-col h-full justify-center px-6 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Ride Share <span className="text-green-600">Lite</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {authMode === 'LOGIN' ? 'Welcome back! Login to continue.' : 'Join the community of efficient commuters.'}
        </p>
      </div>

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {authMode === 'SIGNUP' && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
             <div className="relative">
               <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
               <input 
                 type="text" 
                 value={authName}
                 onChange={e => setAuthName(e.target.value)}
                 placeholder="John Doe"
                 required
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white placeholder:text-slate-400"
               />
             </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              value={authPass}
              onChange={e => setAuthPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isAuthLoading}
          className="w-full bg-slate-900 dark:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          {isAuthLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            authMode === 'LOGIN' ? 'Log In' : 'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {authMode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
          <button 
            type="button"
            onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
            className="ml-2 font-bold text-green-600 hover:text-green-500"
          >
            {authMode === 'LOGIN' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>

      <div className="absolute top-6 right-6">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ride Share <span className="text-green-600">Lite</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Hello, {currentUser?.name?.split(' ')[0]}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
             {isDarkMode ? <Sun className="w-5 h-5 text-slate-300" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
          <button 
            onClick={handleLogoutClick}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </header>

      {/* Role Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button 
          onClick={() => setRole('RIDER')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            role === 'RIDER' 
              ? 'bg-white dark:bg-slate-700 shadow text-green-700 dark:text-green-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" /> Find a Ride
        </button>
        <button 
          onClick={() => setRole('DRIVER')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            role === 'DRIVER' 
              ? 'bg-white dark:bg-slate-700 shadow text-blue-700 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4" /> Publish Ride
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleAction} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-colors">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">From</label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Current Location"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                list="locations"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white font-medium placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={isLocating}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-3 rounded-xl transition-colors flex items-center justify-center min-w-[3rem]"
              title="Use current location"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">To</label>
            {origin && destination && (
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-2 rounded">Route found</span>
            )}
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              list="locations"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Depart At</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white font-medium placeholder:text-slate-400 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Price Input - Only for Drivers */}
        {role === 'DRIVER' && (
          <div className="animate-in slide-in-from-top-2 fade-in">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Price per Seat ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.50"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white font-medium placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Map Preview */}
        <div className="pt-2 relative z-0">
           <MapRoute 
              active={!!(origin && destination)} 
              fromCoords={fromCoords}
              toCoords={toCoords}
           />
        </div>

        <button 
          type="submit"
          className={`relative z-10 w-full text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${role === 'RIDER' ? 'bg-slate-900 dark:bg-green-600' : 'bg-blue-600'}`}
        >
          {role === 'RIDER' ? <Search className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {role === 'RIDER' ? 'Find Matches' : 'Publish Ride'}
        </button>
      </form>

      <datalist id="locations">
        {SUGGESTED_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
      </datalist>
    </div>
  );

  const renderCommunity = () => {
    // Community View Mode: 
    // DRIVER view mode = Showing available Drivers (Riders look here)
    // RIDER view mode = Showing available Passengers (Drivers look here)
    
    const allItems = communityViewMode === 'DRIVER' 
      ? [...communityDrivers] 
      : [...communityPassengers];

    // Filter Logic
    let displayedItems = allItems.filter(item => {
      const matchesSearch = !communitySearchQuery || 
        item.origin.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
        item.destination.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
        item.user.name.toLowerCase().includes(communitySearchQuery.toLowerCase());
      
      const matchesPrice = communityViewMode === 'DRIVER' && item.price !== undefined 
        ? item.price <= maxPriceFilter 
        : true;

      return matchesSearch && matchesPrice;
    });

    // Sorting Logic
    displayedItems.sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_ASC':
          return (a.price || 0) - (b.price || 0);
        case 'PRICE_DESC':
          return (b.price || 0) - (a.price || 0);
        case 'TIME_ASC':
          return parseTime(a.departureTime) - parseTime(b.departureTime);
        case 'TIME_DESC':
          return parseTime(b.departureTime) - parseTime(a.departureTime);
        case 'DETOUR_ASC':
           return a.detourMinutes - b.detourMinutes;
        default: // RECOMMENDED
          return b.matchScore - a.matchScore;
      }
    });

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
        {/* Filter Modal Overlay */}
        {showFilterModal && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 border-t border-slate-200 dark:border-slate-700">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <SlidersHorizontal className="w-5 h-5" /> Filters
                 </h3>
                 <button onClick={() => setShowFilterModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                   <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                 </button>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="text-sm font-bold text-slate-500 uppercase mb-3 block">Sort By</label>
                   <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => setSortBy('RECOMMENDED')}
                       className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${sortBy === 'RECOMMENDED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                     >
                       Recommended
                     </button>
                     <button 
                       onClick={() => setSortBy('DETOUR_ASC')}
                       className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${sortBy === 'DETOUR_ASC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                     >
                       Shortest Detour
                     </button>
                     <button 
                       onClick={() => setSortBy('TIME_ASC')}
                       className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${sortBy === 'TIME_ASC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                     >
                       Earliest Time
                     </button>
                     <button 
                       onClick={() => setSortBy('PRICE_ASC')}
                       className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${sortBy === 'PRICE_ASC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                     >
                       Price: Low to High
                     </button>
                   </div>
                 </div>

                 {/* Price Slider only for Drivers view */}
                 {communityViewMode === 'DRIVER' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-500 uppercase">Max Price</label>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">${maxPriceFilter.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="1"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>$0</span>
                        <span>$50+</span>
                      </div>
                    </div>
                 )}

                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setSortBy('RECOMMENDED');
                        setMaxPriceFilter(50);
                      }}
                      className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setShowFilterModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-green-600 text-white font-bold hover:opacity-90 transition-colors"
                    >
                      Apply Filters
                    </button>
                 </div>
               </div>
             </div>
           </div>
        )}

        <header className="mb-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Community <span className="text-blue-600">Feed</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Browsing {communityViewMode === 'DRIVER' ? 'available rides' : 'passenger requests'}
              </p>
            </div>
            <button 
              onClick={() => setShowFilterModal(true)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
            >
               <Filter className="w-5 h-5" />
               {(sortBy !== 'RECOMMENDED' || maxPriceFilter < 50) && (
                 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white dark:border-slate-800"></span>
               )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
             <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
             <input 
               type="text"
               value={communitySearchQuery}
               onChange={(e) => setCommunitySearchQuery(e.target.value)}
               placeholder="Search destination, name..."
               className="w-full pl-9 pr-8 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white placeholder:text-slate-400"
             />
             {communitySearchQuery && (
               <button 
                 onClick={() => setCommunitySearchQuery('')}
                 className="absolute right-2 top-2.5 p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700"
               >
                 <X className="w-3 h-3" />
               </button>
             )}
          </div>
        </header>

        {/* View Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
           <button 
             onClick={() => setCommunityViewMode('DRIVER')}
             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${communityViewMode === 'DRIVER' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
           >
             View Drivers
           </button>
           <button 
             onClick={() => setCommunityViewMode('RIDER')}
             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${communityViewMode === 'RIDER' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
           >
             View Passengers
           </button>
        </div>

        <div className="space-y-4">
          {displayedItems.length === 0 ? (
             <div className="text-center py-10 opacity-50">
               <Ghost className="w-12 h-12 mx-auto mb-2" />
               <p>{communitySearchQuery || maxPriceFilter < 50 ? 'No results found matching your filters.' : 'No posts yet.'}</p>
             </div>
          ) : displayedItems.map((item) => (
             <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={item.user.avatarUrl} alt={item.user.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.user.name}
                        {item.user.id === currentUser?.id && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                           {item.role === 'DRIVER' ? 'Driving' : 'Riding'}
                        </span>
                        <span className="text-[10px] text-slate-400">• Just now</span>
                      </div>
                    </div>
                  </div>
                  {item.price !== undefined && (
                    <div className="text-right">
                       <span className="font-bold text-slate-900 dark:text-white">${item.price.toFixed(2)}</span>
                       <p className="text-[10px] text-slate-400">per seat</p>
                    </div>
                  )}
                </div>

                <div className="relative pl-4 space-y-4 mb-4">
                   <div className="absolute left-[5px] top-2 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                   <div className="relative">
                      <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 bg-slate-400 rounded-full border-2 border-white dark:border-slate-800"></div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.origin}</p>
                   </div>
                   <div className="relative">
                      <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.destination}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{item.departureTime}</span>
                      </div>
                      {item.detourMinutes > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-orange-500 dark:text-orange-400" title="Detour time">
                           <MapPin className="w-3 h-3" />
                           <span>+{item.detourMinutes}m</span>
                        </div>
                      )}
                   </div>
                   {item.user.id !== currentUser?.id ? (
                     <button 
                       onClick={() => handleStartChat(item)}
                       className="px-4 py-2 bg-slate-900 dark:bg-green-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                     >
                       Connect
                     </button>
                   ) : (
                     <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg cursor-default">
                       Your Post
                     </span>
                   )}
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReceiptModal = () => {
    if (!selectedReceipt) return null;

    // Calculate mock breakdown
    const baseFare = selectedReceipt.price * 0.8;
    const serviceFee = selectedReceipt.price * 0.15;
    const tax = selectedReceipt.price * 0.05;

    // Find default payment method
    const defaultPayment = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receipt</h3>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">${selectedReceipt.price.toFixed(2)}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedReceipt.date}</p>
            </div>

            {/* Ride Details */}
            <div className="space-y-4 mb-8">
               <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 ml-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Pickup</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedReceipt.origin}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Dropoff</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedReceipt.destination}</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Base Fare</span>
                <span className="text-slate-900 dark:text-white font-medium">${baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Service Fee</span>
                <span className="text-slate-900 dark:text-white font-medium">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tax</span>
                <span className="text-slate-900 dark:text-white font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-100 dark:border-slate-700 mt-2">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-green-600 dark:text-green-400">${selectedReceipt.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-6 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
               <CreditCard className="w-5 h-5 text-slate-500" />
               <div className="flex-1">
                 <p className="text-xs font-bold text-slate-500 uppercase">Payment Method</p>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">
                   {defaultPayment ? `${defaultPayment.type} ending in ${defaultPayment.last4}` : 'Cash'}
                 </p>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
             <button 
               onClick={() => handleShareReceipt(selectedReceipt)}
               className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
             >
               <Share2 className="w-4 h-4" /> Share
             </button>
             <button 
               onClick={() => handleDownloadPDF(selectedReceipt)}
               className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-green-600 text-white font-bold text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
             >
               <Download className="w-4 h-4" /> PDF
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Your Rides
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Past trips and transactions</p>
      </header>

      <div className="space-y-4">
        {rideHistory.map((ride) => (
          <div key={ride.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                 <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">
                   {ride.role === 'RIDER' ? <Car className="w-5 h-5 text-slate-600 dark:text-slate-300"/> : <User className="w-5 h-5 text-slate-600 dark:text-slate-300"/>}
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{ride.date}</p>
                   <p className="font-bold text-slate-900 dark:text-white">{ride.role === 'RIDER' ? 'Ride with ' + ride.driverName : 'Drove ' + ride.riderName}</p>
                 </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  ride.status === 'COMPLETED' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : ride.status === 'UPCOMING'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {ride.status}
                </span>
              </div>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 my-4 ml-2">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-none">{ride.origin}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-none">{ride.destination}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-900 dark:text-white">${ride.price.toFixed(2)}</span>
              <button 
                onClick={() => setSelectedReceipt(ride)}
                className="text-sm text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                View Receipt
              </button>
            </div>
          </div>
        ))}
      </div>
      {renderReceiptModal()}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
      <header className="flex items-center gap-4 mb-6 sticky top-0 bg-[#f3f4f6]/95 dark:bg-slate-900/95 backdrop-blur z-10 py-4 transition-colors">
        <button onClick={() => setView('PROFILE')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Stay updated with your rides</p>
        </div>
      </header>

      <div className="space-y-4">
        {MOCK_NOTIFICATIONS.map((notification) => (
          <div key={notification.id} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border ${notification.read ? 'border-slate-100 dark:border-slate-700' : 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'}`}>
             <div className="flex gap-4">
               <div className={`p-2 rounded-full h-fit ${
                 notification.type === 'SUCCESS' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                 notification.type === 'WARNING' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                 notification.type === 'PROMO' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
               }`}>
                 {notification.type === 'SUCCESS' ? <CheckCircle className="w-5 h-5" /> :
                  notification.type === 'WARNING' ? <Shield className="w-5 h-5" /> :
                  notification.type === 'PROMO' ? <DollarSign className="w-5 h-5" /> :
                  <Bell className="w-5 h-5" />}
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-1">
                   <h3 className={`font-bold text-sm ${notification.read ? 'text-slate-900 dark:text-white' : 'text-blue-700 dark:text-blue-300'}`}>
                     {notification.title}
                   </h3>
                   <span className="text-[10px] text-slate-400">{notification.time}</span>
                 </div>
                 <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                   {notification.message}
                 </p>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
      <header className="flex items-center gap-4 mb-6 sticky top-0 bg-[#f3f4f6]/95 dark:bg-slate-900/95 backdrop-blur z-10 py-4 transition-colors">
        <button onClick={() => setView('PROFILE')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Payment Methods
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your cards and billing</p>
        </div>
      </header>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                 <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-300" />
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h3 className="font-bold text-slate-900 dark:text-white text-sm">{method.type} **** {method.last4}</h3>
                   {method.isDefault && (
                     <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">Default</span>
                   )}
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Expires {method.expiry}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!method.isDefault && (
                <button 
                  onClick={() => handleSetDefaultPayment(method.id)}
                  className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  title="Set as Default"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => handleDeleteCard(method.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete Card"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={() => setShowAddCardModal(true)}
          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Payment Method
        </button>
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 border-t border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Card</h3>
               <button onClick={() => setShowAddCardModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                 <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
               </button>
             </div>

             <form onSubmit={handleAddCard} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                 <div className="relative">
                   <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                   <input 
                     type="text" 
                     value={newCardNumber}
                     onChange={e => setNewCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                     placeholder="0000 0000 0000 0000"
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-none rounded-xl text-slate-900 dark:text-white font-medium"
                     required
                   />
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                   <input 
                     type="text" 
                     value={newCardExpiry}
                     onChange={e => setNewCardExpiry(e.target.value)}
                     placeholder="MM/YY"
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-none rounded-xl text-slate-900 dark:text-white font-medium"
                     required
                   />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                   <input 
                     type="text" 
                     value={newCardCVC}
                     onChange={e => setNewCardCVC(e.target.value.replace(/\D/g, '').slice(0, 3))}
                     placeholder="123"
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-none rounded-xl text-slate-900 dark:text-white font-medium"
                     required
                   />
                 </div>
               </div>
               
               <button 
                 type="submit" 
                 className="w-full py-4 bg-slate-900 dark:bg-green-600 text-white font-bold rounded-xl mt-4"
               >
                 Save Card
               </button>
             </form>
           </div>
         </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account settings</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
        <div className="relative">
          <img 
            src={currentUser?.avatarUrl} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-700 mb-4"
          />
          <button className="absolute bottom-4 right-0 p-1.5 bg-green-500 text-white rounded-full border-2 border-white dark:border-slate-800">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser?.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center text-yellow-500 text-sm font-bold">
            <span>★</span>
            <span>{currentUser?.rating.toFixed(1)}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          {currentUser?.verified && (
            <span className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full mt-8">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="font-bold text-slate-900 dark:text-white text-lg">{rideHistory.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Rides</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="font-bold text-green-600 dark:text-green-400 text-lg flex items-center justify-center gap-1">
              <Leaf className="w-4 h-4" /> 12
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">kg CO2 Saved</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="font-bold text-slate-900 dark:text-white text-lg">4.9</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Rating</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Account Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
        <button 
          onClick={() => setView('PAYMENT_METHODS')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Payment Methods</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
        <button 
          onClick={() => setView('NOTIFICATIONS')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </button>
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200">Help & Support</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <button 
        onClick={handleLogoutClick}
        className="w-full py-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>
    </div>
  );

  const renderMatching = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
        <Loader2 className="w-16 h-16 text-green-600 dark:text-green-400 animate-spin relative z-10" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {role === 'DRIVER' ? 'Publishing Route...' : 'Scanning Routes...'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
          {role === 'DRIVER' 
            ? 'Making your ride visible to commuters and checking for match candidates.'
            : 'Checking overlap scores, time windows, and detours for nearby drivers.'}
        </p>
      </div>
    </div>
  );

  const renderMatchList = () => {
    // Empty state for matches
    if (matches.length === 0) {
      return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
          <header className="flex items-center gap-4 mb-6 sticky top-0 bg-[#f3f4f6]/95 dark:bg-slate-900/95 backdrop-blur z-10 py-4 transition-colors">
            <button onClick={() => setView('HOME')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Results</h2>
          </header>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pb-20">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
              <Ghost className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No matches found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
              {role === 'DRIVER' 
                ? "No riders are currently looking for this specific route. We'll notify you if someone requests it."
                : "We couldn't find any drivers matching your route/time perfectly."}
            </p>
            <button 
              onClick={() => setView('HOME')}
              className="px-6 py-3 bg-slate-900 dark:bg-green-600 text-white font-bold rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
            >
              Adjust Search
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-20 relative">
        <header className="flex items-center gap-4 mb-6 sticky top-0 bg-[#f3f4f6]/95 dark:bg-slate-900/95 backdrop-blur z-10 py-4 transition-colors">
          <button onClick={() => setView('HOME')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
               {role === 'DRIVER' ? 'Potential Passengers' : 'Available Rides'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{matches.length} matches found for your route</p>
          </div>
        </header>
        
        {/* Toast Notification for new matches */}
        {showNewMatchToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-slate-900 dark:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
              <Bell className="w-4 h-4 fill-white animate-pulse" />
              New match found!
            </div>
          </div>
        )}

        {matches.map((match) => (
          <div 
            key={match.id}
            onClick={() => handleStartChat(match)}
            className="group bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-green-200 dark:hover:border-green-800 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <img src={match.user.avatarUrl} alt={match.user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{match.user.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-yellow-500 font-bold">★ {match.user.rating}</span>
                    <span>•</span>
                    <span>{match.user.verified ? 'Verified' : 'New'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${
                  match.matchScore > 90 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : match.matchScore > 80
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {match.matchScore}% Match
                </span>
                {/* Only show price if looking for a driver, or if driver sees contribution */}
                {match.price && <div className="text-slate-900 dark:text-white font-bold">${match.price.toFixed(2)}</div>}
              </div>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{role === 'DRIVER' ? 'Needs pick up at ' : 'Leaves at '} {match.departureTime}</span>
              </div>
               {match.detourMinutes > 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                   <MapPin className="w-4 h-4 text-slate-400" />
                   <span>{match.origin} to {match.destination}</span>
                   <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded ml-auto">+{match.detourMinutes} min</span>
                </div>
               ) : (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                   <MapPin className="w-4 h-4" />
                   <span>Direct route</span>
                </div>
               )}
            </div>

            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
               <div className="h-full bg-green-500 rounded-full" style={{ width: `${match.matchScore}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">Route Overlap Score</p>
          </div>
        ))}
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-2">
       <header className="flex items-center gap-4 mb-2 py-2 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setView('MATCH_LIST')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <img src={selectedMatch?.user.avatarUrl} alt="User" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{selectedMatch?.user.name}</h2>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
          <Shield className="w-5 h-5" />
        </button>
      </header>
      
      {/* Route Preview in Chat Header */}
      <div className="mb-4 relative z-0">
        <MapRoute 
          active={true} 
          matchScore={selectedMatch?.matchScore} 
          fromCoords={fromCoords}
          toCoords={toCoords}
          driverCoords={driverCoords}
        />
      </div>

      {/* Booking Action */}
      <div className="px-1 mb-4 relative z-10">
         {!isRideBooked ? (
            <button 
              onClick={handleConfirmRide}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-green-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              {role === 'RIDER' ? 'Book Ride' : 'Accept Passenger'}
            </button>
         ) : (
            <div className="w-full py-3 rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-bold flex items-center justify-center gap-2 animate-in zoom-in duration-300">
               <CheckCircle2 className="w-5 h-5" />
               Ride Confirmed
            </div>
         )}
      </div>

      {/* Stretch Goal: Safety Checklist */}
      {!safetyCleared && !isRideBooked && (
        <SafetyChecklist onComplete={() => setSafetyCleared(true)} />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
             <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              {msg.isSystem ? (
                <div className="w-full text-center my-2">
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              ) : (
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.senderId === 'me' 
                    ? 'bg-slate-900 dark:bg-green-700 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                  <div className={`text-[10px] mt-1 ${msg.senderId === 'me' ? 'text-slate-300 dark:text-green-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pb-4">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-slate-800 dark:text-white"
        />
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-50 hover:bg-green-700 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors">
        <div className="max-w-md mx-auto h-[100dvh] bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl shadow-2xl relative overflow-hidden transition-colors flex flex-col">
          <main className="flex-1 overflow-y-auto p-6 scroll-smooth hide-scrollbar pb-24">
            {!isAuthenticated && renderAuth()}
            {isAuthenticated && (
              <>
                {view === 'HOME' && renderHome()}
                {view === 'MATCHING' && renderMatching()}
                {view === 'MATCH_LIST' && renderMatchList()}
                {view === 'COMMUNITY' && renderCommunity()}
                {view === 'CHAT' && renderChat()}
                {view === 'HISTORY' && renderHistory()}
                {view === 'PROFILE' && renderProfile()}
                {view === 'NOTIFICATIONS' && renderNotifications()}
                {view === 'PAYMENT_METHODS' && renderPaymentMethods()}
                
                {/* Logout Modal */}
                {showLogoutConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-xs text-center border border-slate-100 dark:border-slate-700 scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Log Out</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to log out?</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={confirmLogout}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                          >
                            Log Out
                          </button>
                        </div>
                      </div>
                    </div>
                )}

                {/* Publish Success Modal */}
                {showPublishSuccess && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-slate-100 dark:border-slate-700 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500"></div>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ride Published!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                           Your route is now visible. We found {matches.length} potential passengers nearby who match your schedule.
                        </p>
                        <button 
                          onClick={handlePublishSuccessDismiss}
                          className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-green-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                        >
                          View Feed
                        </button>
                     </div>
                  </div>
                )}
              </>
            )}
          </main>
          
          {/* Navigation Bar */}
          {isAuthenticated && (view === 'HOME' || view === 'HISTORY' || view === 'PROFILE' || view === 'COMMUNITY' || view === 'NOTIFICATIONS' || view === 'PAYMENT_METHODS') && (
            <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-medium text-slate-400 transition-colors z-20">
              <button 
                onClick={() => setView('HOME')}
                className={`flex flex-col items-center gap-1 transition-colors ${view === 'HOME' ? 'text-green-600 dark:text-green-500' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Search className="w-6 h-6" />
                Search
              </button>
              <button 
                 onClick={() => setView('COMMUNITY')}
                 className={`flex flex-col items-center gap-1 transition-colors ${view === 'COMMUNITY' ? 'text-green-600 dark:text-green-500' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Globe className="w-6 h-6" />
                Community
              </button>
              <button 
                onClick={() => setView('HISTORY')}
                className={`flex flex-col items-center gap-1 transition-colors ${view === 'HISTORY' ? 'text-green-600 dark:text-green-500' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <History className="w-6 h-6" />
                History
              </button>
              <button 
                 onClick={() => setView('PROFILE')}
                 className={`flex flex-col items-center gap-1 transition-colors ${view === 'PROFILE' || view === 'NOTIFICATIONS' || view === 'PAYMENT_METHODS' ? 'text-green-600 dark:text-green-500' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <User className="w-6 h-6" />
                Profile
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}