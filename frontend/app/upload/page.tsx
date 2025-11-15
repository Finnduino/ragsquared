"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [organization, setOrganization] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ...existing code...
  const [legislationFile, setLegislationFile] = useState<File | null>(null);
  const [legislationUploading, setLegislationUploading] = useState(false);
  const [legislationError, setLegislationError] = useState<string | null>(null);
  const [legislationSuccess, setLegislationSuccess] = useState(false);

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

  const handleLegislationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setLegislationError("File size exceeds 50MB limit");
        return;
      }
      setLegislationFile(selectedFile);
      setLegislationError(null);
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
      await api.documents.upload(file, {
        organization: organization || undefined,
        source_type: sourceType,
        description: description || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Failed to upload document");
      setUploading(false);
      setProgress(0);
    }
  };

  // NEW: Handle legislation upload
  const handleLegislationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legislationFile) {
      setLegislationError("Please select a legislation file");
      return;
    }

    setLegislationUploading(true);
    setLegislationError(null);

    try {
      const formData = new FormData();
      formData.append("file", legislationFile);
      const res = await fetch("http://localhost:5000/api/legislation/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setLegislationSuccess(true);
      setLegislationFile(null);
      setTimeout(() => setLegislationSuccess(false), 3000);
    } catch (err: any) {
      setLegislationError(err.message || "Failed to upload legislation");
    } finally {
      setLegislationUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Upload Document</CardTitle>
          <CardDescription>
            Upload a document to start a compliance audit. Supported formats: PDF, DOCX, Markdown, TXT, HTML.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">
                Document File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file"
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
                      PDF, DOCX, MD, TXT, HTML (MAX. 50MB)
                    </p>
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.md,.txt,.html"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="e.g., ACME Corp"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_type">Source Type</Label>
              <select
                id="source_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                disabled={uploading}
              >
                <option value="manual">Manual</option>
                <option value="regulation">Regulation</option>
                <option value="amc">AMC (Acceptable Means of Compliance)</option>
                <option value="gm">GM (Guidance Material)</option>
                <option value="evidence">Evidence</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of the document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={3}
              />
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
                  Document uploaded successfully! Redirecting...
                </p>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading document... {progress}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading || !file} className="flex-1">
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline" disabled={uploading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Your document will be uploaded and stored securely</li>
            <li>An audit will be automatically created and queued</li>
            <li>The document will be processed and chunked for analysis</li>
            <li>The audit will analyze compliance and generate findings</li>
          </ol>
        </CardContent>
      </Card>

      {/* NEW: Legislation Upload Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl">Upload Legislation</CardTitle>
          <CardDescription>
            Upload legislation files to be embedded and indexed for cross-reference during audits. Supported formats: PDF, TXT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLegislationSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="legislation-file">
                Legislation File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="legislation-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border hover:bg-accent transition-colors"
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
                    onChange={handleLegislationFileChange}
                    disabled={legislationUploading}
                  />
                </label>
              </div>
              {legislationFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{legislationFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(legislationFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {legislationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{legislationError}</p>
              </div>
            )}

            {legislationSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Legislation uploaded and embedded successfully!
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={legislationUploading || !legislationFile} className="flex-1 bg-green-600 hover:bg-green-700">
                {legislationUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Embedding...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Embed Legislation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}