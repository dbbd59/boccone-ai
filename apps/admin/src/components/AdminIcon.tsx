export type AdminIconName =
  | "menu"
  | "close"
  | "overview"
  | "users"
  | "meals"
  | "foods"
  | "review"
  | "nutrition"
  | "audit"
  | "settings"
  | "appearance"
  | "logout"
  | "arrowRight"
  | "calendar";

const PATHS: Record<AdminIconName, string> = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M18 6 6 18",
  overview: "M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-12h6V4h-6v4Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3v6m3-3h-6",
  meals: "M7 3v6m4-6v6m-6-3h8M5 9a6 6 0 0 0 12 0V3M11 15v6m-3 0h6M17 12a3 3 0 1 1 0-6",
  foods: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5",
  review: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  nutrition: "M4 19V5m0 14h16M7 15v-3m4 3V8m4 7V5",
  audit: "M4 5h16v14H4V5Zm4 4h8M8 13h5M8 16h3M7 2v3m10-3v3",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1.5 12h2m17 0h2M4.22 19.78l1.42-1.42m12.72-12.72 1.42-1.42",
  appearance:
    "M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.9 9.9 1.4 1.4M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.9-9.9 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  logout:
    "M10 17l5-5-5-5m5 5H3m9-9V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  calendar: "M5 4h14v16H5V4Zm3-2v4m8-4v4M5 9h14",
};

export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="admin-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
