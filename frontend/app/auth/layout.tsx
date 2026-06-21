import { RecaptchaProvider } from "@/app/components/RecaptchaProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <RecaptchaProvider>{children}</RecaptchaProvider>;
}
