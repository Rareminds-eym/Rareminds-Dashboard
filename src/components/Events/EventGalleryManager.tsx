import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Upload, X, Link2, Image as ImageIcon } from 'lucide-react';
import { Label } from '../ui/label';

interface EventGalleryManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  minImages?: number;
  maxImages?: number;
}

export const EventGalleryManager: React.FC<EventGalleryManagerProps> = ({
  images,
  onChange,
  disabled = false,
  minImages = 2,
  maxImages = 10
}) => {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImageUrl = () => {
    const trimmedUrl = newImageUrl.trim();
    if (trimmedUrl && !images.includes(trimmedUrl) && images.length < maxImages) {
      onChange([...images, trimmedUrl]);
      setNewImageUrl('');
      setIsAddingUrl(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || images.length >= maxImages) return;

    const fileReaders: Promise<string>[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        fileReaders.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          })
        );
      }
    });

    Promise.all(fileReaders).then((base64Images) => {
      const newImages = base64Images.filter(img => !images.includes(img));
      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    });

    // Reset the file input
    event.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    onChange(updatedImages);
  };

  const handleCancelAddUrl = () => {
    setNewImageUrl('');
    setIsAddingUrl(false);
  };

  const canAddMore = images.length < maxImages;
  const hasMinimumImages = images.length >= minImages;

  return (
    <div className="space-y-4">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        disabled={disabled}
      />

      {/* Add Image URL Form */}
      {isAddingUrl && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm">Add Image URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Image URL</Label>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
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
                onClick={handleAddImageUrl}
                disabled={disabled || !newImageUrl.trim() || images.includes(newImageUrl.trim())}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-100 rounded-full">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No images added yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Add at least {minImages} images to showcase your event
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
                    Upload Images
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingUrl(true)}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Add URLs
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Messages */}
      {!hasMinimumImages && images.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            Please add at least {minImages - images.length} more image{minImages - images.length !== 1 ? 's' : ''} 
            ({images.length}/{minImages} minimum)
          </p>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Maximum number of images reached ({maxImages}/{maxImages})
          </p>
        </div>
      )}
    </div>
  );
};
