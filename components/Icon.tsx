
import React from 'react';
import { icons } from 'lucide-react';

// FIX: The original `LucideProps` type was causing resolution issues, leading to widespread
// type errors. Redefining `IconProps` based on React's `SVGAttributes` resolves this.
// This ensures that standard props like `className`, `color`, and `aria-hidden`, as well as
// lucide-react's `size` prop, are correctly typed.
// FIX: Omit the conflicting 'name' property from React.SVGAttributes to resolve the type incompatibility.
interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'name'> {
  name: keyof typeof icons;
  size?: string | number;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = icons[name];
  if (!LucideIcon) return null;
  
  // FIX: Using spread syntax to pass props is more robust and cleaner. It ensures all
  // valid SVG attributes are passed to the icon component.
  return <LucideIcon {...props} />;
};

export default Icon;
