import { IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { usePrivacyStore } from '../store/privacyStore';

export const PrivacyToggle = () => {
  const hideFinancialData = usePrivacyStore((state) => state.hideFinancialData);
  const toggleHideFinancialData = usePrivacyStore((state) => state.toggleHideFinancialData);

  return (
    <Tooltip title={hideFinancialData ? 'Show financial data' : 'Hide financial data'}>
      <IconButton
        onClick={toggleHideFinancialData}
        aria-label={hideFinancialData ? 'Show financial data' : 'Hide financial data'}
        color="inherit"
        size="small"
      >
        {hideFinancialData ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </IconButton>
    </Tooltip>
  );
};
