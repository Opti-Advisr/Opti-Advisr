import React from "react";
import MuiButton from "@mui/material/Button";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  let muiVariant = "contained";
  let muiColor = "primary";

  if (variant === "outline") {
    muiVariant = "outlined";
  } else if (variant === "destructive") {
    muiVariant = "contained";
    muiColor = "error";
  } else if (variant === "ghost") {
    muiVariant = "text";
    muiColor = "inherit";
  }

  let muiSize = "medium";
  if (size === "sm" || size === "xs") {
    muiSize = "small";
  } else if (size === "lg") {
    muiSize = "large";
  }

  return (
    <MuiButton
      type={type}
      variant={muiVariant}
      color={muiColor}
      size={muiSize}
      disabled={disabled}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </MuiButton>
  );
}

export default Button;
