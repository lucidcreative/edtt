// Theme utilities for consistent styling across the application

export const gradients = {
  blue: 'var(--gradient-blue)',
  purple: 'var(--gradient-purple)',
  pink: 'var(--gradient-pink)',
  pinkRose: 'var(--gradient-pink-rose)',
  green: 'var(--gradient-green)',
  yellow: 'var(--gradient-yellow)',
  bluePurple: 'var(--gradient-blue-purple)',
} as const;

export const shadows = {
  bento: 'var(--shadow-bento)',
  card: 'var(--shadow-card)',
  glowBlue: 'var(--shadow-glow-blue)',
  hover: 'var(--shadow-hover)',
} as const;

export const radius = {
  default: 'var(--radius)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
} as const;

// Theme configurations for different component types
export const componentThemes = {
  assignments: {
    gradient: gradients.blue,
    icon: 'fas fa-tasks',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  store: {
    gradient: gradients.green,
    icon: 'fas fa-store',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  badges: {
    gradient: gradients.yellow,
    icon: 'fas fa-award',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  challenges: {
    gradient: gradients.purple,
    icon: 'fas fa-trophy',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  announcements: {
    gradient: gradients.pink,
    icon: 'fas fa-bullhorn',
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
  students: {
    gradient: gradients.bluePurple,
    icon: 'fas fa-users',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  analytics: {
    gradient: gradients.pinkRose,
    icon: 'fas fa-chart-line',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  timeTracking: {
    gradient: gradients.blue,
    icon: 'fas fa-clock',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
} as const;

// Status color mappings for consistent status indicators
export const statusColors = {
  // Assignment statuses
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  
  // General statuses
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  
  // Store item statuses
  available: 'bg-green-100 text-green-800 border-green-200',
  outOfStock: 'bg-red-100 text-red-800 border-red-200',
  
  // Time tracking statuses
  clockedIn: 'bg-green-100 text-green-800 border-green-200',
  clockedOut: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

// Priority color mappings
export const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Role color mappings
export const roleColors = {
  student: 'bg-blue-100 text-blue-800 border-blue-200',
  teacher: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Animation classes for consistent transitions
export const animations = {
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  slideLeft: 'animate-in slide-in-from-right-4 duration-300',
  slideRight: 'animate-in slide-in-from-left-4 duration-300',
  fadeIn: 'animate-in fade-in duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  
  // Hover animations
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-200',
  hoverGlow: 'hover:shadow-lg transition-shadow duration-200',
} as const;

// Utility function to get theme configuration by type
export function getComponentTheme(type: keyof typeof componentThemes) {
  return componentThemes[type];
}

// Utility function to get status color class
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') as keyof typeof statusColors;
  return statusColors[normalizedStatus] || statusColors.pending;
}

// Utility function to get priority color class
export function getPriorityColor(priority: string): string {
  const normalizedPriority = priority.toLowerCase() as keyof typeof priorityColors;
  return priorityColors[normalizedPriority] || priorityColors.normal;
}

// Utility function to get role color class
export function getRoleColor(role: string): string {
  const normalizedRole = role.toLowerCase() as keyof typeof roleColors;
  return roleColors[normalizedRole] || roleColors.student;
}

// Responsive grid configurations for consistent layouts
export const gridLayouts = {
  dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  metrics: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  list: 'space-y-4',
  table: 'overflow-x-auto',
} as const;

// Icon mappings for consistency
export const iconMap = {
  assignments: 'fas fa-tasks',
  assignment: 'fas fa-file-alt',
  store: 'fas fa-store',
  badges: 'fas fa-award',
  badge: 'fas fa-medal',
  challenges: 'fas fa-trophy',
  challenge: 'fas fa-target',
  announcements: 'fas fa-bullhorn',
  announcement: 'fas fa-info-circle',
  students: 'fas fa-users',
  student: 'fas fa-user',
  teacher: 'fas fa-chalkboard-teacher',
  classroom: 'fas fa-school',
  analytics: 'fas fa-chart-line',
  timeTracking: 'fas fa-clock',
  tokens: 'fas fa-coins',
  settings: 'fas fa-cog',
  home: 'fas fa-home',
  progress: 'fas fa-chart-bar',
  edit: 'fas fa-edit',
  delete: 'fas fa-trash',
  add: 'fas fa-plus',
  save: 'fas fa-save',
  cancel: 'fas fa-times',
  submit: 'fas fa-paper-plane',
  download: 'fas fa-download',
  upload: 'fas fa-upload',
  filter: 'fas fa-filter',
  search: 'fas fa-search',
  sort: 'fas fa-sort',
  refresh: 'fas fa-sync',
  expand: 'fas fa-expand',
  collapse: 'fas fa-compress',
} as const;

// Data formatting utilities
export const formatters = {
  currency: (amount: number) => `$${amount.toFixed(2)}`,
  tokens: (amount: number) => `${amount.toLocaleString()} tokens`,
  percentage: (value: number) => `${value}%`,
  date: (date: Date | string) => new Date(date).toLocaleDateString(),
  time: (date: Date | string) => new Date(date).toLocaleTimeString(),
  dateTime: (date: Date | string) => new Date(date).toLocaleString(),
  duration: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },
} as const;