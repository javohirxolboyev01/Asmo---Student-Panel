import { withMockDelay } from './client';
import type { User, UserCreate, UserUpdate, PaginatedResponse, PaginationParams } from '../types';

// Load mock users from localStorage or use default
const loadMockUsers = (): User[] => {
  const stored = localStorage.getItem('mockUsers');
  if (stored) {
    return JSON.parse(stored);
  }
  // Default users
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

// Save users to localStorage
const saveMockUsers = (users: User[]): void => {
  localStorage.setItem('mockUsers', JSON.stringify(users));
};

// User API
export const userApi = {
  // Get all users with pagination
  getUsers: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
    return withMockDelay(async () => {
      let users = loadMockUsers();

      // Filter by search
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        users = users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            (user.username && user.username.toLowerCase().includes(searchLower))
        );
      }

      // Sort
      if (params.sort) {
        users.sort((a, b) => {
          const aValue = a[params.sort as keyof User] as string | number;
          const bValue = b[params.sort as keyof User] as string | number;
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return params.order === 'desc'
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }
          return params.order === 'desc'
            ? (bValue as number) - (aValue as number)
            : (aValue as number) - (bValue as number);
        });
      }

      const total = users.length;
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Remove passwords from response
      const usersWithoutPassword = paginatedUsers.map(({ password, ...user }) => user);

      return {
        data: usersWithoutPassword,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      };
    });
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    return withMockDelay(async () => {
      const users = loadMockUsers();
      const user = users.find((u) => u.id === id);

      if (!user) {
        throw new Error('User not found');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  // Create new user
  createUser: async (data: UserCreate): Promise<User> => {
    return withMockDelay(async () => {
      const users = loadMockUsers();

      // Check if email already exists
      const existingUser = users.find((u) => u.email === data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const newUser: User = {
        id: users.length + 1,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'student',
        username: data.username || data.name.toLowerCase().replace(/\s+/g, '_'),
        level: 1,
        coins: 100,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveMockUsers(users);

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    });
  },

  // Update user
  updateUser: async (id: number, data: UserUpdate): Promise<User> => {
    return withMockDelay(async () => {
      const users = loadMockUsers();
      const userIndex = users.findIndex((u) => u.id === id);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Check if email is being changed and if it already exists
      if (data.email && data.email !== users[userIndex].email) {
        const existingUser = users.find((u) => u.email === data.email && u.id !== id);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }

      users[userIndex] = {
        ...users[userIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      saveMockUsers(users);

      const { password, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
    });
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    return withMockDelay(async () => {
      const users = loadMockUsers();
      const userIndex = users.findIndex((u) => u.id === id);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users.splice(userIndex, 1);
      saveMockUsers(users);
    });
  },

  // Search users
  searchUsers: async (query: string): Promise<User[]> => {
    return withMockDelay(async () => {
      const users = loadMockUsers();
      const searchLower = query.toLowerCase();

      const filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.username && user.username.toLowerCase().includes(searchLower))
      );

      // Remove passwords from response
      return filteredUsers.map(({ password, ...user }) => user);
    });
  },
};
