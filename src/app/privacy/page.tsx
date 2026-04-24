import { AppHeader } from "@/components/AppHeader";
import { PrivacyContent } from "./PrivacyContent";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface pb-16">
      <AppHeader back="/account" />
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <PrivacyContent />
      </main>
    </div>
  );
}
