import BusinessLayout from "./components/BusinessLayout";

export default function BusinessRootLayout({ children }: { children: React.ReactNode }) {
  return <BusinessLayout>{children}</BusinessLayout>;
}
