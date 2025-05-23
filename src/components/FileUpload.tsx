'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import type { BankStatement } from '../types'
import Results from './Results'

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

    if (isProcessing) return

    const droppedFile = e.dataTransfer.files?.[0]
    const fileInput = document.getElementById('file-upload') as HTMLInputElement

    if (droppedFile && fileInput) {
      // Create a new FileList-like object and assign it to the input
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(droppedFile)
      fileInput.files = dataTransfer.files

      // Trigger the change event manually
      const event = new Event('change', { bubbles: true })
      fileInput.dispatchEvent(event)
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

      const formData = new FormData()
      formData.append('file', file)

      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
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

      if (errorMessage.includes('appears to be')) {
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
              {/* Hidden file input */}
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
              />

              {/* Drop zone */}
              <label
                htmlFor="file-upload"
                className={`block border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isProcessing
                    ? 'bg-gray-800 border-gray-600 cursor-not-allowed'
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
              </label>

              <div className="mt-4 flex justify-center">
                {!file ? (
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
                    disabled={isProcessing}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select File
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isProcessing}
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
