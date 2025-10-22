import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  const defaultClasses = "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500";
  return (
    <div className={className ?? defaultClasses}></div>
  );
};

export default Spinner;
