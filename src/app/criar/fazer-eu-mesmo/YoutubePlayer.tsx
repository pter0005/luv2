"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import { Skeleton } from "@/components/ui/skeleton";

interface YoutubePlayerProps {
  url: string;
}

const YoutubePlayer = ({ url }: YoutubePlayerProps) => {
  const [hasWindow, setHasWindow] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);

  if (!hasWindow) {
    return <Skeleton className="w-full aspect-video rounded-lg" />;
  }

  return (
    <div className="relative w-full my-6 rounded-lg overflow-hidden shadow-lg shadow-primary/50">
      <div className="aspect-video">
        <ReactPlayer
          url={url}
          playing={false}
          controls={true}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};

export default YoutubePlayer;
