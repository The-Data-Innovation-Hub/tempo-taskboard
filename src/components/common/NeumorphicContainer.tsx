import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface NeumorphicContainerProps {
  children: ReactNode;
  className?: string;
  elevation?: "low" | "medium" | "high";
  variant?: "flat" | "pressed" | "concave" | "convex";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  color?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const NeumorphicContainer = ({
  children,
  className = "",
  elevation = "medium",
  variant = "flat",
  rounded = "md",
  color = "white",
  onClick,
  interactive = false,
}: NeumorphicContainerProps) => {
  // Define shadow values based on elevation
  const shadowValues = {
    low: {
      flat: "shadow-[5px_5px_10px_rgba(0,0,0,0.1),-5px_-5px_10px_rgba(255,255,255,0.7)]",
      pressed:
        "shadow-[inset_5px_5px_10px_rgba(0,0,0,0.1),inset_-5px_-5px_10px_rgba(255,255,255,0.7)]",
      concave:
        "shadow-[5px_5px_10px_rgba(0,0,0,0.1),-5px_-5px_10px_rgba(255,255,255,0.7)]",
      convex:
        "shadow-[5px_5px_10px_rgba(0,0,0,0.1),-5px_-5px_10px_rgba(255,255,255,0.7)]",
    },
    medium: {
      flat: "shadow-neumorphic-flat",
      pressed: "shadow-neumorphic-pressed",
      concave: "shadow-neumorphic-flat",
      convex: "shadow-neumorphic-flat",
    },
    high: {
      flat: "shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)]",
      pressed:
        "shadow-[inset_12px_12px_24px_rgba(0,0,0,0.2),inset_-12px_-12px_24px_rgba(255,255,255,0.9)]",
      concave:
        "shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)]",
      convex:
        "shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)]",
    },
  };

  // Define gradient values for concave and convex variants
  const gradientValues = {
    concave: "bg-gradient-to-br from-gray-200 to-white",
    convex: "bg-gradient-to-br from-white to-gray-200",
    flat: "",
    pressed: "",
  };

  // Add hover effect for all neumorphic elements
  const hoverTransition = "transition-all duration-300";

  // Define rounded values
  const roundedValues = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  // Define hover effect for interactive elements
  const hoverEffect = interactive
    ? `${hoverTransition} hover:shadow-neumorphic-hover active:shadow-neumorphic-pressed`
    : hoverTransition;

  // Determine background color
  const bgColor =
    color === "white"
      ? "bg-white"
      : color === "#0089AD"
        ? "bg-brand"
        : color === "black"
          ? "bg-black"
          : `bg-[${color}]`;

  // Adjust text color based on background color
  const textColor =
    color === "white"
      ? "text-gray-800"
      : color === "black"
        ? "text-white"
        : color === "#0089AD"
          ? "text-white"
          : "text-gray-800";

  return (
    <div
      className={cn(
        bgColor,
        textColor,
        roundedValues[rounded],
        shadowValues[elevation][variant],
        gradientValues[variant],
        hoverEffect,
        "p-4",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default NeumorphicContainer;
