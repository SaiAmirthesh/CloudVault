import React from 'react';
import logo from '../assets/logo.png';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 22,
  className = '',
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2 font-heading font-bold text-lg ${className}`.trim()}>
      <img
        src={logo}
        alt="CloudVault logo"
        width={size}
        height={size}
        className="object-contain rounded-md"
      />
      {showText && (
        <span>
          CLOUD<span className="text-v10">VAULT</span>
        </span>
      )}
    </div>
  );
};
