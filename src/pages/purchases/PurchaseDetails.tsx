import { Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseView } from '../../features/purchases/components/PurchaseView';
import { usePurchase } from '../../features/purchases/hooks/usePurchase';

export const PurchaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id || '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back to Purchases
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate(`/purchases/${id}/edit`)}>
            Edit Purchase
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </Box>
      </Box>

      {purchase && <PurchaseView purchase={purchase} />}
    </Box>
  );
};
