"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player/youtube";

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

  return (
    <div className="relative w-full my-6">
      {hasWindow && (
        <ReactPlayer
          url={url}
          playing={false} // Autoplay é frequentemente bloqueado, então é melhor começar pausado
          controls={true} // Exibe os controles nativos do YouTube, incluindo volume
          width="100%"
          height="100%"
          className="aspect-video"
        />
      )}
    </div>
  );
};

export default YoutubePlayer;
