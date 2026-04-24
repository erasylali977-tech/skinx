import { AppHeader } from "@/components/AppHeader";
import { TermsContent } from "./TermsContent";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface pb-16">
      <AppHeader back="/account" />
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <TermsContent />
      </main>
    </div>
  );
}
