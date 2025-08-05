import { StoryViewer } from "@/components/story/StoryViewer";

interface StoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  return <StoryViewer storyId={id} />;
}