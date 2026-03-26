import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface AdBannerProps {
  type: 'horizontal' | 'vertical' | 'square';
  className?: string;
  showPlaceholder?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  type, 
  className = '', 
  showPlaceholder = true 
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getDimensions = () => {
    switch (type) {
      case 'horizontal':
        return 'w-full h-16 md:h-20';
      case 'vertical':
        return 'w-64 h-96';
      case 'square':
        return 'w-72 h-72 md:w-80 md:h-80';
      default:
        return 'w-full h-20';
    }
  };

  const getAdSlot = () => {
    switch (type) {
      case 'horizontal':
        return '1234567890'; // Replace with actual AdSense slot ID
      case 'vertical':
        return '0987654321'; // Replace with actual AdSense slot ID
      case 'square':
        return '5678901234'; // Replace with actual AdSense slot ID
      default:
        return '1234567890';
    }
  };

  if (showPlaceholder) {
    return (
      <div className={`${getDimensions()} ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-primary-50 to-secondary-50 border border-secondary-200 rounded-lg flex flex-col items-center justify-center p-4">
          <SparklesIcon className="h-8 w-8 text-primary-400 mb-2" />
          <p className="text-xs text-secondary-500 text-center">
            Ad Space
          </p>
          <p className="text-xs text-secondary-400 text-center mt-1">
            {type === 'horizontal' && '728x90 Banner'}
            {type === 'vertical' && '300x600 Skyscraper'}
            {type === 'square' && '300x250 Medium Rectangle'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getDimensions()} ${className}`}>
      <div className="w-full h-full bg-secondary-100 border border-secondary-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-secondary-400">
          <div className="animate-pulse">
            <SparklesIcon className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs">Advertisement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
