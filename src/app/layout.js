import { Inter } from "next/font/google";
import "./globals.css";
import SessionChecker from "../components/SessionChecker";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ProcuTrack",
  description: "CAPEX/OPEX Budget Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionChecker>
          {children}
        </SessionChecker>
      </body>
    </html>
  );
}