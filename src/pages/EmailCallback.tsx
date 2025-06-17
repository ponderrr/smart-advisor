import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const EmailCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken && refreshToken) {
          // Set the session with the tokens from the email confirmation
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Check if profile exists, create if it doesn't
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Profile doesn't exist, create it
              const { error: createError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: data.user.id,
                    name: data.user.user_metadata?.name || 'User',
                    age: data.user.user_metadata?.age || 25,
                    email: data.user.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]);

              if (createError) {
                throw createError;
              }
            }

            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to your dashboard...');
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate('/content-selection');
            }, 2000);
          }
        } else {
          throw new Error('Invalid confirmation link');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('Failed to confirm email. Please try signing in manually.');
        
        // Redirect to auth page after delay
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={() => navigate("/")}
          className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          Smart Advisor
        </button>
      </header>

      <main className="flex flex-col items-center justify-center px-6 pt-[120px] pb-[100px]">
        <div className="text-center max-w-md">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-appAccent mx-auto mb-8" />
              <h1 className="text-2xl font-semibold text-textPrimary mb-4">
                Confirming Your Email
              </h1>
              <p className="text-textSecondary">
                Please wait while we confirm your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-8" />
              <h1 className="text-2xl font-semibold text-textPrimary mb-4">
                Email Confirmed!
              </h1>
              <p className="text-textSecondary">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h1 className="text-2xl font-semibold text-textPrimary mb-4">
                Confirmation Failed
              </h1>
              <p className="text-textSecondary mb-6">{message}</p>
              <button
                onClick={() => navigate('/auth')}
                className="bg-appAccent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200"
              >
                Go to Sign In
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailCallback;