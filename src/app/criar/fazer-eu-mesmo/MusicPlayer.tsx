"use client";

import React from 'react';
import ReactPlayer from 'react-player/youtube';

interface MusicPlayerProps {
  url: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ url }) => {
  // A URL validation can be added here if needed, but react-player handles invalid URLs gracefully.
  const isValidUrl = url && ReactPlayer.canPlay(url);

  if (!isValidUrl) {
    return (
        <div className="w-full aspect-video flex items-center justify-center bg-zinc-800 rounded-lg">
            <p className="text-sm text-muted-foreground">Cole um link válido do YouTube.</p>
        </div>
    );
  }

  return (
    <div className="w-full aspect-video relative">
      <ReactPlayer
        url={url}
        controls={true}
        width="100%"
        height="100%"
        className="absolute top-0 left-0"
      />
    </div>
  );
};

export default MusicPlayer;

    