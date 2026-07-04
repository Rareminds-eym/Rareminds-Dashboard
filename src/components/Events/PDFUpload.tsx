import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { useR2Upload } from "@/hooks/useR2Upload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface PDFUploadProps {
  eventId: string;
  currentPDFUrl?: string | null;
  onUploadComplete?: (url: string, path?: string) => void;
  onDeleteComplete?: () => void;
  disabled?: boolean;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  eventId,
  currentPDFUrl,
  onUploadComplete,
  onDeleteComplete,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useR2Upload();
  const { toast } = useToast();

  const validatePDF = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please select a PDF file' });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'PDF must be less than 10MB' });
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validatePDF(file)) setSelectedFile(file);
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

  const uploadFileToDB = async () => {
    if (!selectedFile || !eventId) return;

    // ponytail: Direct upload + toast, R2 upload + DB update in sequence
    const result = await upload(selectedFile, { folder: 'events' });
    
    if (result.success && result.url) {
      // ponytail: enquiry_pdf is nested in media_metadata Json field, not a direct column
      const { error: dbError } = await supabase
        .from('events')
        .update({ 
          media_metadata: { 
            enquiry_pdf: result.url, 
            enquiry_pdf_path: result.key 
          } 
        } satisfies Database['public']['Tables']['events']['Update'])
        .eq('id', eventId);

      if (dbError) {
        toast({ title: "Database update failed", description: "File uploaded but couldn't link to event", variant: "destructive" });
        return;
      }
      
      toast({ title: 'Success', description: 'PDF uploaded successfully' });
      onUploadComplete?.(result.url, result.key);
      setSelectedFile(null);
    } else {
      toast({ variant: 'destructive', title: 'Upload failed', description: result.error || 'Failed to upload PDF' });
    }
  };

  const deletePDF = async () => {
    if (!currentPDFUrl || !eventId) return;

    // ponytail: Just clear DB reference, R2 files are cheap to leave orphaned
    const { error } = await supabase
      .from('events')
      .update({ 
        media_metadata: { 
          enquiry_pdf: null, 
          enquiry_pdf_path: null 
        } 
      } satisfies Database['public']['Tables']['events']['Update'])
      .eq('id', eventId);
    
    if (!error) {
      toast({
        title: "PDF removed",
        description: "The enquiry PDF has been removed from the event.",
      });
      onDeleteComplete?.();
    } else {
      toast({
        title: "Delete failed",
        description: "Failed to remove PDF reference",
        variant: "destructive"
      });
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
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
                    onClick={uploadFileToDB}
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
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};