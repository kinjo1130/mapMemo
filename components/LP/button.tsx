import cx from "classnames";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { useRouter } from "next/router";

type ButtonBaseProps = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  href?: string;
};

type ButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", variant = "primary", href, ...props }, ref) => {
    const router = useRouter();
    console.log("Button", href);

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

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (href) {
        e.preventDefault();
        router.push(href);
      }
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        className={baseStyles}
        onClick={handleClick}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);

Button.displayName = "Button";