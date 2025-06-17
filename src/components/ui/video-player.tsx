import React from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface VideoPlayerProps {
  videoUrls: string[];
  title?: string;
  showTitles?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrls, 
  title = "Project Videos",
  showTitles = true,
  className = ""
}) => {
  if (!videoUrls || videoUrls.length === 0) {
    return null;
  }

  const getVideoEmbedUrl = (url: string): string => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // For other embed URLs, return as is
    return url;
  };

  const getVideoTitle = (url: string, index: number): string => {
    if (videoUrls.length === 1) return title;
    return `${title} ${index + 1}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitles && videoUrls.length > 1 && (
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            {title} ({videoUrls.length} videos)
          </h3>
        </div>
      )}
      
      <div className="space-y-4">
        {videoUrls.map((url, index) => (
          <div key={index} className="relative">
            {showTitles && videoUrls.length > 1 && (
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">
                  Video {index + 1}
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  className="h-8 px-3 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </div>
            )}
            
            <div className="relative overflow-hidden rounded-xl shadow-sm border border-slate-200">
              <iframe
                src={getVideoEmbedUrl(url)}
                title={getVideoTitle(title, index)}
                className="w-full h-64 md:h-80"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;
