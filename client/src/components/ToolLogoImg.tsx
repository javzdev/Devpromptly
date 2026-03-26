import React, { useState } from 'react';
import { getLogoUrl, getFaviconUrl } from '../utils/urlHelpers';

interface ToolLogoImgProps {
  url: string;
  name: string;
  /** Tailwind size classes applied to the container, default: 'w-10 h-10' */
  size?: string;
}

const ToolLogoImg: React.FC<ToolLogoImgProps> = ({ url, name, size = 'w-10 h-10' }) => {
  const [step, setStep] = useState(0);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={`${size} rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0`}>
      {step === 0 ? (
        <img
          src={getLogoUrl(url)}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setStep(1)}
        />
      ) : step === 1 ? (
        <img
          src={getFaviconUrl(url)}
          alt={name}
          className="w-6 h-6 object-contain"
          onError={() => setStep(2)}
        />
      ) : (
        <span className="text-xs font-extrabold text-slate-400">{initials}</span>
      )}
    </div>
  );
};

export default ToolLogoImg;
