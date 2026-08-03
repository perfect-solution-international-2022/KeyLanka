import { Heart, ShoppingCart } from "lucide-react";

type IconProps = React.ComponentProps<typeof Heart>;

export function WishlistIcon({ className = "", ...props }: IconProps & { active?: boolean }) {
  const { active, ...iconProps } = props as IconProps & { active?: boolean };

  return (
    <Heart
      aria-hidden="true"
      className={`${active ? "fill-current" : "fill-none"} ${className}`}
      strokeWidth={active ? 2.25 : 1.9}
      {...iconProps}
    />
  );
}

export function CartIcon({ className = "", ...props }: IconProps) {
  return (
    <ShoppingCart
      aria-hidden="true"
      className={`fill-none ${className}`}
      strokeWidth={1.9}
      {...props}
    />
  );
}
