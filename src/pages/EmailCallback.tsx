import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const EmailCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log("Email callback: Starting confirmation process");
        console.log("Current URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("Hash:", window.location.hash);

        // Get the URL search parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tokenHash = urlParams.get("token_hash");
        const type = urlParams.get("type");

        console.log("URL params extracted:", { tokenHash, type });

        // Check if we have the required parameters
        if (type === "email" && tokenHash) {
          console.log("Processing email confirmation with verifyOtp...");

          // Use verifyOtp for email confirmation
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (error) {
            console.error("Email verification error:", error);
            throw error;
          }

          console.log("Email verification successful:", data);

          if (data.user) {
            // Check if profile exists, create if it doesn't
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            if (profileError && profileError.code === "PGRST116") {
              console.log("Creating user profile...");
              // Profile doesn't exist, create it
              const { error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: data.user.id,
                    name: data.user.user_metadata?.name || "User",
                    age: data.user.user_metadata?.age || 25,
                    email: data.user.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]);

              if (createError) {
                console.error("Profile creation error:", createError);
                throw createError;
              }
            } else if (profileError) {
              console.error("Profile fetch error:", profileError);
              throw profileError;
            }

            setStatus("success");
            setMessage(
              "Email confirmed successfully! Redirecting to your dashboard..."
            );

            // Redirect after a short delay
            setTimeout(() => {
              navigate("/content-selection");
            }, 2000);
            return;
          } else {
            throw new Error("No user data returned from verification");
          }
        }

        // Fallback: Try to handle hash fragments (legacy format)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        console.log("Hash params:", {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          hashType,
        });

        if (hashType === "signup" && accessToken && refreshToken) {
          console.log("Processing legacy hash-based confirmation...");

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
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            if (profileError && profileError.code === "PGRST116") {
              console.log("Creating user profile...");
              // Profile doesn't exist, create it
              const { error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: data.user.id,
                    name: data.user.user_metadata?.name || "User",
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

            setStatus("success");
            setMessage(
              "Email confirmed successfully! Redirecting to your dashboard..."
            );

            // Redirect after a short delay
            setTimeout(() => {
              navigate("/content-selection");
            }, 2000);
            return;
          }
        }

        // If we get here, no valid confirmation parameters were found
        throw new Error("Invalid confirmation link or missing parameters");
      } catch (error) {
        console.error("Email confirmation error:", error);
        setStatus("error");

        let errorMessage = "Failed to confirm email. Please try again.";

        if (error.message?.includes("Token has expired")) {
          errorMessage =
            "This confirmation link has expired. Please sign up again to get a new confirmation email.";
        } else if (error.message?.includes("already been confirmed")) {
          errorMessage =
            "This email has already been confirmed. You can sign in normally.";
        } else if (error.message?.includes("Invalid token")) {
          errorMessage =
            "This confirmation link is invalid. Please sign up again.";
        }

        setMessage(errorMessage);

        // Redirect to auth page after delay
        setTimeout(() => {
          navigate("/auth");
        }, 4000);
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
          {status === "loading" && (
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

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-8" />
              <h1 className="text-2xl font-semibold text-textPrimary mb-4">
                Email Confirmed!
              </h1>
              <p className="text-textSecondary">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h1 className="text-2xl font-semibold text-textPrimary mb-4">
                Confirmation Failed
              </h1>
              <p className="text-textSecondary mb-6">{message}</p>
              <button
                onClick={() => navigate("/auth")}
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
