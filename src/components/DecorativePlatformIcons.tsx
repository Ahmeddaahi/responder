import { useEffect, useState } from "react";

// WhatsApp Icon SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      fill="currentColor"
    />
  </svg>
);


export const DecorativePlatformIcons = () => {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!mounted) return null;

  // Real WhatsApp brand color: #25D366
  const whatsappColor = "#25D366";
  const whatsappBg = "rgba(37, 211, 102, 0.1)";
  const whatsappGlow = "rgba(37, 211, 102, 0.15)";

  const baseClasses = "z-0 rounded-full backdrop-blur-sm border border-border/20 flex items-center justify-center pointer-events-none select-none cursor-default";
  // Mobile: smaller and centered, Desktop: larger and bottom-right
  const sizeClasses = "w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56";
  const iconSizeClasses = "w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32";

  return (
    <>
      {/* WhatsApp Icon - Mobile: Centered between sections, Desktop: Bottom Right of hero */}
      <div
        className={`${baseClasses} ${sizeClasses} mx-auto my-6 md:absolute md:bottom-16 md:left-auto md:translate-x-0 md:right-12 md:my-0 lg:bottom-20 lg:right-16 xl:bottom-24 xl:right-20`}
        style={{
          background: whatsappBg,
          boxShadow: `0 8px 32px ${whatsappGlow}, 0 0 2px ${whatsappColor}40`,
          animation: prefersReducedMotion
            ? "none"
            : "float-whatsapp-hero 12s ease-in-out infinite, fadeIn 2s ease-out, glow-whatsapp 5s ease-in-out infinite",
          opacity: 0.8,
        }}
      >
        <WhatsAppIcon className={iconSizeClasses} style={{ color: whatsappColor }} />
      </div>


      <style>{`
        @keyframes float-whatsapp-hero {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-8px) translateX(-3px);
          }
          50% {
            transform: translateY(-4px) translateX(2px);
          }
          75% {
            transform: translateY(-6px) translateX(-2px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 0.8;
            transform: translateY(0);
          }
        }

        @keyframes glow-whatsapp {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(37, 211, 102, 0.15), 0 0 2px rgba(37, 211, 102, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(37, 211, 102, 0.25), 0 0 4px rgba(37, 211, 102, 0.5);
          }
        }


        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

