'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import Results from './Results'
import type { BankStatement } from '../types'

interface ApiError {
  error: string;
}

interface UploadResponse {
  fileId: string;
  message: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<BankStatement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
    setError(null)
    setResults(null)

    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      toast.error('Invalid file type', {
        description: 'Please select a PDF file'
      })
    } else if (selectedFile) {
      toast.success('File selected', {
        description: `${selectedFile.name} ready for analysis`
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
      setError(null)
      setResults(null)
      toast.success('File dropped', {
        description: `${droppedFile.name} ready for analysis`
      })
    } else {
      setError('Please upload a PDF file')
      toast.error('Invalid file type', {
        description: 'Please drop a PDF file'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      toast.error('No file selected', {
        description: 'Please select a PDF file to analyze'
      })
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      toast.error('Invalid file type', {
        description: 'Only PDF files are supported'
      })
      return
    }

    const uploadToastId = toast.loading('Uploading file...', {
      description: 'Please wait while we upload your document'
    })

    try {
      setIsUploading(true)
      setError(null)

      // Upload file using FormData
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json() as ApiError
        throw new Error(errorData.error ?? 'Error uploading file')
      }

      const uploadResult = await uploadResponse.json() as UploadResponse
      const { fileId } = uploadResult

      toast.success('File uploaded successfully', {
        id: uploadToastId,
        description: 'Now analyzing your bank statement...'
      })

      setIsUploading(false)
      setIsProcessing(true)

      const analysisToastId = toast.loading('Analyzing document...', {
        description: 'This may take up to 30 seconds'
      })

      // Analyze the uploaded file
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json() as ApiError
        throw new Error(errorData.error ?? 'Error analyzing file')
      }

      const analysisResults = await analysisResponse.json() as BankStatement
      setResults(analysisResults)

      toast.success('Analysis complete!', {
        id: analysisToastId,
        description: `Found ${analysisResults.transactions.length} transactions`
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Analysis failed', {
        id: uploadToastId,
        description: errorMessage
      })
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  if (results && file) {
    return (
      <Results
        results={results}
        file={file}
        onAnalyzeAnother={() => {
          setFile(null)
          setResults(null)
          setError(null)
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bank Statement Analyzer</CardTitle>
          <CardDescription>
            Upload a bank statement PDF to extract key details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center ${
                isUploading || isProcessing ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-500">Uploading file...</p>
                </div>
              ) : isProcessing ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-500">Analyzing document...</p>
                  <p className="text-xs text-gray-400">This may take up to 30 seconds</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 mb-2">
                    {file ? file.name : 'Drag and drop your PDF here, or click to browse'}
                  </p>
                  {!file && (
                    <p className="text-sm text-gray-500">
                      PDF files only, max 10MB
                    </p>
                  )}
                </>
              )}

              {error && (
                <div className="mt-3 text-red-500 flex items-center justify-center gap-1.5">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isUploading || isProcessing}
              />
            </div>

            <div className="mt-4 flex justify-center">
              {!file ? (
                <Button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading || isProcessing}
                >
                  Select File
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isUploading || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Analyze Statement'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
