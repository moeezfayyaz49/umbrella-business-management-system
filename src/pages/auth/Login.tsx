import { Box, Button, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';
import { Alert } from '@mui/material';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const Login = () => {
  const { setUser, setLoading } = useAuthStore();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPasswordEmail) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail);
      if (error) throw error;
      setForgotPasswordMessage({ type: 'success', text: 'Password reset link sent to your email.' });
    } catch (err: any) {
      setForgotPasswordMessage({ type: 'error', text: err.message || 'Failed to send reset link.' });
    }
  };

  const handleForgotPasswordClose = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage(null);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError(null);
    setLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // Fetch custom user details from public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', userError);
        }

        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: userData?.full_name,
          role: userData?.role || Role.Employee,
        });
        navigate('/');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Sign In
      </Typography>
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      <TextField
        margin="normal"
        fullWidth
        label="Email Address"
        autoComplete="email"
        autoFocus
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        margin="normal"
        fullWidth
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Sign In
      </Button>
      <Box sx={{ textAlign: 'center' }}>
        <Button onClick={() => setForgotPasswordOpen(true)} variant="text" size="small">
          Forgot Password?
        </Button>
      </Box>

      <Dialog open={forgotPasswordOpen} onClose={handleForgotPasswordClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
          </DialogContentText>
          {forgotPasswordMessage && (
            <Alert severity={forgotPasswordMessage.type} sx={{ mb: 2 }}>
              {forgotPasswordMessage.text}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleForgotPasswordClose}>Cancel</Button>
          <Button onClick={handleForgotPasswordSubmit} variant="contained">
            Send Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
