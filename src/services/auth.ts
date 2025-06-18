import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/User";

export interface AuthError {
  message: string;
}

class AuthService {
  async signUp(
    email: string,
    password: string,
    name: string,
    age: number
  ): Promise<{ error: string | null }> {
    try {
      console.log("Starting signup process for:", email);

      // Determine the correct redirect URL based on environment
      const getRedirectUrl = () => {
        // Always use the current origin for the redirect
        const origin = window.location.origin;
        return `${origin}/auth/callback`;
      };

      // Create the auth user with explicit redirect URL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            age,
          },
          // Use dynamic redirect URL that works for both local and production
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (authError) {
        console.error("Sign up auth error:", authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        console.error("No user returned from signup");
        return { error: "Failed to create user account" };
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Check if email confirmation is required
      if (
        !authData.session &&
        authData.user &&
        !authData.user.email_confirmed_at
      ) {
        console.log("Email confirmation required");
        return { error: null }; // Don't treat this as an error
      }

      // If we get here, email confirmation is not required (auto-confirm is enabled)
      // Create profile immediately
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name,
          age,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return {
          error: "Failed to create user profile. Please try signing in.",
        };
      }

      console.log("Profile created successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      return {
        error: "An unexpected error occurred during sign up. Please try again.",
      };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    try {
      console.log("Starting signin process for:", email);

      // Validate inputs
      if (!email || !password) {
        return { error: "Email and password are required" };
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return { error: "Please enter a valid email address" };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);

        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          return {
            error:
              "Invalid email or password. Please check your credentials and try again.",
          };
        }
        if (error.message.includes("Email not confirmed")) {
          return {
            error:
              "Please check your email and click the confirmation link before signing in.",
          };
        }
        if (error.message.includes("Too many requests")) {
          return {
            error:
              "Too many login attempts. Please wait a moment and try again.",
          };
        }

        return { error: error.message };
      }

      if (!data.user) {
        console.error("No user returned from signin");
        return { error: "Sign in failed. Please try again." };
      }

      console.log("User signed in successfully:", data.user.id);

      // Verify profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        if (profileError.code === "PGRST116") {
          // Profile doesn't exist, create one
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
            console.error("Error creating missing profile:", createError);
            await supabase.auth.signOut();
            return {
              error: "Account setup incomplete. Please contact support.",
            };
          }
        } else {
          await supabase.auth.signOut();
          return { error: "Failed to load user profile. Please try again." };
        }
      }

      console.log("Profile verified successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      return {
        error: "An unexpected error occurred during sign in. Please try again.",
      };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      console.log("Starting signout process");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return { error: error.message };
      }
      console.log("User signed out successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signout:", err);
      return { error: "An unexpected error occurred during sign out" };
    }
  }

  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      console.log("authService.getCurrentUser: Attempting to get user...");
      let user = null;
      let userError = null;

      try {
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        user = userData.user;
        userError = userErr;
      } catch (err) {
        console.error(
          "authService.getCurrentUser: Error in supabase.auth.getUser() call:",
          err
        );
        return {
          user: null,
          error: "Failed to retrieve user from auth system",
        };
      }

      console.log(
        "authService.getCurrentUser: Result of supabase.auth.getUser() - user:",
        user
      );
      console.log(
        "authService.getCurrentUser: Result of supabase.auth.getUser() - error:",
        userError
      );

      if (userError) {
        console.error(
          "authService.getCurrentUser: Error getting user:",
          userError
        );
        return { user: null, error: userError.message };
      }

      if (!user) {
        console.log(
          "authService.getCurrentUser: No user found after getUser()."
        );
        return { user: null, error: null };
      }

      console.log("authService.getCurrentUser: User found:", user.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log(
        "authService.getCurrentUser: Result of profile fetch - profile:",
        profile
      );
      console.log(
        "authService.getCurrentUser: Result of profile fetch - error:",
        profileError
      );

      if (profileError) {
        console.error(
          "authService.getCurrentUser: Error fetching profile:",
          profileError
        );

        if (profileError.code === "PGRST116") {
          console.log(
            "authService.getCurrentUser: Profile not found, attempting to create..."
          );
          // Profile doesn't exist, create one
          const { error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                name: user.user_metadata?.name || "User",
                age: user.user_metadata?.age || 25,
                email: user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (createError) {
            console.error(
              "authService.getCurrentUser: Error creating missing profile:",
              createError
            );
            return { user: null, error: "Failed to create user profile" };
          }
          console.log(
            "authService.getCurrentUser: Profile created successfully."
          );

          // Return the created profile
          return {
            user: {
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.name || "User",
              age: user.user_metadata?.age || 25,
              created_at: new Date().toISOString(),
            },
            error: null,
          };
        }

        return { user: null, error: "Failed to fetch user profile" };
      }

      if (!profile) {
        console.log(
          "authService.getCurrentUser: User profile is null after fetch."
        );
        return { user: null, error: "User profile not found" };
      }

      console.log(
        "authService.getCurrentUser: Profile fetched successfully.",
        profile.id
      );
      return {
        user: {
          id: user.id,
          email: user.email || "",
          name: profile.name,
          age: profile.age,
          created_at: profile.created_at,
        },
        error: null,
      };
    } catch (err) {
      console.error("Error in getCurrentUser:", err);
      return { user: null, error: "Failed to get current user" };
    }
  }

  async updateProfile({
    name,
    age,
  }: {
    name: string;
    age: number;
  }): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user for profile update:", userError);
        return { error: userError.message };
      }

      if (!user) {
        return { error: "No authenticated user found" };
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          age,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return { error: updateError.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "An unexpected error occurred while updating profile" };
    }
  }
}

export const authService = new AuthService();
