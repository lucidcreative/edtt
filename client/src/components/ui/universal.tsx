import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// Universal ItemCard component for store items, assignments, announcements, etc.
interface ItemCardProps {
  title: string;
  description?: string;
  status?: string;
  icon?: LucideIcon | string;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ItemCard({
  title,
  description,
  status,
  icon: Icon,
  iconColor = "text-blue-500",
  actionLabel,
  onAction,
  actionVariant = "default",
  children,
  className,
  disabled = false,
  ...props
}: ItemCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md", 
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-testid={`item-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {Icon && (
            <div className={cn("p-2 rounded-md bg-gray-50", iconColor)}>
              {typeof Icon === 'string' ? (
                <i className={`${Icon} text-lg`} />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {status && <StatusPill status={status} />}
      </CardHeader>
      {(children || actionLabel) && (
        <CardContent className="pt-2">
          {children}
          {actionLabel && onAction && (
            <Button 
              onClick={onAction} 
              variant={actionVariant}
              className="w-full mt-4"
              disabled={disabled}
              data-testid={`action-${actionLabel.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {actionLabel}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Universal StatusPill component for various status indicators
interface StatusPillProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function StatusPill({ status, variant, className }: StatusPillProps) {
  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('approved') || statusLower.includes('active')) {
      return "default";
    }
    if (statusLower.includes('pending') || statusLower.includes('draft')) {
      return "secondary";
    }
    if (statusLower.includes('rejected') || statusLower.includes('cancelled') || statusLower.includes('inactive')) {
      return "destructive";
    }
    return "outline";
  };

  return (
    <Badge 
      variant={variant || getStatusVariant(status)}
      className={cn("capitalize", className)}
      data-testid={`status-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {status}
    </Badge>
  );
}

// Universal UserAvatarName component for displaying student/teacher info
interface UserAvatarNameProps {
  user: {
    id?: string;
    name?: string | null;
    nickname?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    role?: string;
  };
  size?: "sm" | "md" | "lg";
  showRole?: boolean;
  className?: string;
}

export function UserAvatarName({ 
  user, 
  size = "md", 
  showRole = false, 
  className 
}: UserAvatarNameProps) {
  const displayName = user.nickname || user.name || 
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User');
  
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-12 h-12 text-base"
  };

  return (
    <div 
      className={cn("flex items-center space-x-2", className)}
      data-testid={`user-avatar-${user.id || 'unknown'}`}
    >
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.profileImageUrl || ''} alt={displayName} />
        <AvatarFallback className="bg-bizcoin-blue-100 text-bizcoin-blue-700">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className={cn(
          "font-medium",
          size === "sm" && "text-sm",
          size === "lg" && "text-lg"
        )}>
          {displayName}
        </span>
        {showRole && user.role && (
          <span className="text-xs text-muted-foreground capitalize">
            {user.role}
          </span>
        )}
      </div>
    </div>
  );
}

// Universal MetricCard component for dashboard stats
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  gradient,
  className
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        gradient && "bg-gradient-to-br text-white",
        className
      )}
      style={gradient ? { background: gradient } : undefined}
      data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              gradient ? "text-white/80" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <h3 className={cn(
                "text-3xl font-bold tracking-tight",
                gradient ? "text-white" : "text-foreground"
              )}>
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500",
                  gradient && (trend.isPositive ? "text-green-200" : "text-red-200")
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className={cn(
                "text-sm mt-1",
                gradient ? "text-white/70" : "text-muted-foreground"
              )}>
                {description}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-2 rounded-md",
              gradient ? "bg-white/20" : "bg-muted"
            )}>
              {typeof Icon === 'string' ? (
                <i className={cn(
                  `${Icon} text-xl`,
                  gradient ? "text-white" : "text-muted-foreground"
                )} />
              ) : (
                <Icon className={cn(
                  "h-6 w-6",
                  gradient ? "text-white" : "text-muted-foreground"
                )} />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Universal EmptyState component for when lists are empty
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon | string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-4",
        className
      )}
      data-testid="empty-state"
    >
      {Icon && (
        <div className="p-4 rounded-full bg-muted">
          {typeof Icon === 'string' ? (
            <i className={`${Icon} text-3xl text-muted-foreground`} />
          ) : (
            <Icon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid="empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Universal LoadingState component
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        className
      )}
      data-testid="loading-state"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Universal ErrorState component
interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  actionLabel = "Try again",
  onAction,
  className
}: ErrorStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-4",
        className
      )}
      data-testid="error-state"
    >
      <div className="p-4 rounded-full bg-red-50">
        <i className="fas fa-exclamation-triangle text-2xl text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-700">{title}</h3>
        <p className="text-muted-foreground max-w-md">{message}</p>
      </div>
      {onAction && (
        <Button onClick={onAction} variant="outline" data-testid="error-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}