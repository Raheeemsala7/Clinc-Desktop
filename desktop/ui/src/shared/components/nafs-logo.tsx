'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAppLocale } from '@/shared/hooks/use-app-locale';

interface NafsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  variant?: 'light' | 'dark' | 'white';
  href?: string;
  className?: string;
}

/**
 * أيقونة وشعار ميدورا (Medora) الرسمي
 */
export const NafsIcon = ({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'relative rounded-2xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden select-none',
        className
      )}
    >
      <img
        src="/app-icon.png"
        alt="Medora"
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export const MedoraIcon = NafsIcon;

export const NafsLogo = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  variant = 'light',
  href,
  className,
}: NafsLogoProps) => {
  const { tr } = useAppLocale();
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 52,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isWhite = variant === 'white';
  const isDark = variant === 'dark';

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <NafsIcon size={iconSizes[size]} />
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-heading font-black tracking-tight transition-colors',
                textSizes[size],
                isWhite
                  ? 'text-white'
                  : isDark
                  ? 'text-emerald-300'
                  : 'text-[#0B241D] dark:text-[#ECF8F3]'
              )}
            >
              {tr('ميدورا', 'Medora')}
            </span>
          </div>
          {showSubtitle && (
            <span
              className={cn(
                'text-[10px] font-bold tracking-normal',
                isWhite
                  ? 'text-emerald-100/80'
                  : 'text-[#4A635B] dark:text-[#A2C2B6]'
              )}
            >
              {tr('Medora · منظومة إدارة العيادات', 'Medora · Clinic Management')}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-transform hover:opacity-95 active:scale-95">
        {content}
      </Link>
    );
  }

  return content;
};

export const MedoraLogo = NafsLogo;

