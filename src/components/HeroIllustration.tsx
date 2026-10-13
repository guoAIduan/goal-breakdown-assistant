/**
 * 首页 Hero 插画：内联 SVG，避免依赖外部图床或平台私有地址，
 * 配色沿用主题里的暖紫 + 米白，风格与设计稿一致（扁平、圆角、柔和渐变）。
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 840 360"
      role="img"
      aria-label="把目标拆成可勾选的步骤"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(268 80% 97%)" />
          <stop offset="55%" stopColor="hsl(30 60% 99%)" />
          <stop offset="100%" stopColor="hsl(268 55% 94%)" />
        </linearGradient>
        <linearGradient id="hero-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(268 68% 60%)" />
          <stop offset="100%" stopColor="hsl(300 62% 62%)" />
        </linearGradient>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="hsl(268 68% 40%)" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width="840" height="360" fill="url(#hero-bg)" />
      <circle cx="104" cy="52" r="148" fill="hsl(268 90% 92%)" opacity="0.75" />
      <circle cx="772" cy="322" r="168" fill="hsl(32 100% 93%)" opacity="0.8" />

      {/* 主卡片：三条步骤 + 勾选状态 */}
      <g filter="url(#hero-shadow)">
        <rect x="168" y="52" width="504" height="256" rx="28" fill="#ffffff" stroke="hsl(240 8% 92%)" />
      </g>

      {/* 步骤 1：已完成 */}
      <circle cx="228" cy="118" r="18" fill="hsl(268 68% 60%)" />
      <path
        d="M220 118.5l5.5 5.5 10.5-11"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="262" y="104" width="188" height="12" rx="6" fill="hsl(268 68% 60%)" opacity="0.85" />
      <rect x="262" y="124" width="268" height="9" rx="4.5" fill="hsl(268 30% 92%)" />
      <rect x="596" y="106" width="52" height="22" rx="11" fill="hsl(268 80% 96%)" />
      <rect x="608" y="115" width="28" height="4" rx="2" fill="hsl(268 50% 62%)" opacity="0.7" />

      <line x1="228" y1="140" x2="228" y2="176" stroke="hsl(268 68% 60%)" strokeWidth="2" strokeDasharray="4 6" opacity="0.45" />

      {/* 步骤 2：进行中 */}
      <circle cx="228" cy="198" r="18" fill="hsl(268 80% 96%)" stroke="hsl(268 68% 60%)" strokeWidth="2.5" />
      <circle cx="228" cy="198" r="6" fill="hsl(268 68% 60%)" />
      <rect x="262" y="184" width="150" height="12" rx="6" fill="hsl(268 40% 80%)" />
      <rect x="262" y="204" width="300" height="9" rx="4.5" fill="hsl(268 30% 92%)" />
      <rect x="596" y="186" width="52" height="22" rx="11" fill="hsl(268 80% 96%)" />
      <rect x="608" y="195" width="28" height="4" rx="2" fill="hsl(268 50% 62%)" opacity="0.5" />

      <line x1="228" y1="220" x2="228" y2="256" stroke="hsl(268 68% 60%)" strokeWidth="2" strokeDasharray="4 6" opacity="0.25" />

      {/* 步骤 3：待开始 */}
      <circle cx="228" cy="278" r="18" fill="hsl(268 20% 95%)" stroke="hsl(240 8% 88%)" strokeWidth="2.5" />
      <rect x="262" y="264" width="122" height="12" rx="6" fill="hsl(268 20% 88%)" />
      <rect x="262" y="284" width="236" height="9" rx="4.5" fill="hsl(268 20% 93%)" />
      <rect x="596" y="266" width="52" height="22" rx="11" fill="hsl(240 8% 95%)" />

      {/* 进度环 */}
      <g filter="url(#hero-shadow)">
        <circle cx="702" cy="120" r="56" fill="#ffffff" stroke="hsl(240 8% 93%)" />
      </g>
      <circle cx="702" cy="120" r="38" fill="none" stroke="hsl(268 30% 93%)" strokeWidth="9" />
      <circle
        cx="702"
        cy="120"
        r="38"
        fill="none"
        stroke="url(#hero-bar)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="238.8"
        strokeDashoffset="76"
        transform="rotate(-90 702 120)"
      />
      <text
        x="702"
        y="127"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="hsl(240 15% 12%)"
      >
        68%
      </text>

      {/* 目标标签 */}
      <g filter="url(#hero-shadow)">
        <rect x="60" y="150" width="150" height="60" rx="20" fill="#ffffff" stroke="hsl(240 8% 92%)" />
      </g>
      <circle cx="92" cy="180" r="14" fill="hsl(268 80% 96%)" />
      <circle cx="92" cy="180" r="6" fill="hsl(268 68% 60%)" />
      <rect x="116" y="168" width="70" height="10" rx="5" fill="hsl(268 40% 82%)" />
      <rect x="116" y="186" width="46" height="8" rx="4" fill="hsl(268 20% 90%)" />

      {/* 装饰星点 */}
      <path
        d="M742 190l5.5 12.5L760 208l-12.5 5.5L742 226l-5.5-12.5L724 208l12.5-5.5z"
        fill="hsl(268 68% 60%)"
        opacity="0.35"
      />
      <circle cx="140" cy="66" r="7" fill="hsl(32 90% 62%)" opacity="0.6" />
      <circle cx="806" cy="66" r="5" fill="hsl(268 68% 60%)" opacity="0.5" />
    </svg>
  );
}

export default HeroIllustration;
