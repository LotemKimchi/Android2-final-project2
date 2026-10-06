import { useRef, useState } from 'react';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${rest}`;
}

/** HTML5 <video> with custom React controls (req #12.i). */
export function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) video.play().catch(() => setError('This video could not be played'));
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seek = (event) => {
    videoRef.current.currentTime = Number(event.target.value);
  };

  const enterFullscreen = () => videoRef.current.requestFullscreen?.();

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onError={() => setError('This video could not be loaded')}
      />
      {error ? (
        <p className="video-player__controls">{error}</p>
      ) : (
        <div className="video-player__controls">
          <button type="button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '❚❚' : '►'}
          </button>
          <input
            className="video-player__seek"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={seek}
            aria-label="Seek"
          />
          <span className="small">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button type="button" onClick={enterFullscreen} aria-label="Full screen">
            ⛶
          </button>
        </div>
      )}
    </div>
  );
}
