import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DEFAULT_THEME, isThemeId, THEME_COOKIE } from "@/lib/themes";
import { SteveDock } from "@/components/steve-dock";
import { gatewayReady } from "@/agent/models";

// Load all three theme fonts up front, self-hosted — switching a theme shouldn't
// re-fetch a font or shift the layout. Each theme just repoints --font-theme at one
// of these vars (see globals.css).
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "st-eve · SE copilot",
  description:
    "An AI sidekick for solutions engineers: turn a patch of accounts into grounded, prioritized decisions ready for Salesforce and Slack.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the theme off the cookie here on the server so the first paint is already
  // the right one — no flash of the default before the client hydrates.
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isThemeId(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geist.variable} ${poppins.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <SteveDock gatewayReady={gatewayReady} />
      </body>
    </html>
  );
}
