import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, CheckCircle, Award, Verified } from 'lucide-react';

interface TrustBadgeProps {
  isVerified: boolean;
  verifiedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'icon' | 'full';
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
  isVerified,
  verifiedAt,
  size = 'md',
  variant = 'badge',
  className = ''
}) => {
  if (!isVerified) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const tooltipContent = (
    <div className="text-center">
      <div className="font-semibold mb-1">نماد اعتماد گاراژ سنگین</div>
      <div className="text-xs text-gray-300">
        این آگهی توسط تیم مدیریت تایید شده است
      </div>
      {verifiedAt && (
        <div className="text-xs text-gray-400 mt-1">
          تاریخ تایید: {formatDate(verifiedAt)}
        </div>
      )}
    </div>
  );

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center ${className}`}>
              <Verified className={`${getIconSize()} text-blue-600`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg ${getSizeClasses()} ${className}`}>
        <Shield className={getIconSize()} />
        <span className="font-medium">نماد اعتماد</span>
        <CheckCircle className={getIconSize()} />
      </div>
    );
  }

  // Default badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`
              bg-gradient-to-r from-blue-600 to-blue-700 
              hover:from-blue-700 hover:to-blue-800 
              text-white border-0 
              ${getSizeClasses()} 
              ${className}
            `}
          >
            <Shield className={`${getIconSize()} ml-1`} />
            نماد اعتماد
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrustBadge;