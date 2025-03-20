import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>DeepSeek AI Chat</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
