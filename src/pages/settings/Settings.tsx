import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useState } from 'react';
import { SettingsForm } from '../../features/settings/components/SettingsForm';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { useUpdateSettings } from '../../features/settings/hooks/useUpdateSettings';
import type { SettingsFormInputs } from '../../features/settings/schemas';

export const Settings = () => {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const [toastOpen, setToastOpen] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSubmit = async (data: SettingsFormInputs) => {
    await updateMutation.mutateAsync(data);
    setToastOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Settings</Typography>
      
      {settings && (
        <SettingsForm 
          initialData={settings} 
          onSubmit={handleSubmit} 
          isSubmitting={updateMutation.isPending}
        />
      )}

      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: '100%' }}>
          Settings updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};
