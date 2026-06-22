// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'student' | 'teacher';
  avatar?: string;
  username?: string;
  level?: number;
  coins?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'student' | 'teacher';
  username?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  username?: string;
  avatar?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreate {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  userId: number;
  type: 'payment' | 'purchase' | 'refund';
  amount: number;
  description: string;
  method: 'payme' | 'click' | 'card' | 'coins';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface TransactionCreate {
  type: 'payment' | 'purchase' | 'refund';
  amount: number;
  description: string;
  method: 'payme' | 'click' | 'card' | 'coins';
}

// Group Types
export interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
  progress: number;
  status: 'active' | 'upcoming' | 'completed';
  members: number;
  maxMembers: number;
  nextSession?: string;
  avatar?: string;
  createdAt?: string;
}

export interface GroupCreate {
  name: string;
  description: string;
  category: string;
  maxMembers: number;
  avatar?: string;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'upcoming' | 'completed';
  maxMembers?: number;
  avatar?: string;
}

// Analytics Types
export interface Analytics {
  id: number;
  userId: number;
  overallBand: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  targetBand: number;
  attendance: number;
  totalClasses: number;
  presentClasses: number;
  mockExams: number;
  lastExamDate?: string;
  nextExamDate?: string;
  progress: number;
}

export interface AnalyticsUpdate {
  overallBand?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  targetBand?: number;
  attendance?: number;
  mockExams?: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
  level: number;
  change?: number;
}

// Schedule Types
export interface Schedule {
  id: number;
  userId: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  type: 'class' | 'exam' | 'practice';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Settings Types
export interface UserSettings {
  language: 'en' | 'uz' | 'ru';
  timezone: string;
  notifications: {
    instant: boolean;
    emailDigest: boolean;
  };
  theme: 'light' | 'dark';
}

// Form Types
export interface FormField {
  name: string;
  value: string;
  error?: string;
  touched: boolean;
}

export interface FormState {
  [key: string]: FormField;
}
