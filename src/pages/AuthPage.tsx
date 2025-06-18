import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SignInFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  fullName: string;
  email: string;
  age: string;
  password: string;
  confirmPassword: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    loading,
    error: authError,
    user,
    session,
  } = useAuth();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("AuthPage useEffect - user:", user);
    console.log("AuthPage useEffect - session:", session);
    console.log("AuthPage useEffect - loading:", loading);
    if (user && session && !loading) {
      console.log("AuthPage: User, session, and not loading. Navigating...");
      navigate("/content-selection");
    }
  }, [user, session, loading, navigate]);

  const [signInData, setSignInData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogoClick = () => {
    navigate("/");
  };

  const validateSignIn = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!signInData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!signInData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!signUpData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!signUpData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!signUpData.age) {
      newErrors.age = "Age is required";
    } else if (parseInt(signUpData.age) < 13) {
      newErrors.age = "You must be at least 13 years old";
    }

    if (!signUpData.password) {
      newErrors.password = "Password is required";
    } else if (signUpData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await signIn(signInData.email, signInData.password);

      if (result.error) {
        setErrors({ general: result.error });
      } else {
        // Redirection is now handled by the useEffect hook
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const result = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.fullName,
        parseInt(signUpData.age)
      );

      if (result.error) {
        setErrors({ general: result.error });
      } else if (result.requiresEmailConfirmation) {
        // Email confirmation required
        setSuccessMessage(
          "Account created successfully! Please check your email and click the confirmation link to complete your registration."
        );
        setErrors({}); // Clear any errors
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForm = (showSignIn: boolean) => {
    setIsSignIn(showSignIn);
    setErrors({});
    setSuccessMessage(null);
  };

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={handleLogoClick}
          className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          Smart Advisor
        </button>
        <span className="text-textSecondary text-[15px] font-normal cursor-pointer hover:text-textPrimary transition-colors duration-200">
          Need help?
        </span>
      </header>

      {/* Authentication Container */}
      <main className="flex items-center justify-center min-h-[calc(100vh-72px)] px-6">
        <div className="w-full max-w-md">
          {/* Form Toggle */}
          <div className="flex gap-6 mb-8">
            <button
              onClick={() => toggleForm(true)}
              className={`text-2xl transition-all duration-200 ${
                isSignIn
                  ? "font-semibold text-textPrimary"
                  : "font-normal text-textTertiary hover:text-textSecondary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleForm(false)}
              className={`text-2xl transition-all duration-200 ${
                !isSignIn
                  ? "font-semibold text-textPrimary"
                  : "font-normal text-textTertiary hover:text-textSecondary"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
              <p className="text-green-500 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {(errors.general || authError) && !successMessage && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-sm">
                {errors.general || authError}
              </p>
            </div>
          )}

          {/* Sign In Form */}
          {isSignIn && (
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="signin-email"
                  value={signInData.email}
                  onChange={(e) =>
                    setSignInData({ ...signInData, email: e.target.value })
                  }
                  className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                    errors.email ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signin-password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({ ...signInData, password: e.target.value })
                    }
                    className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 pr-12 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                      errors.password ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textTertiary hover:text-textSecondary transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-appAccent text-white text-base font-semibold rounded-lg py-4 mt-8 hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Secondary Actions */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-textSecondary text-sm hover:text-textPrimary transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-3 text-center">
                <span className="text-textSecondary text-sm">
                  Don't have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => toggleForm(false)}
                  className="text-appAccent text-sm hover:underline transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {!isSignIn && (
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="signup-fullname"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="signup-fullname"
                  value={signUpData.fullName}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, fullName: e.target.value })
                  }
                  className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                    errors.fullName ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="signup-email"
                  value={signUpData.email}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, email: e.target.value })
                  }
                  className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                    errors.email ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Age Field */}
              <div>
                <label
                  htmlFor="signup-age"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Age
                </label>
                <input
                  type="number"
                  id="signup-age"
                  value={signUpData.age}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, age: e.target.value })
                  }
                  className={`w-[120px] bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                    errors.age ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="18"
                  min="13"
                  disabled={isSubmitting}
                />
                <p className="text-textTertiary text-xs mt-1">
                  Required for age-appropriate recommendations
                </p>
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    value={signUpData.password}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, password: e.target.value })
                    }
                    className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 pr-12 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                      errors.password ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textTertiary hover:text-textSecondary transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-textSecondary text-sm font-medium mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="signup-confirm-password"
                    value={signUpData.confirmPassword}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 pr-12 focus:outline-none focus:border-appAccent transition-colors duration-200 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-700"
                    }`}
                    placeholder="Confirm your password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textTertiary hover:text-textSecondary transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-appAccent text-white text-base font-semibold rounded-lg py-4 mt-8 hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Secondary Actions */}
              <div className="mt-4 text-center">
                <span className="text-textSecondary text-sm">
                  Already have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => toggleForm(true)}
                  className="text-appAccent text-sm hover:underline transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
