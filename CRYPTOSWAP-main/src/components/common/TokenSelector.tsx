import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography
} from '@mui/material';
import { Token } from '@/types/token';

interface Props {
  tokens: Token[];
  selectedTokens: Token[];
  onChange: (tokens: Token[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export const TokenSelector: React.FC<Props> = ({
  tokens,
  selectedTokens,
  onChange,
  multiple = false,
  disabled = false
}) => {
  return (
    <Autocomplete<Token, boolean, false, false>
      multiple={multiple}
      options={tokens}
      value={selectedTokens}
      onChange={(_, newValue) => {
        if (Array.isArray(newValue)) {
          onChange(newValue);
        } else if (newValue) {
          onChange([newValue]);
        } else {
          onChange([]);
        }
      }}
      getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography>
            {option.symbol} - {option.name}
          </Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={multiple ? "Seleccionar tokens" : "Seleccionar token"}
          disabled={disabled}
        />
      )}
      disabled={disabled}
    />
  );
}; 