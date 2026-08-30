import { 
  Box, Typography, Paper, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
  Stack, IconButton
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema } from '../schemas';
import type { SettingsFormInputs } from '../schemas';
import type { CompanySettings } from '../types';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { settingsService } from '../services/settingsService';
import { useState } from 'react';

interface Props {
  initialData: CompanySettings;
  onSubmit: (data: SettingsFormInputs) => void;
  isSubmitting: boolean;
}

export const SettingsForm = ({ initialData, onSubmit, isSubmitting }: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormInputs>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: initialData.company_name,
      address: initialData.address || '',
      phone: initialData.phone || '',
      additional_phones: initialData.additional_phones || [],
      email: initialData.email || '',
      tax_id: initialData.tax_id || '',
      currency: initialData.currency || 'PKR',
      timezone: initialData.timezone,
      invoice_prefix: initialData.invoice_prefix || 'UMB',
      company_logo_url: initialData.company_logo_url || '',
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialData.company_logo_url);
  const additionalPhones = watch('additional_phones') || [];

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await settingsService.uploadLogo(file);
      setLogoUrl(url);
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (data: SettingsFormInputs) => {
    onSubmit({
      ...data,
      company_logo_url: logoUrl,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Company Profile</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This information will be displayed on your invoices and purchase orders.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box 
            sx={{ 
              width: 100, height: 100, borderRadius: 1, 
              border: '1px dashed grey', display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', bgcolor: 'background.default'
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <Typography variant="caption" color="text.secondary">No Logo</Typography>
            )}
          </Box>
          <Box>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Logo'}
              <input
                type="file"
                hidden
                accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                onChange={handleLogoUpload}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Recommended size: 200x50px. Max 2MB.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <TextField
            label="Company Name"
            {...register('company_name')}
            error={!!errors.company_name}
            helperText={errors.company_name?.message}
            fullWidth
          />
          <TextField
            label="Tax ID / VAT Number"
            {...register('tax_id')}
            error={!!errors.tax_id}
            helperText={errors.tax_id?.message}
            fullWidth
          />
          <TextField
            label="Email Address"
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Phone Numbers</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setValue('additional_phones', [...additionalPhones, ''])}
                size="small"
              >
                Add Phone
              </Button>
            </Box>
            <TextField
              label="Primary Phone"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              fullWidth
              size="small"
              sx={{ mb: additionalPhones.length > 0 ? 1 : 0 }}
            />
            {additionalPhones.map((_, index) => (
              <Stack direction="row" spacing={1} key={index} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Phone ${index + 2}`}
                  {...register(`additional_phones.${index}` as const)}
                  error={!!errors.additional_phones?.[index]}
                  helperText={errors.additional_phones?.[index]?.message}
                />
                <IconButton
                  color="error"
                  onClick={() =>
                    setValue(
                      'additional_phones',
                      additionalPhones.filter((_, i) => i !== index)
                    )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Box>
          <TextField
            label="Business Address"
            multiline
            rows={3}
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message}
            fullWidth
            sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
          />
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>User Preferences</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure how the application behaves for you.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <FormControl fullWidth error={!!errors.currency}>
            <InputLabel>Base Currency</InputLabel>
            <Select
              label="Base Currency"
              {...register('currency')}
              defaultValue={initialData.currency}
            >
              <MenuItem value="PKR">PKR (₨) - Pakistani Rupee</MenuItem>
              <MenuItem value="USD">USD ($) - US Dollar</MenuItem>
              <MenuItem value="EUR">EUR (€) - Euro</MenuItem>
              <MenuItem value="GBP">GBP (£) - British Pound</MenuItem>
              <MenuItem value="AUD">AUD ($) - Australian Dollar</MenuItem>
              <MenuItem value="CAD">CAD ($) - Canadian Dollar</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth error={!!errors.timezone}>
            <InputLabel>Timezone</InputLabel>
            <Select
              label="Timezone"
              {...register('timezone')}
              defaultValue={initialData.timezone}
            >
              <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
              <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
              <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="Asia/Karachi">Asia/Karachi (PKT)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Invoice Prefix"
            {...register('invoice_prefix')}
            error={!!errors.invoice_prefix}
            helperText={errors.invoice_prefix?.message}
            fullWidth
          />
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="submit" 
          variant="contained" 
          size="large" 
          startIcon={<SaveIcon />}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};
