import Link from "next/link";
import { SignUpForm } from "./SignUpForm";
import { Icon } from "@/components/Icon";

export default function SignUpPage() {
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center mb-10 space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 shadow-sm flex items-center justify-center">
            <Icon
              name="face_retouching_natural"
              filled
              className="text-4xl text-primary"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Create your account
          </h1>
          <p className="text-base text-gray-500 font-medium text-center">
            Start tracking your skin health in seconds.
          </p>
        </div>
        <SignUpForm />
        <p className="text-xs text-gray-500 mt-8 text-center">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-semibold">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
