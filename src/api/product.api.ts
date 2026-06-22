import { withMockDelay } from './client';
import type { Product, ProductCreate, ProductUpdate, PaginatedResponse, PaginationParams } from '../types';

// Load mock products from localStorage or use default
const loadMockProducts = (): Product[] => {
  const stored = localStorage.getItem('mockProducts');
  if (stored) {
    return JSON.parse(stored);
  }
  // Default products from the existing JSON file
  return [
    {
      id: 1,
      name: 'ASMO Varsity Hoodie',
      description: 'Premium heavyweight cotton with embroidered logo. Soft clay texture.',
      price: 1200,
      category: 'Clothing',
      stock: 10,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATc9Rf0pbOJ76QO_sBE64_8W6W0byAJi-tbFktSLmqcKLyt8YtyeM8ylFDRywA7sOcWPmlW2PDDQHfvOF69FHqFg3_dGx8T0ZdFSvd1ghVJoijdOYUhWOHuO_D9PpFtnFazowi6NLlsUztFjCnqZwcLrdqqGfn1D7hDc-phn9sMQpmcvvjApprZv6qb2J9c5BVVPcjdZ7WGRDkC-3sNdSm-qHZ-jbqZ9puMCd6lLYH0VtKpheQHlWdqvnxQHhlN6jTcEHWVx2VxB4',
    },
    {
      id: 2,
      name: 'Tech Commuter Pack',
      description: 'Water-resistant shell with padded laptop sleeve and hidden compartments.',
      price: 850,
      category: 'Gear',
      stock: 5,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuRaM916KIZYGKpkQ6Uobbm-DWCGQZ9f9tBBaTsnmphyIipl2jOmFnYJMGBzgvNZh4S3e6gs8WTeGHW_6YEosEJgGRpFa-tbB-zICMYnG5tKuHFXtjgzRLYixb4lq2BA5TYVygwbGIOmBamh03CD0BQpDvagds-j8lNNswBJUW4mxFuIfRbN-wMVu-isEyxl1N27MVRz1wznZKPrf2lYC3rAD5oOvyW1QIjwe9N0JaMtS3ZkTwRUmnCV2D_BonwWwB40cGLAPA2n4',
    },
    {
      id: 3,
      name: 'Hydro Flask 32oz',
      description: 'Vacuum insulated stainless steel. Keeps drinks cold for 24 hours.',
      price: 400,
      category: 'Accessories',
      stock: 20,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASuMYvqbLNY-Dubs2LmuUuvOfxcpidqpui0AM7FqhO3BJ-CBw6PVWcN2BdIQExei82w5IUDEd9nCucijlCCP_mRCsBsonl6zqe-nN7Gm_605VZQI4FtGvAkR2phHcI501O2cGb5q8mE2ICmsZPNyjYbDy_iE75_6CaQC2XA-_0vP8ksDzjYeeZvK0YyXRMMILgWRtxXD3i0h0OhgbxVdeXjBHsN0ICujzOUdUDSdkE637O5dBF_ZvtKplWV7mJX8MxUVFtM1GqrGo',
    },
    {
      id: 4,
      name: 'Classic Snapback',
      description: 'Adjustable fit with 3D puff embroidery. Six-panel construction.',
      price: 250,
      category: 'Clothing',
      stock: 15,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzCTihPBXZcX1KZe4HZRazjbTvm1JZwGPNNxS7cJ8N7ADTphf-t2-3foDkG9rVPFguAP1QIyI1muwR_2B71xLWFuS9aIwH00aVnSrsbn2Z9uJVevOEf1K5b-2fLsxESU-bihz7cKfWqOdqXrIVJ-K_Z87uZWgEk4kIljHdJE7H5HUA3uWpbTkbm7aQNQ0-BZTlHntfOZuEpVA-wA3oqpk3fWHA_3WLa5--piG81U6P2IWx3K-b0XXhEvqYvK0AaDVqtDYxtcgPWyg',
    },
  ];
};

// Save products to localStorage
const saveMockProducts = (products: Product[]): void => {
  localStorage.setItem('mockProducts', JSON.stringify(products));
};

// Product API
export const productApi = {
  // Get all products with pagination
  getProducts: async (params: PaginationParams): Promise<PaginatedResponse<Product>> => {
    return withMockDelay(async () => {
      let products = loadMockProducts();

      // Filter by search
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        products = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.category.toLowerCase().includes(searchLower)
        );
      }

      // Filter by category if provided
      if (params.sort === 'category') {
        products = products.filter((product) => product.category === params.order);
      }

      // Sort
      if (params.sort && params.sort !== 'category') {
        products.sort((a, b) => {
          const aValue = a[params.sort as keyof Product] as string | number;
          const bValue = b[params.sort as keyof Product] as string | number;
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

      const total = products.length;
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      return {
        data: paginatedProducts,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      };
    });
  },

  // Get product by ID
  getProductById: async (id: number): Promise<Product> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();
      const product = products.find((p) => p.id === id);

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    });
  },

  // Create new product
  createProduct: async (data: ProductCreate): Promise<Product> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();

      const newProduct: Product = {
        id: products.length + 1,
        ...data,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);
      saveMockProducts(products);

      return newProduct;
    });
  },

  // Update product
  updateProduct: async (id: number, data: ProductUpdate): Promise<Product> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();
      const productIndex = products.findIndex((p) => p.id === id);

      if (productIndex === -1) {
        throw new Error('Product not found');
      }

      products[productIndex] = {
        ...products[productIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      saveMockProducts(products);

      return products[productIndex];
    });
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();
      const productIndex = products.findIndex((p) => p.id === id);

      if (productIndex === -1) {
        throw new Error('Product not found');
      }

      products.splice(productIndex, 1);
      saveMockProducts(products);
    });
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();
      const searchLower = query.toLowerCase();

      const filteredProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
      );

      return filteredProducts;
    });
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    return withMockDelay(async () => {
      const products = loadMockProducts();
      return products.filter((product) => product.category.toLowerCase() === category.toLowerCase());
    });
  },
};
