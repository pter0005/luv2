const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 95"
      fill="none"
      className="w-full h-full"
      {...props}
    >
      <defs>
        <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
         <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        fill="url(#heart-gradient)"
        style={{ filter: "url(#glow)" }}
        d="M50 95C48.6 94.3 26.5 82.4 13.2 66.8 2.2 54.2 0 45.1 0 33.1 0 14.8 14.9 0 33.1 0c11.3 0 16.9 5.8 20.4 11.2-.1-1 .3-1.6.4-2.1C55.2 5.2 60.5 0 70.4 0c18.2 0 33.1 14.8 33.1 33.1 0 12-2.2 21.1-13.2 33.7C77.1 82.4 55.1 94.3 53.6 95c-1 .3-2.6.3-3.6 0z"
      />
    </svg>
  );
  
  export default HeartIcon;  
