import React from "react";
import MuiCheckbox from "@mui/material/Checkbox";

export function Checkbox({
  checked = false,
  onCheckedChange,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <MuiCheckbox
      size="small"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(event) => onCheckedChange && onCheckedChange(event.target.checked)}
      className={className}
      sx={{
        padding: '2px',
        color: '#64748b',
        '&.Mui-checked': {
          color: '#2f6bff',
        },
      }}
      {...props}
    />
  );
}

export default Checkbox;
