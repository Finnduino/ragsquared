"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowLeft, CheckCircle2, Scale } from "lucide-react";
import Link from "next/link";

export default function LegislationPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [legislations, setLegislations] = useState<Array<{id: number, filename: string, chunks: number, uploaded_at: string}>>([]);

  useEffect(() => {
    loadLegislations();
  }, []);

  const loadLegislations = async () => {
    try {
      const response = await api.legislation.list();
      setLegislations(response.legislations || []);
    } catch (err) {
      console.error("Failed to load legislations:", err);
    }
  };

  const validateFile = (selectedFile: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 50MB limit");
      return false;
    }
    setFile(selectedFile);
    setError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateFile(droppedFile);
    }
  };

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 10;
        return prev;
      });
    }, 200);

    try {
      await api.legislation.upload(file);

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      // Reload legislations list
      await loadLegislations();

      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setProgress(0);
      }, 2000);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Failed to upload legislation");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Scale className="h-8 w-8" />
          Legislation Documents
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload regulation documents, AMCs, and guidance materials for compliance checking.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Legislation</CardTitle>
          <CardDescription>
            Upload PDF or text files containing regulations, AMCs, or guidance materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="legislation-file"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, TXT (MAX. 50MB)
                  </p>
                </div>
                <input
                  id="legislation-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Legislation uploaded successfully!
                </p>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing and creating embeddings... {progress}%
                </p>
              </div>
            )}

            <Button type="submit" disabled={uploading || !file} className="w-full">
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Legislation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Legislation</CardTitle>
          <CardDescription>
            Previously uploaded regulation documents and guidance materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {legislations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No legislation documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {legislations.map((leg) => (
                <div
                  key={leg.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{leg.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {leg.chunks} chunks • Uploaded {new Date(leg.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

