const BUTTERFLIES = ["one", "two", "three", "four", "five", "six", "seven"] as const;

function Butterfly() {
  return (
    <svg viewBox="0 0 48 36" className="h-full w-full overflow-visible" aria-hidden="true">
      <g className="butterfly-wing butterfly-wing-left">
        <path
          d="M22 18C15 4 3 2 3 10c0 7 9 12 19 11C14 23 9 30 14 33c5 3 9-5 10-13Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </g>
      <g className="butterfly-wing butterfly-wing-right">
        <path
          d="M26 18C33 4 45 2 45 10c0 7-9 12-19 11 8 2 13 9 8 12-5 3-9-5-10-13Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </g>
      <path d="M24 12v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 13c-2-4-5-5-7-5m7 5c2-4 5-5 7-5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function ButterflyBackdrop() {
  return (
    <div className="butterfly-backdrop" aria-hidden="true">
      {BUTTERFLIES.map((name) => (
        <span key={name} className={`butterfly-flight butterfly-flight-${name}`}>
          <span className="butterfly-drift">
            <Butterfly />
          </span>
        </span>
      ))}
    </div>
  );
}