import { Suspense } from "react";
import FileBrowser from "@/components/FileBrowser";
import { Loader2 } from "lucide-react";

function FileBrowserFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-base-content/60">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<FileBrowserFallback />}>
      <FileBrowser />
    </Suspense>
  );
}
