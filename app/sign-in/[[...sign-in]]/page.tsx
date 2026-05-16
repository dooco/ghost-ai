import { SignIn } from "@clerk/nextjs";

import { AuthSidePanel } from "@/components/auth/auth-side-panel";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-bg-base">
      <AuthSidePanel />
      <main className="flex flex-1 lg:w-1/2 items-center justify-center px-6 py-12">
        <SignIn />
      </main>
    </div>
  );
}
