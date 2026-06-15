import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kodiak Den",
  description: "Your private corner of the internet.",
};

const storageScript = `
(() => {
  try {
    const read = (key) => JSON.parse(window.localStorage.getItem(key) || "null") || {};
    const clean = (value) => {
      const cleaned = String(value || "@kodiak").trim().toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
      return cleaned ? (cleaned.startsWith("@") ? cleaned : "@" + cleaned) : "@kodiak";
    };
    const session = read("kodiak-den-session");
    const account = read("kodiak-den-account");
    const profile = read("kodiak-den-local-profile");
    const handle = clean(session.handle || session.identifier || account.handle || profile.handle || "@kodiak");
    const scopedRoars = window.localStorage.getItem("kodiak-den-roars:" + handle);

    window.localStorage.setItem("kodiak-den-local-roars", scopedRoars || "[]");
    if (session && session.handle !== handle) {
      window.localStorage.setItem("kodiak-den-session", JSON.stringify({ ...session, handle }));
    }
  } catch {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: storageScript }} />
        {children}
      </body>
    </html>
  );
}
