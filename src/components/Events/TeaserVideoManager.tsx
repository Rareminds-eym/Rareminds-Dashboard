import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, X, Link2, Play, Trash2, Youtube } from 'lucide-react';
import { Label } from '../ui/label';

interface TeaserVideoManagerProps {
  video: string | null;
  onChange: (video: string | null) => void;
  disabled?: boolean;
}

export const TeaserVideoManager: React.FC<TeaserVideoManagerProps> = ({
  video,
  onChange,
  disabled = false
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddVideoUrl = () => {
    const trimmedUrl = newVideoUrl.trim();
    if (trimmedUrl) {
      onChange(trimmedUrl);
      setNewVideoUrl('');
      setIsAddingUrl(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.readAsDataURL(file);
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleRemoveVideo = () => {
    onChange(null);
  };

  const handleCancelAddUrl = () => {
    setNewVideoUrl('');
    setIsAddingUrl(false);
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  return (
    <div className="space-y-4">
      {/* Add Video URL Form */}
      {isAddingUrl && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              Add Video URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Video URL (YouTube or direct video link)
              </Label>
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                disabled={disabled}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAddUrl}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddVideoUrl}
                disabled={disabled || !newVideoUrl.trim()}
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Add Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="hidden"
        disabled={disabled}
      />

      {/* Video Display */}
      {video && (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all duration-300">
            {isYouTubeUrl(video) ? (
              // YouTube Video Preview
              <div className="aspect-video bg-slate-100">
                <div className="relative w-full h-full">
                  {getYouTubeThumbnail(video) && (
                    <img
                      src={getYouTubeThumbnail(video)!}
                      alt="YouTube video thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to standard thumbnail if maxres fails
                        const videoId = getYouTubeVideoId(video);
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <Youtube className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">YouTube Video</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Regular Video Preview
              <div className="aspect-video bg-slate-900">
                <video
                  src={video}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
          
          {/* Remove Button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveVideo}
            disabled={disabled}
            className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Video Info */}
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  {isYouTubeUrl(video) ? 'YouTube Video' : 'Uploaded Video'}
                </span>
              </div>
              {isYouTubeUrl(video) && (
                <a
                  href={video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View on YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!video && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-100 rounded-full">
                <Play className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No teaser video added yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Upload a video file or add a YouTube link to showcase your event
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingUrl(true)}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Youtube className="h-4 w-4 text-red-500" />
                    YouTube Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
