interface PriceTagProps {
  price: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriceTag = ({ price, size = 'md' }: PriceTagProps) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-baseline gap-1 ${sizeClasses[size]}`}>
      <span className="font-semibold text-foreground">{price}</span>
      <span className="text-muted-foreground font-normal">FND / call</span>
    </div>
  );
};
