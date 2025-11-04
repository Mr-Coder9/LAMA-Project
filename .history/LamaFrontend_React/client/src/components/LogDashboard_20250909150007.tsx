import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spinner } from "@/components/ui/spinner";
import { cn } from '@/lib/utils';
import { Activity, AlertCircle, CheckCircle, XCircle, TrendingUp, Zap, Shield, Database, Monitor, Wifi } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isToday, isAfter, endOfDay } from 'date-fns';

interface LogStats {
  requests: number;
  success: number;
  failure: number;
  warning?: number;
}

interface LogSummary {
  [key: string]: {
    error: number;
    success: number;
    warning: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  hardware: 'Hardware',
  network: 'Network',
  database: 'Database',
  application: 'Application',
  login: 'Login',
  logout: 'Logout',
};

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  hardware: Monitor,
  network: Wifi,
  database: Database,
  application: Zap,
  login: Shield,
  logout: Activity,
};

// Enhanced StatCard with modern design
function StatCard({
  label,
  stats,
  onShowDetails,
  categoryKey,
}: {
  label: string;
  stats: LogStats;
  onShowDetails: (type: 'success' | 'failure' | 'warning') => void;
  categoryKey: string;
}) {
  const IconComponent = CATEGORY_ICONS[categoryKey] || Activity;
  const totalRequests = stats.requests;
  const successRate = totalRequests > 0 ? (stats.success / totalRequests * 100) : 0;

  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 p-2 min-h-[220px] h-[220px] max-h-[240px] flex flex-col justify-between">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 opacity-50" />
      
      {/* Animated border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      <div className="absolute inset-[1px] bg-white rounded-xl" />
      
      {/* Content */}
      <div className="relative flex flex-col h-full justify-between">
        <CardHeader className="pb-1 space-y-1 min-h-0 p-1">
          <div className="flex items-center justify-between min-h-0">
            <div className="flex items-center space-x-2 min-h-0">
              <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-gray-800 leading-tight">{label}</CardTitle>
                <div className="flex items-center space-x-1 mt-0.5">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-[9px] font-medium text-gray-600">{successRate.toFixed(1)}%</span>
                  </div>
                  <span className="text-[9px] text-gray-400">success rate</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-1 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-1 mb-1">
            <button
              className="group/btn relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 hover:border-green-300 rounded-xl p-1.5 transition-all duration-300 hover:shadow-lg"
              onClick={() => onShowDetails('success')}
              type="button"
            >
              <div className="flex flex-col items-center space-y-0.5">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs font-bold text-green-700">{stats.success}</span>
                <span className="text-[9px] font-medium text-green-600">Success</span>
              </div>
              <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
            
            <button
              className="group/btn relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 hover:border-red-300 rounded-xl p-1.5 transition-all duration-300 hover:shadow-lg"
              onClick={() => onShowDetails('failure')}
              type="button"
            >
              <div className="flex flex-col items-center space-y-0.5">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-bold text-red-700">{stats.failure}</span>
                <span className="text-[9px] font-medium text-red-600">Error</span>
              </div>
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
            
            <button
              className="group/btn relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border border-yellow-200 hover:border-yellow-300 rounded-xl p-1.5 transition-all duration-300 hover:shadow-lg"
              onClick={() => onShowDetails('warning')}
              type="button"
            >
              <div className="flex flex-col items-center space-y-0.5">
                <AlertCircle className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">{stats.warning ?? 0}</span>
                <span className="text-[9px] font-medium text-yellow-600">Warning</span>
              </div>
              <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
          </div>
          
          <div className="mt-1 p-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium text-gray-600">Total Requests</span>
              <span className="text-[10px] font-bold text-gray-800">{totalRequests}</span>
            </div>
            <div className="mt-0.5 w-full bg-gray-200 rounded-full h-0.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-0.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(successRate, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// Enhanced DetailsModal with modern design
function DetailsModal({
  open,
  onClose,
  stepLabel,
  type,
}: {
  open: boolean;
  onClose: () => void;
  stepLabel: string | null;
  type: 'success' | 'failure' | 'warning' | null;
}) {
  if (!open) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          gradientFrom: 'from-green-500',
          gradientTo: 'to-green-600'
        };
      case 'failure':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          gradientFrom: 'from-red-500',
          gradientTo: 'to-red-600'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          gradientFrom: 'from-yellow-500',
          gradientTo: 'to-yellow-600'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          gradientFrom: 'from-gray-500',
          gradientTo: 'to-gray-600'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[95vw] border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl" />
        
        {/* Content */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <span className="text-gray-600 text-lg">×</span>
          </button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-3 ${config.bgColor} ${config.borderColor} border rounded-xl`}>
              <IconComponent className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {type === 'success' ? 'Success' : type === 'failure' ? 'Error' : 'Warning'} Details
              </h3>
              <p className="text-gray-600 mt-1">Category: <span className="font-semibold">{stepLabel}</span></p>
            </div>
          </div>
          
          <div className={`p-4 ${config.bgColor} ${config.borderColor} border rounded-xl`}>
            <p className="text-gray-700">
              Details for <span className="font-semibold">{type}</span> in <span className="font-semibold">{stepLabel}</span> will appear here.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${config.color}`}>
                  {type === 'success' ? 'Operational' : type === 'failure' ? 'Error' : 'Warning'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-semibold text-gray-800">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose} 
              className={`px-6 py-3 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format date as YYYY-MM-DD
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LogDashboard() {
  const [logData, setLogData] = useState<Record<string, LogStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Modal state for showing details
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'success' | 'failure' | 'warning' | null>(null);

  // Handler to open modal
  const handleShowDetails = (step: string, type: 'success' | 'failure' | 'warning') => {
    setModalStep(step);
    setModalType(type);
    setModalOpen(true);
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalStep(null);
    setModalType(null);
  };

  // Fetch log summary data for selected date
  const fetchLogData = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDateLocal(date);
      let url = '';
      if (isToday(date)) {
        url = (import.meta.env.VITE_BACKEND_API_URL || 'http://192.168.12.23:6001') + '/api/logs/summary';
      } else {
        url = (import.meta.env.VITE_BACKEND_API_URL || 'http://192.168.12.23:6001') + `/api/logs/summary-by-date?date=${dateStr}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No log summary for this date');
      }
      const data = await res.json();
      const summary = data.summary || {};
      const mapped: Record<string, LogStats> = {};
      Object.keys(summary).forEach((key) => {
        mapped[key] = {
          success: summary[key].success,
          failure: summary[key].error,
          warning: summary[key].warning,
          requests: summary[key].success + summary[key].error + summary[key].warning,
        };
      });
      setLogData(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch log data');
      setLogData({});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Helper to get stats for a key
  function getStats(key: string): LogStats {
    return logData[key] || { requests: 0, success: 0, failure: 0, warning: 0 };
  }

  // Steps for dashboard
  const orderedSteps = [
    { key: 'hardware', label: CATEGORY_LABELS['hardware'] },
    { key: 'network', label: CATEGORY_LABELS['network'] },
    { key: 'database', label: CATEGORY_LABELS['database'] },
    { key: 'application', label: CATEGORY_LABELS['application'] },
    { key: 'login', label: CATEGORY_LABELS['login'] },
    { key: 'logout', label: CATEGORY_LABELS['logout'] },
  ];

  // Calculate overall stats
  const overallStats = orderedSteps.reduce((acc, { key }) => {
    const stats = getStats(key);
    return {
      total: acc.total + stats.requests,
      success: acc.success + stats.success,
      failure: acc.failure + stats.failure,
      warning: acc.warning + (stats.warning || 0),
    };
  }, { total: 0, success: 0, failure: 0, warning: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/30">
      {/* Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Log Dashboard</h2>
          <p className="text-gray-600 text-sm">View log summary by date.</p>
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className="bg-white rounded-lg shadow px-4 py-2 border border-gray-300 text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setCalendarOpen((open) => !open)}
            >
              {format(selectedDate, 'PPP')}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={date => {
                if (date) {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }
              }}
              initialFocus
              disabled={date => isAfter(date, endOfDay(new Date()))}
              className="bg-white rounded-lg shadow p-2"
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative space-y-6 p-4 md:p-6">
        {loading && (
          <div className="flex flex-col items-center py-16">
            <div className="relative">
              <Spinner className="w-12 h-12 text-blue-500" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/20 rounded-full animate-ping" />
            </div>
            <span className="text-lg text-gray-600 mt-4">Loading log data...</span>
          </div>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 border">
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <div className="text-red-700 font-semibold">{error}</div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Category Cards */}
            <div className="w-full overflow-x-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 min-w-[900px]">
                {orderedSteps.map(({ key, label }) => (
                  <StatCard
                    key={key}
                    label={label}
                    stats={getStats(key)}
                    onShowDetails={(type) => handleShowDetails(key, type)}
                    categoryKey={key}
                  />
                ))}
              </div>
            </div>

            {/* Chart */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Log Distribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={orderedSteps.map(({ key, label }) => {
                        const stats = getStats(key);
                        return {
                          category: label,
                          key,
                          success: stats.success,
                          failure: stats.failure,
                          warning: stats.warning,
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="success"
                        name="Success"
                        fill="url(#successGradient)"
                        radius={[4, 4, 0, 0]}
                        onClick={(_, index) => {
                          const stepKey = orderedSteps[index]?.key;
                          if (stepKey) handleShowDetails(stepKey, 'success');
                        }}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="failure"
                        name="Error"
                        fill="url(#errorGradient)"
                        radius={[4, 4, 0, 0]}
                        onClick={(_, index) => {
                          const stepKey = orderedSteps[index]?.key;
                          if (stepKey) handleShowDetails(stepKey, 'failure');
                        }}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="warning"
                        name="Warning"
                        fill="url(#warningGradient)"
                        radius={[4, 4, 0, 0]}
                        onClick={(_, index) => {
                          const stepKey = orderedSteps[index]?.key;
                          if (stepKey) handleShowDetails(stepKey, 'warning');
                        }}
                        cursor="pointer"
                      />
                      <defs>
                        <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <DetailsModal
              open={modalOpen}
              onClose={handleCloseModal}
              stepLabel={modalStep && orderedSteps.find(s => s.key === modalStep)?.label || null}
              type={modalType}
            />
          </>
        )}
      </div>
    </div>
  );
}
