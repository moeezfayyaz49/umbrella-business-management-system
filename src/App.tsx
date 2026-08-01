import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { useThemeStore } from './store/themeStore';
import { lightTheme, darkTheme } from './theme';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

import { Role } from './types/auth';

const queryClient = new QueryClient();

function App() {
  const { mode } = useThemeStore();
  const { setUser, setLoading } = useAuthStore();

  const fetchAndSetUser = async (user: any) => {
    if (!user) {
      setUser(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      setUser({
        id: user.id,
        email: user.email || '',
        full_name: data?.full_name,
        role: data?.role || Role.Employee,
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      // NOTE: This will fail if Supabase is not properly configured with valid URL/Key.
      // For now, if it fails, we just set user to null.
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await fetchAndSetUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        setUser(null);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
