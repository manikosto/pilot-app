import "./globals.css";

export const metadata = {
  title: "pilot-app",
  description: "Agent Pipeline target codebase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
