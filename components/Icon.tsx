
import React from 'react';
import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: keyof typeof icons;
}

const Icon: React.FC<IconProps> = ({ name, color, size, className }) => {
  const LucideIcon = icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon color={color} size={size} className={className} />;
};

export default Icon;
