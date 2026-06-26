// src/pages/PaymentsPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Receipt,
  Calendar,
  CircleCheck,
  CircleX,
  Clock as ClockIcon,
  TrendingUp,
  Filter,
  Search,
  Eye,
  User,
  Banknote,
  CreditCard as CardIcon,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  orderNumber: number;
  amount: string;
  amountNumber: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentType: "naqd" | "click" | "payme" | "bank" | "uzum";
  date: string;
  time: string;
  teacherName: string;
  description?: string;
  receiptNumber?: string;
}

const payments: Payment[] = [
  {
    id: "1",
    orderNumber: 2,
    amount: "500 000 so'm",
    amountNumber: 500000,
    status: "paid",
    paymentType: "naqd",
    date: "11 iyul, 2025",
    time: "16:13",
    teacherName: "Azizbek Karimov",
    description: "3-oylik to'lov",
    receiptNumber: "RCP-2025-001",
  },
  {
    id: "2",
    orderNumber: 3,
    amount: "300 000 so'm",
    amountNumber: 300000,
    status: "paid",
    paymentType: "click",
    date: "26 iyun, 2025",
    time: "14:27",
    teacherName: "Dilnoza Rahimova",
    description: "2-oylik to'lov",
    receiptNumber: "RCP-2025-002",
  },
  {
    id: "3",
    orderNumber: 1,
    amount: "1 000 000 so'm",
    amountNumber: 1000000,
    status: "paid",
    paymentType: "bank",
    date: "05 may, 2025",
    time: "09:45",
    teacherName: "Azizbek Karimov",
    description: "1-oylik to'lov",
    receiptNumber: "RCP-2025-003",
  },
  {
    id: "4",
    orderNumber: 4,
    amount: "200 000 so'm",
    amountNumber: 200000,
    status: "pending",
    paymentType: "payme",
    date: "15 iyul, 2025",
    time: "10:30",
    teacherName: "Sardor Aliyev",
    description: "Qo'shimcha dars to'lovi",
    receiptNumber: "RCP-2025-004",
  },
  {
    id: "5",
    orderNumber: 5,
    amount: "150 000 so'm",
    amountNumber: 150000,
    status: "cancelled",
    paymentType: "uzum",
    date: "20 iyun, 2025",
    time: "11:20",
    teacherName: "Dilnoza Rahimova",
    description: "Bekor qilingan to'lov",
    receiptNumber: "RCP-2025-005",
  },
];

const paymentTypeIcons = {
  naqd: {
    icon: Banknote,
    label: "Naqd",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  click: {
    icon: Smartphone,
    label: "Click",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  payme: {
    icon: Smartphone,
    label: "Payme",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  bank: {
    icon: CardIcon,
    label: "Bank",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  uzum: {
    icon: Smartphone,
    label: "Uzum",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
};

const statusConfig = {
  paid: {
    label: "To'langan",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    icon: CircleCheck,
  },
  pending: {
    label: "Kutilmoqda",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: ClockIcon,
  },
  overdue: {
    label: "Muddati o'tgan",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Bekor qilingan",
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: CircleX,
  },
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPayments = payments
    .filter(
      (p) =>
        p.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.amount.includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .filter((p) => filterType === "all" || p.paymentType === filterType);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountNumber, 0);

  const totalPayments = payments.length;
  const lastPayment = payments.find((p) => p.status === "paid");

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D6BFF] transition-colors text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26] flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-[#2D6BFF]" />
              To'lovlar tarixi
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Barcha to'lovlaringiz ro'yxati va statistikasi
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-[#1A1D26]">
              {totalPayments} ta
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Jami to'langan
              </p>
              <p className="text-xl font-bold text-[#1A1D26] mt-1.5">
                {formatAmount(totalPaid)}
              </p>
              {lastPayment && (
                <p className="text-xs text-gray-400 mt-1">
                  Oxirgi to'lov: {lastPayment.date}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Holat
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1.5">
                Qarz yo'q
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Barcha to'lovlar amalga oshirilgan
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CircleCheck className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Jami tranzaksiyalar
              </p>
              <p className="text-xl font-bold text-[#1A1D26] mt-1.5">
                {totalPayments} ta
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {payments.filter((p) => p.status === "paid").length} ta
                to'langan
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="O'qituvchi, miqdor, raqam bo'yicha qidirish..."
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
          {(filterStatus !== "all" || filterType !== "all") && (
            <span className="w-2 h-2 bg-[#2D6BFF] rounded-full" />
          )}
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="card p-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holat bo'yicha
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filterStatus === "all"
                      ? "bg-[#2D6BFF] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  Barcha
                </button>
                {Object.entries(statusConfig).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                      filterStatus === key
                        ? "bg-[#2D6BFF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                To'lov turi bo'yicha
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filterType === "all"
                      ? "bg-[#2D6BFF] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  Barcha
                </button>
                {Object.entries(paymentTypeIcons).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                      filterType === key
                        ? "bg-[#2D6BFF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    <value.icon className="w-3 h-3" />
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-[#1A1D26] flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-gray-400" />
            To'lovlar ro'yxati
            <span className="text-xs font-medium text-gray-400 ml-2">
              ({filteredPayments.length} ta)
            </span>
          </h3>

          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const status = statusConfig[payment.status];
              const StatusIcon = status.icon;
              const type = paymentTypeIcons[payment.paymentType];
              const TypeIcon = type.icon;

              return (
                <div
                  key={payment.id}
                  className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 hover:shadow-md transition-all duration-200 border border-gray-100/80 hover:border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-gray-400">
                          #{payment.orderNumber}
                        </span>
                        <div
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1.5",
                            status.color,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-bold text-[#1A1D26]">
                          {payment.amount}
                        </span>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <TypeIcon className="w-3.5 h-3.5" />
                          <span className="font-medium text-[#1A1D26]">
                            {type.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{payment.teacherName}</span>
                        </div>
                        <span className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{payment.date}</span>
                        </div>
                        <span className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{payment.time}</span>
                        </div>
                        {payment.receiptNumber && (
                          <>
                            <span className="w-px h-3 bg-gray-200" />
                            <span className="text-gray-400">
                              #{payment.receiptNumber}
                            </span>
                          </>
                        )}
                      </div>

                      {payment.description && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {payment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#2D6BFF] group">
                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 hover:text-[#2D6BFF] transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1D26] mb-1">
                Hech qanday to'lov topilmadi
              </h3>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? `"${searchQuery}" bo'yicha hech narsa topilmadi`
                  : "Hozircha to'lovlar mavjud emas"}
              </p>
            </div>
          )}

          {filteredPayments.length > 0 && (
            <button className="w-full mt-4 py-2.5 text-center text-sm text-[#2D6BFF] font-medium hover:bg-blue-50 rounded-xl transition-colors">
              Barchasini ko'rish
            </button>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="card bg-gradient-to-br from-[#2D6BFF] to-[#1A56E8] text-white">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Jami to'lovlar</p>
              <p className="text-2xl font-bold mt-1">
                {formatAmount(totalPaid)}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {totalPayments} ta tranzaksiya
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-blue-200">Oxirgi to'lov</p>
              <p className="font-medium">{lastPayment?.date || "-"}</p>
            </div>
            <div>
              <p className="text-blue-200">Holat</p>
              <p className="font-medium text-emerald-300">Qarz yo'q</p>
            </div>
            <div>
              <p className="text-blue-200">O'rtacha</p>
              <p className="font-medium">
                {totalPayments > 0
                  ? formatAmount(Math.round(totalPaid / totalPayments))
                  : "0 so'm"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
