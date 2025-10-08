import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { uploadEventEnquiryPDF, deleteEventEnquiryPDF, validatePDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";

interface PDFUploadProps {
  eventId: string;
  currentPDFUrl?: string | null;
  currentPDFPath?: string | null;
  onUploadComplete?: (url: string, path?: string) => void;
  onDeleteComplete?: () => void;
  disabled?: boolean;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  eventId,
  currentPDFUrl,
  currentPDFPath,
  onUploadComplete,
  onDeleteComplete,
  disabled = false
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Validate the file
    const validation = validatePDF(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const uploadFile = async () => {
    if (!selectedFile || !eventId) return;

    setIsUploading(true);
    setError(null);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await uploadEventEnquiryPDF(selectedFile, eventId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success && result.url) {
        toast({
          title: "PDF uploaded successfully",
          description: "The enquiry PDF has been attached to the event.",
        });
        onUploadComplete?.(result.url, result.path);
        setSelectedFile(null);
      } else {
        setError(result.error || 'Upload failed');
        toast({
          title: "Upload failed",
          description: result.error || 'Failed to upload PDF file',
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deletePDF = async () => {
    if (!currentPDFUrl || !eventId) return;

    try {
      const result = await deleteEventEnquiryPDF(eventId, currentPDFUrl);
      
      if (result.success) {
        toast({
          title: "PDF deleted successfully",
          description: "The enquiry PDF has been removed from the event.",
        });
        onDeleteComplete?.();
      } else {
        toast({
          title: "Delete failed",
          description: result.error || 'Failed to delete PDF file',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPDFFileName = (url: string): string => {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1] || 'enquiry.pdf';
    } catch {
      return 'enquiry.pdf';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Enquiry PDF Document
        </CardTitle>
        <CardDescription>
          Upload a PDF document for event enquiries. Maximum file size: 10MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current PDF Display */}
        {currentPDFUrl && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Current PDF: {getPDFFileName(currentPDFUrl)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentPDFUrl, '_blank')}
                disabled={disabled}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deletePDF}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        {!currentPDFUrl && (
          <>
            {/* Drag & Drop Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isDragging 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={!disabled ? openFileSelector : undefined}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isDragging ? 'Drop PDF file here' : 'Upload PDF File'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag and drop your PDF file here, or click to browse
              </p>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={uploadFile}
                    disabled={isUploading || disabled}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelectedFile}
                    disabled={isUploading || disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};