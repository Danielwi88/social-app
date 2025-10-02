export function AuthBackdrop({ variant }: { variant?: "login" | "register" }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-black" />
      <svg
        className="absolute bottom-[-45%] left-1/2 h-[120%] w-[160%] -translate-x-1/2 sm:bottom-[-20%]"
        viewBox="0 0 1440 874"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#shadow)" opacity="0.85">
          <path
            d="M513.499 668.5C1217.62 802.743 1785.67 116.446 1790 -435.5C1978.26 -218.729 1966.99 592.758 2153.95 1353.46C2387.66 2304.34 1017.88 2003.77 -46.7924 1883.55C-898.527 1787.37 -671.494 370.351 -533 -300C-258.521 -248.77 -289.001 515.5 513.499 668.5Z"
            fill="url(#grad)"
          />
        </g>
        <defs>
          <filter
            id="shadow"
            x="-967.963"
            y="-735.5"
            width="3448.26"
            height="3060.53"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur" />
          </filter>
          <linearGradient
            id="grad"
            x1="1069.81"
            y1="888.65"
            x2="-40.3002"
            y2="888.65"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#5613A3" />
            <stop offset="1" stopColor="#522BC8" />
          </linearGradient>
        </defs>
      </svg>

      {variant === "register" && (
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(120,44,232,0.35),_transparent_65%)] blur-[120px]" />
      )}
    </div>
  );
}
