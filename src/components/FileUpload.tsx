'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import Results from './Results'
import type { BankStatement } from '../types'

interface ApiError {
  error: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
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

    try {
      setIsProcessing(true)
      setError(null)

      toast.success('Starting analysis...', {
        description: 'Processing your bank statement directly in memory'
      })

      // Send file directly to analyze endpoint (no separate upload step)
      const formData = new FormData()
      formData.append('file', file)

      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData, // Send file directly
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json() as ApiError
        throw new Error(errorData.error ?? 'Error analyzing file')
      }

      const analysisResults = await analysisResponse.json() as BankStatement

      toast.success('Analysis complete!', {
        description: `Found ${analysisResults.transactions.length} transactions`
      })

      setResults(analysisResults)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Analysis failed', {
        description: errorMessage
      })
    } finally {
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
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-2xl mx-auto pt-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Bank Statement Analyzer</h1>
          <p className="text-gray-300">
            Upload a bank statement PDF to extract account details, transactions, and balance information
          </p>
        </div>

        <Card className="w-full bg-gray-900 border-gray-700 text-white">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isProcessing
                    ? 'bg-gray-800 border-gray-600'
                    : 'hover:bg-gray-800 border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto" />
                      <p className="text-gray-300">Analyzing document...</p>
                    <p className="text-xs text-gray-400">This may take up to 30 seconds</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-200 mb-2">
                      {file ? file.name : 'Drag and drop your PDF here, or click to browse'}
                    </p>
                    {!file && (
                        <p className="text-sm text-gray-400">
                        PDF files only, max 10MB
                      </p>
                    )}
                  </>
                )}

                {error && (
                    <div className="mt-3 text-red-400 flex items-center justify-center gap-1.5">
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
                  disabled={isProcessing}
                />
              </div>

              <div className="mt-4 flex justify-center">
                {!file ? (
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Select File
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  >
                    {isProcessing ? 'Processing...' : 'Analyze Statement'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
