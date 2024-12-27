import cx from "classnames";
import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from "react";

type ButtonBaseProps = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(({ className, size = "md", variant = "primary", href, ...props }, ref) => {
  const baseStyles = cx(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D7B51]",
    {
      "px-4 py-2 text-sm": size === "sm",
      "px-5 py-2.5 text-base": size === "md",
      "px-6 py-3 text-lg": size === "lg",
    },
    {
      "bg-[#2D7B51] text-white hover:bg-[#329C5A]": variant === "primary",
      "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
      "border-2 border-[#2D7B51] text-[#2D7B51] hover:bg-[#F5F9F7]":
        variant === "outline",
    },
    className
  );

  if (href) {
    return (
      <a
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        className={baseStyles}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  return (
    <button
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      className={baseStyles}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
});

Button.displayName = "Button";