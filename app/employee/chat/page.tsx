'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
  X,
  MoreVertical,
  Trash2,
  Edit,
  EyeOff,
  CheckCircle,
  Reply,
  Copy,
  ReplyAll,
  ChevronRight,
  Menu,
  Briefcase,
  Users,
  Search,
  User,
  LogOut,
  Mail,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
  limit
} from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSession, type SessionData, logout } from '@/lib/auth';
import { EmployeeSidebar } from '../_components/sidebar';

// Employee Interface
interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

// Message Interface
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'employee' | 'admin';
  recipientRole: 'admin' | 'employee';
  recipientId?: string;
  recipientName?: string;
  timestamp: any;
  read: boolean;
  readBy?: string[];
  status: 'sent' | 'delivered' | 'seen';
  collection: 'employeeMessages' | 'employeeReplies';
  imageBase64?: string;
  imageName?: string;
  deletedFor?: string[];
  deletedForEveryone?: boolean;
  edited?: boolean;
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
}

export default function EmployeeChatPage() {
  const router = useRouter();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [chatsSidebarOpen, setChatsSidebarOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Get session on mount
  useEffect(() => {
    const storedSession = getSession();
    if (!storedSession) {
      router.push('/login/employee');
      return;
    }
    setSession(storedSession);
  }, [router]);

  // ============================================
  // FETCH ALL EMPLOYEES AND AUTO-SELECT LOGGED-IN EMPLOYEE
  // ============================================
  useEffect(() => {
    if (session) {
      fetchEmployeesAndAutoSelect();
    }
  }, [session]);

  const fetchEmployeesAndAutoSelect = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching employees...');
      
      const employeesRef = collection(db, 'employees');
      const snapshot = await getDocs(employeesRef);
      
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'No Name',
        email: doc.data().email || '',
        department: doc.data().department || '',
        position: doc.data().position || ''
      }));
      
      // Sort by name
      employeesData.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Found ${employeesData.length} employees`);
      setEmployees(employeesData);
      
      // ✅ AUTO-SELECT: Find employee by ID from session or email
      if (session?.employeeId) {
        // Try to find by employeeId
        const matchedEmployee = employeesData.find(emp => emp.email === session.employeeId );
        if (matchedEmployee) {
          console.log('✅ Auto-selected employee by ID:', matchedEmployee.name);
          setSelectedEmployeeId(matchedEmployee.id);
          setSelectedEmployee(matchedEmployee);
        } else {
          // Fallback to email search
          const emailMatch = employeesData.find(emp => emp.email === session.user.email);
          if (emailMatch) {
            console.log('✅ Auto-selected employee by email:', emailMatch.name);
            setSelectedEmployeeId(emailMatch.id);
            setSelectedEmployee(emailMatch);
          }
        }
      } else if (session?.user.email) {
        // Try by email if no employeeId
        const emailMatch = employeesData.find(emp => emp.email === session.user.email);
        if (emailMatch) {
          console.log('✅ Auto-selected employee by email:', emailMatch.name);
          setSelectedEmployeeId(emailMatch.id);
          setSelectedEmployee(emailMatch);
        }
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  // ============================================
  // FETCH MESSAGES FOR SELECTED EMPLOYEE
  // ============================================
  useEffect(() => {
    if (!selectedEmployeeId) {
      setMessages([]);
      return;
    }

    console.log('🔍 Setting up messages for employee:', selectedEmployeeId);

    // Messages sent by this employee
    const employeeMessagesQuery = query(
      collection(db, 'employeeMessages'),
      where('senderId', '==', selectedEmployeeId)
    );

    // Replies from admin to this employee
    const adminRepliesQuery = query(
      collection(db, 'employeeReplies'),
      where('recipientId', '==', selectedEmployeeId)
    );

    const unsubscribeEmployeeMessages = onSnapshot(employeeMessagesQuery, (snapshot) => {
      const employeeMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'employeeMessages'
        };
      }) as Message[];
      
      setMessages(prev => {
        const replies = prev.filter(m => m.collection === 'employeeReplies');
        const allMsgs = [...employeeMsgs, ...replies];
        return allMsgs.sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    const unsubscribeAdminReplies = onSnapshot(adminRepliesQuery, (snapshot) => {
      const replyMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'employeeReplies'
        };
      }) as Message[];
      
      setMessages(prev => {
        const employeeMsgs = prev.filter(m => m.collection === 'employeeMessages');
        const allMsgs = [...employeeMsgs, ...replyMsgs];
        return allMsgs.sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return () => {
      unsubscribeEmployeeMessages();
      unsubscribeAdminReplies();
    };
  }, [selectedEmployeeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTo({
        top: messagesScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // ============================================
  // MESSAGE ACTIONS
  // ============================================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearReply = () => {
    setReplyingTo(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Send message to admin
  const handleSendMessage = async () => {
    if (!selectedEmployeeId) {
      alert('Please select your employee profile first');
      return;
    }

    if (!selectedEmployee) {
      alert('Employee not found');
      return;
    }

    if (!newMessage.trim() && !selectedImage) {
      alert('Please enter a message or select an image');
      return;
    }

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      let imageBase64 = null;
      let imageName = null;

      if (selectedImage) {
        imageBase64 = await convertImageToBase64(selectedImage);
        imageName = selectedImage.name;
        clearSelectedImage();
      }

      const messageData: any = {
        content: messageContent,
        senderId: selectedEmployeeId,
        senderName: selectedEmployee.name,
        senderEmail: selectedEmployee.email,
        senderRole: 'employee',
        recipientRole: 'admin',
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent',
        readBy: [],
        deliveredTo: [],
        deletedFor: [],
        deletedForEveryone: false,
        edited: false,
        createdAt: new Date().toISOString()
      };

      if (imageBase64) {
        messageData.imageBase64 = imageBase64;
        messageData.imageName = imageName;
      }

      if (replyingTo) {
        messageData.replyToId = replyingTo.id;
        messageData.replyToContent = replyingTo.content || '';
        messageData.replyToSender = replyingTo.senderName || 'Someone';
      }

      await addDoc(collection(db, 'employeeMessages'), messageData);
      clearReply();
      
    } catch (error) {
      console.error('❌ Send error:', error);
      alert('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Copy message
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied!');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // Delete for me
  const handleDeleteForMe = async (message: Message) => {
    if (!selectedEmployeeId) return;
    
    try {
      const messageRef = doc(db, message.collection, message.id);
      const deletedFor = message.deletedFor || [];
      
      if (!deletedFor.includes(selectedEmployeeId)) {
        await updateDoc(messageRef, { 
          deletedFor: [...deletedFor, selectedEmployeeId] 
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Delete for everyone
  const handleDeleteForEveryone = async (message: Message) => {
    if (!confirm('Delete for everyone? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, message.collection, message.id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const messageRef = doc(db, editingMessage.collection, editingMessage.id);
      await updateDoc(messageRef, {
        content: editContent,
        edited: true,
        editedAt: serverTimestamp()
      });
      
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content || '');
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  // Format time
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) return format(date, 'hh:mm a');
      if (isYesterday(date)) return `Yesterday ${format(date, 'hh:mm a')}`;
      return format(date, 'dd/MM/yy hh:mm a');
    } catch {
      return '';
    }
  };

  const formatChatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) return format(date, 'hh:mm a');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd/MM/yy');
    } catch {
      return '';
    }
  };

  // Filter out deleted messages
  const visibleMessages = messages.filter(msg => {
    const deletedFor = msg.deletedFor || [];
    return !deletedFor.includes(selectedEmployeeId) && !msg.deletedForEveryone;
  });

  // Group messages by date
  const groupedMessages = visibleMessages.reduce((groups: any, msg) => {
    try {
      const date = msg.timestamp?.toDate 
        ? format(msg.timestamp.toDate(), 'yyyy-MM-dd')
        : format(new Date(msg.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    } catch {
      const date = format(new Date(), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    }
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Filter employees for dropdown
  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = employees.filter(emp => 
    emp.name?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  // Handle chat select
  const handleChatSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    if (window.innerWidth < 768) {
      setChatsSidebarOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/login/employee');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!session?.user?.name) return 'E';
    return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* ✅ Employee Sidebar - Same as Salary Page */}
      <EmployeeSidebar session={session} open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header with User Info - Same style as Salary Page */}
        <div className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur border-b border-slate-700">
          <div className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Employee Chat</h1>
                <p className="text-sm text-slate-400">
                  {selectedEmployee ? `Chatting as: ${selectedEmployee.name}` : 'Select your profile'}
                </p>
              </div>
            </div>
            
            {/* User Info Dropdown */}
            <div className="relative">
              <button
                onClick={() => {}}
                className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{session?.user.name}</p>
                  <p className="text-xs text-slate-400">{session?.user.email}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Select Profile Section - Salary Page Style */}
              <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">
                      SELECT YOUR PROFILE
                    </label>
                    <Select 
                      value={selectedEmployeeId} 
                      onValueChange={setSelectedEmployeeId}
                    >
                      <SelectTrigger className="w-full md:w-[400px] h-14 bg-slate-900/50 border-slate-700 hover:border-violet-500/50 focus:ring-2 focus:ring-violet-500/30 rounded-2xl">
                        <SelectValue placeholder={
                          <div className="flex items-center gap-3 text-slate-400">
                            <User className="w-5 h-5 text-violet-400" />
                            <span>Choose your name to start</span>
                          </div>
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <div className="px-3 py-2 border-b border-slate-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder="Search your name..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 h-11 bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                            />
                          </div>
                        </div>
                        <ScrollArea className="h-[280px]">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <SelectItem 
                                key={emp.id} 
                                value={emp.id}
                                className="cursor-pointer hover:bg-violet-500/10"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-8 h-8 mt-1">
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-400">
                                      {emp.name?.charAt(0) || 'E'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-semibold text-white">{emp.name}</div>
                                    <div className="text-xs text-slate-400">
                                      {emp.department || emp.position || emp.email}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-8 text-center text-slate-400">
                              No employees found
                            </div>
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedEmployee && (
                    <div className="flex items-center gap-4 px-4 py-2 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-slate-300">
                          Chatting as: <span className="text-violet-400 font-semibold">{selectedEmployee.name}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployeeId && selectedEmployee ? (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
                  
                  {/* Employee Header */}
                  <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 rounded-xl border-2 border-violet-500/30">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                          {selectedEmployee.name?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {selectedEmployee.name}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {selectedEmployee.department || selectedEmployee.position || selectedEmployee.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 bg-slate-900/50 relative min-h-0">
                    <ScrollArea 
                      ref={messagesScrollRef}
                      className="absolute inset-0 w-full h-full"
                    >
                      <div className="px-6 py-6">
                        {visibleMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[300px]">
                            <div className="w-24 h-24 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mb-4">
                              <MessageCircle className="w-12 h-12 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
                            <p className="text-slate-400 text-center">
                              Start a conversation with admin
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
                              <div key={date}>
                                <div className="flex justify-center mb-4">
                                  <span className="bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-full">
                                    {formatDateHeader(date)}
                                  </span>
                                </div>
                                
                                <div className="space-y-3">
                                  {(dateMessages as Message[]).map((msg) => {
                                    const isMe = msg.senderRole === 'employee';
                                    
                                    return (
                                      <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        
                                        {!isMe && (
                                          <Avatar className="w-8 h-8 ring-2 ring-slate-700">
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                                              A
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        
                                        <div className={cn("max-w-xs lg:max-w-md", isMe ? "order-2" : "order-1")}>
                                          <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group/message",
                                            isMe 
                                              ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-none" 
                                              : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                                          )}>
                                            {!isMe && (
                                              <p className="text-xs font-semibold text-violet-400 mb-1">
                                                Admin
                                              </p>
                                            )}
                                            {isMe && (
                                              <p className="text-xs font-semibold text-violet-300 mb-1">
                                                You
                                              </p>
                                            )}
                                            
                                            {msg.replyToId && (
                                              <div className="mb-2 pl-2 border-l-3 border-violet-400 bg-slate-700/50 p-2 rounded-lg text-xs">
                                                <p className="text-violet-400 font-semibold">
                                                  Replying to {msg.replyToSender}
                                                </p>
                                                <p className="text-slate-300 line-clamp-2">
                                                  {msg.replyToContent || '📷 Image'}
                                                </p>
                                              </div>
                                            )}
                                            
                                            {editingMessage?.id === msg.id ? (
                                              <div className="flex items-center gap-2">
                                                <Input
                                                  ref={editInputRef}
                                                  value={editContent}
                                                  onChange={(e) => setEditContent(e.target.value)}
                                                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                                                  onKeyPress={(e) => e.key === 'Enter' && handleEditMessage()}
                                                />
                                                <Button size="sm" onClick={handleEditMessage} className="bg-violet-600 hover:bg-violet-700">Save</Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-slate-400 hover:text-white">Cancel</Button>
                                              </div>
                                            ) : (
                                              <>
                                                {msg.content && (
                                                  <p className="whitespace-pre-wrap break-words leading-relaxed mb-2">
                                                    {msg.content}
                                                    {msg.edited && (
                                                      <span className="text-[10px] text-slate-400 ml-1 italic">
                                                        (edited)
                                                      </span>
                                                    )}
                                                  </p>
                                                )}
                                                
                                                {msg.imageBase64 && (
                                                  <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                                                    <img 
                                                      src={msg.imageBase64} 
                                                      alt={msg.imageName}
                                                      className="max-w-full h-auto max-h-64 object-contain"
                                                    />
                                                  </div>
                                                )}
                                              </>
                                            )}
                                            
                                            <div className={cn(
                                              "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                              isMe ? "text-slate-300" : "text-slate-400"
                                            )}>
                                              <span>{formatMessageTime(msg.timestamp)}</span>
                                              {isMe && msg.status === 'sent' && <Check className="w-3 h-3" />}
                                              {isMe && msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                                              {isMe && msg.status === 'seen' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                                            </div>

                                            {editingMessage?.id !== msg.id && (
                                              <div className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600">
                                                      <MoreVertical className="w-4 h-4 text-slate-300" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="text-slate-300 hover:text-white hover:bg-violet-500/20">
                                                      <Reply className="w-4 h-4 mr-2" /> Reply
                                                    </DropdownMenuItem>
                                                    {msg.content && (
                                                      <DropdownMenuItem onClick={() => handleCopyMessage(msg.content)} className="text-slate-300 hover:text-white hover:bg-violet-500/20">
                                                        <Copy className="w-4 h-4 mr-2" /> Copy
                                                      </DropdownMenuItem>
                                                    )}
                                                    {isMe && (
                                                      <>
                                                        <DropdownMenuItem onClick={() => startEditing(msg)} className="text-slate-300 hover:text-white hover:bg-violet-500/20">
                                                          <Edit className="w-4 h-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteForMe(msg)} className="text-slate-300 hover:text-white hover:bg-violet-500/20">
                                                          <EyeOff className="w-4 h-4 mr-2" /> Delete for me
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                          onClick={() => handleDeleteForEveryone(msg)}
                                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        >
                                                          <Trash2 className="w-4 h-4 mr-2" /> Delete for everyone
                                                        </DropdownMenuItem>
                                                      </>
                                                    )}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isMe && (
                                          <Avatar className="w-8 h-8 ring-2 ring-slate-700">
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                                              {selectedEmployee.name?.charAt(0) || 'E'}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <div className="bg-slate-800/80 backdrop-blur-xl border-t border-slate-700 px-6 py-1">
                    
                    {replyingTo && (
                      <div className="mb-3 p-3 bg-slate-700 rounded-lg flex items-center gap-3 border-l-4 border-violet-500">
                        <ReplyAll className="w-4 h-4 text-violet-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-violet-400">
                            Replying to {replyingTo.senderName}
                          </p>
                          <p className="text-xs text-slate-300 line-clamp-1">
                            {replyingTo.content || '📷 Image'}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearReply} className="text-slate-400 hover:text-white">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    {imagePreview && (
                      <div className="mb-3 p-2 bg-slate-700 rounded-lg flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-600">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-sm text-slate-300 truncate">
                          {selectedImage?.name}
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearSelectedImage} className="text-slate-400 hover:text-white">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 py-3">
                      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                      
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-600 hover:border-violet-500 hover:bg-violet-500/10 shrink-0" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      </Button>
                      
                      <div className="flex-1 bg-slate-900/80 rounded-2xl border border-slate-700 hover:border-violet-500/30 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20">
                        <div className="flex items-center px-4">
                          {replyingTo && <ReplyAll className="w-4 h-4 text-violet-400 mr-2" />}
                          <MessageCircle className="w-5 h-5 text-slate-500" />
                          <Input
                            ref={replyInputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Message admin..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="border-0 bg-transparent px-3 py-5 focus-visible:ring-0 text-sm text-white placeholder-slate-500"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() && !selectedImage || isSending}
                        className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-violet-600/20"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSending ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-900 min-h-[500px]">
                  <div className="text-center max-w-md px-6">
                    <div className="w-28 h-28 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="w-14 h-14 text-violet-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Employee Chat
                    </h3>
                    <p className="text-slate-400 mb-8">
                      Select your name from the dropdown above to view your messages and chat with admin.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-6 py-3 rounded-2xl">
                      <Users className="w-4 h-4" />
                      <span>{employees.length} employees registered</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}