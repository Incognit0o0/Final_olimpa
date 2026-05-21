import React from "react";

interface LogoIconProps {
  className?: string;
  size?: number;
  color?: string; // Color of the human silhouette
  heartColor?: string; // Color of the central heart
}

export default function LogoIcon({
  className = "h-5 w-5",
  size,
  color = "currentColor",
  heartColor = "#FFFFFF"
}: LogoIconProps) {
  const customStyle = size ? { width: size, height: size } : {};
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={customStyle}
    >
      {/* Scaled & aligned head of the volunteer */}
      <circle cx="50" cy="20" r="13" fill={color} />

      {/* Outer body silhouette representing shoulders and arms */}
      <path
        d="M 50 36 
           C 34 36, 20 44, 17 58 
           C 14 71, 22 84, 38 87 
           C 46 88, 54 86, 60 81 
           C 68 76, 76 68, 79 58 
           C 82 48, 74 38, 62 36 
           C 58 35, 54 36, 50 36 Z"
        fill={color}
      />

      {/* Heart cutout shape (drawn in heartColor to overlay inside the chest) */}
      <path
        d="M 50 80
           C 31 64, 28 47, 43 41
           C 48 39, 50 43, 50 43
           C 50 43, 52 39, 57 41
           C 72 47, 69 64, 50 80 Z"
        fill={heartColor}
      />

      {/* Upper hand/arm curve cradling the heart from the left side */}
      <path
        d="M 36 67
           C 32 64, 30 58, 33 53
           C 36 48, 43 46, 47 49
           C 49 51, 48 55, 45 57
           C 42 59, 39 62, 36 67 Z"
        fill={color}
      />

      {/* Lower hand/arm curve cradling the heart from bottom/right side */}
      <path
        d="M 44 79
           C 49 80, 55 78, 59 74
           C 66 67, 72 57, 70 51
           C 68 46, 61 45, 57 48
           C 54 50, 53 53, 56 55
           C 59 58, 60 61, 57 65
           C 54 69, 49 74, 44 79 Z"
        fill={color}
      />
    </svg>
  );
}
