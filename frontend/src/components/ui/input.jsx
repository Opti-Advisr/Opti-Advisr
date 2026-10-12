import React from "react";
import InputBase from "@mui/material/InputBase";

export function Input({ className = "", type = "text", ...props }) {
  return (
    <InputBase
      type={type}
      className={className}
      sx={{
        width: '100%',
        fontSize: '13px',
        color: 'inherit',
        '& .MuiInputBase-input': {
          padding: '6px 10px',
        },
      }}
      {...props}
    />
  );
}

export default Input;
