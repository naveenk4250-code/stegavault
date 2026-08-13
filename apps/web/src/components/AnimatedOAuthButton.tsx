import React from 'react';

type Provider = 'google' | 'discord' | 'linkedin';

export interface AnimatedOAuthButtonProps {
  provider: Provider;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedOAuthButton: React.FC<AnimatedOAuthButtonProps> = ({
  onClick,
  children,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`oauth-button ${className}`}
    >
      {children}
    </button>
  );
};
