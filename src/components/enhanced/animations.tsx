// Animation Utilities and Hooks
// File: src/components/enhanced/animations.ts

import React from "react";

// Animation Utilities
export const AnimationUtils = {
  // Stagger children animations
  staggerChildren: (
    children: React.ReactNode,
    delay = 100
  ): React.ReactElement[] => {
    return React.Children.map(children, (child, index) => (
      <div
        key={index}
        className="animate-in fade-in duration-700"
        style={{ animationDelay: `${index * delay}ms` }}
      >
        {child}
      </div>
    ));
  },

  // Fade in animation props
  fadeIn: (delay = 0) => ({
    className: "animate-in fade-in duration-700",
    style: { animationDelay: `${delay}ms` },
  }),

  // Slide up animation props
  slideUp: (delay = 0) => ({
    className: "animate-in slide-up duration-700",
    style: { animationDelay: `${delay}ms` },
  }),

  // Scale in animation props
  scaleIn: (delay = 0) => ({
    className: "animate-in scale-in duration-500",
    style: { animationDelay: `${delay}ms` },
  }),

  // Slide from direction
  slideFrom: (direction: "left" | "right" | "top" | "bottom", delay = 0) => ({
    className: `animate-in slide-from-${direction} duration-700`,
    style: { animationDelay: `${delay}ms` },
  }),
};

// CSS Classes for easy application
export const AnimationClasses = {
  // Basic animations
  fadeIn: "animate-in fade-in duration-700",
  slideUp: "animate-in slide-up duration-700",
  scaleIn: "animate-in scale-in duration-500",

  // Interactive elements
  ctaGlow: "cta-glow",
  selectionCard: "selection-card",
  enhancedButton: "enhanced-button",
  formInput: "form-input",
  formTextarea: "form-textarea",

  // Loading states
  shimmerContainer: "shimmer-container",
  enhancedSpinner: "enhanced-spinner",

  // Progress
  progressContainer: "progress-container",
  progressFill: "progress-fill",

  // Cards and interactions
  recommendationCard: "recommendation-card",
  favoriteButton: "favorite-button",

  // Menu and navigation
  userMenu: "user-menu",
  userMenuItem: "user-menu-item",

  // Toast notifications
  toastEnter: "toast-enter-active",
  toastExit: "toast-exit-active",
  toastSuccess: "toast-success",
  toastError: "toast-error",
  toastInfo: "toast-info",

  // Hover effects
  hoverLift:
    "hover:transform hover:translateY(-2px) transition-transform duration-200",
  hoverGlow:
    "hover:shadow-lg hover:shadow-indigo-500/25 transition-shadow duration-300",
  hoverScale: "hover:scale-105 transition-transform duration-200",
};

// Hook for managing animations based on user preferences
export const useAnimations = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion,
    getAnimationClass: (animationClass: string) =>
      prefersReducedMotion ? "" : animationClass,
    getAnimationProps: (props: {
      className?: string;
      style?: React.CSSProperties;
    }) => (prefersReducedMotion ? {} : props),
  };
};

// Hook for staggered animations
export const useStaggeredAnimation = (
  itemCount: number,
  baseDelay = 0,
  staggerDelay = 100
) => {
  const { shouldAnimate } = useAnimations();

  const getItemProps = React.useCallback(
    (index: number) => {
      if (!shouldAnimate) return {};

      return {
        className: "animate-in fade-in duration-700",
        style: {
          animationDelay: `${baseDelay + index * staggerDelay}ms`,
          animationFillMode: "both",
        },
      };
    },
    [shouldAnimate, baseDelay, staggerDelay]
  );

  return { getItemProps, shouldAnimate };
};

// Hook for intersection observer animations
export const useInViewAnimation = (options: IntersectionObserverInit = {}) => {
  const [isInView, setIsInView] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimations();

  React.useEffect(() => {
    if (!shouldAnimate || !ref.current) return;

    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [shouldAnimate, hasAnimated, options]);

  return {
    ref,
    isInView: shouldAnimate ? isInView : true,
    shouldAnimate,
  };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);
  const { shouldAnimate } = useAnimations();

  React.useEffect(() => {
    if (!shouldAnimate) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      const element = ref.current;
      observer.observe(element);

      return () => {
        observer.unobserve(element);
        observer.disconnect();
      };
    }
  }, [threshold, shouldAnimate]);

  return { ref, isVisible, shouldAnimate };
};

// Animation timing functions
export const AnimationTimings = {
  // Easing functions
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",

  // Common durations (in ms)
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,

  // Stagger delays
  stagger: {
    fast: 50,
    normal: 100,
    slow: 200,
  },
};

// Animation presets for common use cases
export const AnimationPresets = {
  // Card entrance
  cardEntrance: {
    className: "animate-in fade-in slide-up duration-700",
    style: { animationFillMode: "both" },
  },

  // Button hover
  buttonHover: {
    className:
      "transition-all duration-200 hover:transform hover:translateY(-1px) hover:shadow-lg",
  },

  // Loading state
  loadingPulse: {
    className: "animate-pulse",
  },

  // Success state
  successBounce: {
    className: "animate-bounce",
  },

  // Error shake
  errorShake: {
    className: "animate-shake",
  },
};

// Utility function to combine animation classes
export const combineAnimations = (...animations: (string | undefined)[]) => {
  return animations.filter(Boolean).join(" ");
};

// Utility function to create keyframe animations dynamically
export const createKeyframes = (
  name: string,
  keyframes: Record<string, React.CSSProperties>
) => {
  const keyframeString = Object.entries(keyframes)
    .map(([key, styles]) => {
      const styleString = Object.entries(styles)
        .map(
          ([prop, value]) =>
            `${prop
              .replace(/([a-z])([A-Z])/g, "$1-$2")
              .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
              .toLowerCase()}: ${value}`
        )
        .join("; ");
      return `${key} { ${styleString} }`;
    })
    .join(" ");

  return `@keyframes ${name} { ${keyframeString} }`;
};

// Animation sequence manager
export class AnimationSequence {
  private sequence: Array<() => Promise<void>> = [];

  add(animation: () => Promise<void>) {
    this.sequence.push(animation);
    return this;
  }

  addDelay(ms: number) {
    this.sequence.push(() => new Promise((resolve) => setTimeout(resolve, ms)));
    return this;
  }

  async play() {
    for (const animation of this.sequence) {
      await animation();
    }
  }

  clear() {
    this.sequence = [];
    return this;
  }
}

// Performance monitoring for animations
export const AnimationPerformance = {
  // Monitor frame rate during animations
  monitorFPS: (callback: (fps: number) => void) => {
    let frames = 0;
    let lastTime = performance.now();
    let animationFrameId: number | null = null;

    const countFrames = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        callback(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(countFrames);
    };

    animationFrameId = requestAnimationFrame(countFrames);

    // Return cleanup function to stop the monitoring
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
  },

  // Check if device supports smooth animations
  supportsSmoothAnimations: () => {
    // Check for hardware acceleration support
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  },

  // Detect slow device and disable heavy animations
  isSlowDevice: () => {
    // Simple heuristic based on device characteristics
    const connection = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;

    return (
      hardwareConcurrency < 4 ||
      (connection && connection.effectiveType === "slow-2g") ||
      /Android.*Chrome\/[0-5]/.test(navigator.userAgent)
    );
  },
};

// Export everything for easy access
export default {
  AnimationUtils,
  AnimationClasses,
  AnimationTimings,
  AnimationPresets,
  AnimationPerformance,
  useAnimations,
  useStaggeredAnimation,
  useInViewAnimation,
  useScrollAnimation,
  combineAnimations,
  createKeyframes,
  AnimationSequence,
};
