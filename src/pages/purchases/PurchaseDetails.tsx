import { Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { PurchaseView } from '../../features/purchases/components/PurchaseView';
import { usePurchase } from '../../features/purchases/hooks/usePurchase';
import { useCreateVendorTransfer } from '../../features/vendors/hooks/useVendorMutations';
import { VendorTransferDialog } from '../../features/vendors/components/VendorTransferDialog';
import type { VendorTransferFormInputs } from '../../features/vendors/schemas';
import { printDocument } from '../../utils/printDocument';

export const PurchaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id || '');
  const transferMutation = useCreateVendorTransfer();
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const handleTransferSubmit = async (data: VendorTransferFormInputs) => {
    await transferMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back to Purchases
        </Button>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<SwapHorizIcon />}
            onClick={() => setIsTransferOpen(true)}
          >
            Transfer to Another Vendor
          </Button>
          <Button variant="contained" onClick={() => navigate(`/purchases/${id}/edit`)}>
            Edit Purchase
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() =>
              printDocument({
                title: purchase ? `Purchase ${purchase.purchase_number}` : 'Purchase Order',
              })
            }
          >
            Print
          </Button>
        </Box>
      </Box>

      {purchase && <PurchaseView purchase={purchase} />}

      {purchase && (
        <VendorTransferDialog
          open={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          onSubmit={handleTransferSubmit}
          initialFromVendorId={purchase.vendor_id}
          initialPurchaseId={purchase.id}
          isSubmitting={transferMutation.isPending}
        />
      )}
    </Box>
  );
};

