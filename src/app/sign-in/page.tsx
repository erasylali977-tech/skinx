import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center justify-center mb-12 space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 shadow-sm flex items-center justify-center">
            <Icon
              name="face_retouching_natural"
              filled
              className="text-4xl text-primary"
            />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
              SkinX
            </h1>
            <p className="text-base text-gray-500 font-medium">
              Your curated sanctuary for skin health.
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <div className="w-full text-center mt-12 pb-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary font-semibold underline-offset-2"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mt-4">
            By continuing, you agree to SkinX&apos;s{" "}
            <a
              className="text-gray-600 underline decoration-gray-300 underline-offset-2"
              href="#"
            >
              Terms of Use
            </a>{" "}
            and{" "}
            <a
              className="text-gray-600 underline decoration-gray-300 underline-offset-2"
              href="#"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
