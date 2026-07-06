export const metadata = {
  title: "Whoop Dashboard",
  description: "Personal Whoop recovery, sleep, strain, and workout dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0b0b0f",
          color: "#eaeaf0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
