// src/pages/ShopPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Star,
  Coins,
  ChevronRight,
  Filter,
  Sparkles,
  Gift,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  isPopular?: boolean;
  isNew?: boolean;
  isLimited?: boolean;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Kurs Paketi",
    description: "3 oylik premium kurslarga to'liq kirish",
    price: 500,
    originalPrice: 750,
    category: "Kurslar",
    image: "📚",
    rating: 4.8,
    reviews: 124,
    isPopular: true,
  },
  {
    id: "2",
    name: "Mentorlik Sessiyasi",
    description: "1 soatlik shaxsiy mentorlik",
    price: 300,
    category: "Xizmatlar",
    image: "🎯",
    rating: 4.9,
    reviews: 89,
    isNew: true,
  },
  {
    id: "3",
    name: "Edu Center Merch",
    description: "Cheklangan sonli merch to'plami",
    price: 150,
    originalPrice: 200,
    category: "Mahsulotlar",
    image: "👕",
    rating: 4.6,
    reviews: 56,
    isLimited: true,
  },
  {
    id: "4",
    name: "IELTS Online Kurs",
    description: "To'liq IELTS tayyorgarlik kursi",
    price: 800,
    category: "Kurslar",
    image: "🌍",
    rating: 4.9,
    reviews: 203,
    isPopular: true,
  },
  {
    id: "5",
    name: "Web Dasturlash Kursi",
    description: "Frontend + Backend to'plami",
    price: 1200,
    originalPrice: 1600,
    category: "Kurslar",
    image: "💻",
    rating: 4.7,
    reviews: 178,
  },
  {
    id: "6",
    name: "Ingliz Tili Klubi",
    description: "3 oylik speaking klubi",
    price: 250,
    category: "Xizmatlar",
    image: "🗣️",
    rating: 4.5,
    reviews: 67,
  },
];

const categories = [
  "Hammasi",
  "Kurslar",
  "Xizmatlar",
  "Mahsulotlar",
  "Chegirmalar",
];

export const ShopPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hammasi");
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<string[]>([]);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Hammasi" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((id) => id !== productId));
  };

  const isInCart = (productId: string) => cart.includes(productId);

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D6BFF] transition-colors text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26] flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-[#2D6BFF]" />
            Do'kon
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Coin bilan mahsulotlar va xizmatlarni xarid qiling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-bold text-[#1A1D26]">150</span>
          </div>
          <div className="relative">
            <button
              onClick={() => navigate("/cart")}
              className="w-10 h-10 bg-[#2D6BFF]/10 rounded-2xl flex items-center justify-center hover:bg-[#2D6BFF]/20 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-[#2D6BFF]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Mahsulot qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-5 py-3.5 bg-white rounded-2xl border border-gray-200 flex items-center gap-2 hover:border-[#2D6BFF] transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              selectedCategory === category
                ? "bg-[#2D6BFF] text-white shadow-sm"
                : "bg-white text-gray-500 hover:text-[#1A1D26] border border-gray-200",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="card hover:shadow-card-hover transition-all duration-200 hover:scale-[1.01] group"
          >
            <div className="p-5">
              {/* Product Image */}
              <div className="relative">
                <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-6xl">
                  {product.image}
                </div>
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {product.isPopular && (
                    <span className="px-2 py-1 bg-[#2D6BFF] text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Ommabop
                    </span>
                  )}
                  {product.isNew && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Yangi
                    </span>
                  )}
                  {product.isLimited && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Cheklangan
                    </span>
                  )}
                </div>
                {/* Discount Badge */}
                {product.originalPrice && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    -
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100,
                    )}
                    %
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="mt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1A1D26] text-lg group-hover:text-[#2D6BFF] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-sm font-medium text-[#1A1D26]">
                    {product.rating}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({product.reviews} sharh)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-xl font-bold text-[#1A1D26]">
                        {product.price}
                      </span>
                    </div>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-6">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      isInCart(product.id)
                        ? removeFromCart(product.id)
                        : addToCart(product.id)
                    }
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isInCart(product.id)
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "bg-[#2D6BFF] text-white hover:bg-[#1A56E8]",
                    )}
                  >
                    {isInCart(product.id) ? "Olib tashlash" : "Savatga"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1D26] mb-1">
            Mahsulot topilmadi
          </h3>
          <p className="text-gray-400 text-sm">
            {searchQuery
              ? `"${searchQuery}" bo'yicha hech narsa topilmadi`
              : "Hozircha mahsulotlar mavjud emas"}
          </p>
        </div>
      )}

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <button
          onClick={() => navigate("/payments")}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#2D6BFF] text-white px-6 py-3 rounded-2xl shadow-lg shadow-[#2D6BFF]/30 flex items-center gap-3 hover:bg-[#1A56E8] transition-all duration-200 animate-bounce-in z-30"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium">Savatda {cart.length} ta mahsulot</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <style>{`
        @keyframes bounce-in {
          0% { transform: translate(-50%, 100%) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
