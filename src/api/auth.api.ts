import { withMockDelay } from './client';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

// Mock token generation
const generateToken = (): string => {
  return 'mock-jwt-token-' + Math.random().toString(36).substr(2) + Date.now();
};

// Load mock users from JSON
const loadMockUsers = (): User[] => {
  // In a real app, this would be an import
  // For now, we'll use the existing mock data structure
  return [
    {
      id: 1,
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'password123',
      role: 'admin',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYAvRX7X1Q7ukJ18iv3XUJq8XCos3jB_Z46SP_g1U0AYS8yY1-RszeQCSqq2baxdNeVfBaYIlkXape2FeDSi8S5dVErit0cdSpn5TszvqkmfoAmLtPIUB7-pdQXiESixB4ctyAwRoZfs6dBw_moik8PcFfMbYZ0HLKLLuKFzC-1UVuWsXIV8fEVf_wOZAHsNbwJ2_2jiQNnVtGxknxAPJQeBr-5TG6_3iLMYlTnAF_MeUlcuVnnDg7M7fv2uuLLxAsG7RIr5_WR2g',
    },
    {
      id: 2,
      name: 'Alex Mercer',
      email: 'alex.morgan@example.com',
      password: 'password123',
      role: 'student',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUMaoORl3hq67nMRxpxxB6N6JyAUNro_Sf1EKH9YkDTVVSsoKIwNapbLQHo0M7AZSs3oqHfo6-tvv4jolcpMl9h109KVo4CBn5w0qEBwH9QbushuO-HBXtNAt7KeJfxomrBUHXQvxc-qA6UUsmEtMIfBWrgz1Y7YPedQECB6_lj1-RPNAErWOAsgBDXQusrhFVKmNW6sP2ujlLuCEr9dzXV5D0lJ2I3zrlqmm1R_LefZYD6kbkV3OUgZ2MdpVM4b3std42GpCUl5U',
      username: 'alexm_asmo',
      level: 21,
      coins: 2450,
    },
  ];
};

// In-memory storage for mock users (simulating database)
let mockUsers: User[] = loadMockUsers();

// Save users to localStorage for persistence
const saveUsersToStorage = (): void => {
  localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
};

// Load users from localStorage if available
const loadUsersFromStorage = (): void => {
  const stored = localStorage.getItem('mockUsers');
  if (stored) {
    mockUsers = JSON.parse(stored);
  }
};

// Initialize users from storage
loadUsersFromStorage();

// Auth API
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return withMockDelay(async () => {
      const user = mockUsers.find(
        (u) => u.email === credentials.email && u.password === credentials.password
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const token = generateToken();
      const { password, ...userWithoutPassword } = user;

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));

      return {
        user: userWithoutPassword,
        token,
      };
    });
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return withMockDelay(async () => {
      // Check if user already exists
      const existingUser = mockUsers.find((u) => u.email === data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser: User = {
        id: mockUsers.length + 1,
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'student',
        username: data.username || data.name.toLowerCase().replace(/\s+/g, '_'),
        level: 1,
        coins: 100,
        createdAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      saveUsersToStorage();

      const token = generateToken();
      const { password, ...userWithoutPassword } = newUser;

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));

      return {
        user: userWithoutPassword,
        token,
      };
    });
  },

  // Logout
  logout: async (): Promise<void> => {
    return withMockDelay(async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return withMockDelay(async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No user found');
      }

      const user = JSON.parse(userStr) as User;
      
      // Refresh user data from mock database
      const freshUser = mockUsers.find((u) => u.id === user.id);
      if (!freshUser) {
        throw new Error('User not found');
      }

      const { password, ...userWithoutPassword } = freshUser;
      return userWithoutPassword;
    });
  },

  // Update user profile
  updateProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    return withMockDelay(async () => {
      const userIndex = mockUsers.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveUsersToStorage();

      const { password, ...userWithoutPassword } = mockUsers[userIndex];
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));

      return userWithoutPassword;
    });
  },
};
