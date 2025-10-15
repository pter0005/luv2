"use client";

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward, Radio } from 'lucide-react';

type MusicPlayerCardProps = {
  videoUrl: string;
};

const MusicPlayerCard = ({ videoUrl }: MusicPlayerCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const playerRef = useRef<ReactPlayer>(null);

  const videoIdMatch = videoUrl.match(/(?:v=)([^&]+)/) || videoUrl.match(/(?:youtu.be\/)([^?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://placehold.co/80x80/000000/FFFFFF/png?text=LUV';

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) {
      return '0:00';
    }
    const date = new Date(seconds * 1000);
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const handlePlayPause = () => {
    if (isReady) {
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleProgress = (state: { played: number }) => {
    setPlayed(state.played);
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };

  return (
    <div className="music-player-container">
       <div className="main-music-card">
         <div className="track-info">
           <div className="album-art" style={{ backgroundImage: `url(${thumbnailUrl})` }} />
           <div className="track-details">
             <div className="track-title">Sua Música</div>
             <div className="artist-name">YouTube</div>
           </div>
           <div className={cn("volume-bars", !isPlaying && "paused")}>
             {[...Array(8)].map((_, i) => <div key={i} className="bar" />)}
           </div>
         </div>
         <div className="playback-controls">
           <div className="time-info">
             <span className="current-time">{formatTime(played * duration)}</span>
             <span className="remaining-time">{formatTime(duration)}</span>
           </div>
           <div className="progress-bar-container">
             <input 
                type="range" 
                min={0} 
                max={0.999999} 
                step="any"
                value={played}
                onChange={handleSeekChange}
                className="progress-slider"
             />
           </div>
           <div className="button-row">
             <div className="main-control-btns">
               <button className="control-button" disabled>
                 <SkipBack size={20} />
               </button>
               <div className="play-pause-btns">
                 <button onClick={handlePlayPause} className="control-button play-pause-button" disabled={!isReady}>
                   {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                 </button>
               </div>
               <button className="control-button" disabled>
                 <SkipForward size={20}/>
               </button>
             </div>
             <button className="control-button" disabled>
               <Radio size={20}/>
             </button>
           </div>
         </div>
       </div>

       <div className='hidden'>
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              playing={isPlaying}
              onReady={() => setIsReady(true)}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={() => setIsPlaying(false)}
              width="0"
              height="0"
            />
        </div>
    </div>
  );
};

export default MusicPlayerCard;
