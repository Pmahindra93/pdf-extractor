'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const [isReady, setIsReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // More robust component readiness detection
  useEffect(() => {
    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, [])

  const triggerFileSelect = useCallback(() => {
    if (fileInputRef.current && isReady) {
      fileInputRef.current.click()
    }
  }, [isReady])

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

      // Better error handling for different error types
      if (errorMessage.includes('appears to be')) {
        // Document type error - more specific messaging
        toast.error('Wrong document type', {
          description: errorMessage,
          duration: 6000,
          action: {
            label: "Try Again",
            onClick: () => {
              setFile(null)
              setError(null)
            }
          }
        })
      } else if (errorMessage.includes('Failed to extract') || errorMessage.includes('Failed to get')) {
        // AI processing error
        toast.error('Document processing failed', {
          description: 'The document could not be processed. Please try a different bank statement.',
          duration: 5000,
          action: {
            label: "Try Again",
            onClick: () => {
              setFile(null)
              setError(null)
            }
          }
        })
      } else {
        // Generic error
        toast.error('Analysis failed', {
          description: errorMessage,
          duration: 4000,
          action: {
            label: "Try Again",
            onClick: () => {
              setFile(null)
              setError(null)
            }
          }
        })
      }

      // Auto-reset after a delay to allow user to try again
      setTimeout(() => {
        setFile(null)
        setError(null)
      }, 2000)

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
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
            AI-Powered Statement Analysis
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your bank statements into structured data in seconds.
            <span className="text-blue-400 font-semibold"> Smart extraction</span> of transactions, balances, and account details with enterprise-grade accuracy.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Secure • In-Memory Processing • No Data Storage</span>
          </div>
        </div>

        <Card className="w-full bg-gray-900 border-gray-700 text-white">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isProcessing
                    ? 'bg-gray-800 border-gray-600'
                    : 'hover:bg-gray-800 border-gray-600 hover:border-gray-500'
                } ${!isReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
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
                  disabled={isProcessing || !isReady}
                  ref={fileInputRef}
                />
              </div>

              <div className="mt-4 flex justify-center">
                {!file ? (
                  <Button
                    type="button"
                    onClick={triggerFileSelect}
                    disabled={isProcessing || !isReady}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
                  >
                    {!isReady ? 'Loading...' : 'Select File'}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isProcessing || !isReady}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 disabled:opacity-50"
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
