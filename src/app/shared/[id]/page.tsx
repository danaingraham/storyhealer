import { StoryViewer } from "@/components/story/StoryViewer";

interface SharedStoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function SharedStoryPage({ params, searchParams }: SharedStoryPageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  
  return (
    <StoryViewer 
      storyId={id} 
      isPublic={true}
      shareToken={token}
    />
  );
}