import { Workspace } from "@/components/workspace";
import { isWorldGenerationEnabled } from "@/lib/worldlabs/server";

export default function Home() {
  return <Workspace generationEnabled={isWorldGenerationEnabled()} />;
}
