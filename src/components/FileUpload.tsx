'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, AlertCircle, Loader2, X } from "lucide-react"
// Using inline status messages instead of toasts to avoid hydration issues
import type { BankStatement, ErrorResponse } from '../types'
import Results from './Results'

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<BankStatement | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper functions for status messages
  const showStatus = (type: 'success' | 'error' | 'info', message: string, duration = 4000) => {
    setStatusMessage({ type, message })
    if (duration > 0) {
      setTimeout(() => setStatusMessage({ type: null, message: '' }), duration)
    }
  }

  const clearStatus = () => setStatusMessage({ type: null, message: '' })

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setResults(null)
    clearStatus()
    // Clear file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    showStatus('info', 'File removed. You can now select a new file.')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
    setError(null)
    setResults(null)

    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      showStatus('error', 'Invalid file type. Please select a PDF file.')
    } else if (selectedFile) {
      showStatus('success', `File selected: ${selectedFile.name} ready for analysis`)
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
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
      setError(null)
      setResults(null)
      showStatus('success', `File dropped: ${droppedFile.name} ready for analysis`)
    } else {
      setError('Please upload a PDF file')
      showStatus('error', 'Invalid file type. Please drop a PDF file.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      showStatus('error', 'No file selected. Please select a PDF file to analyze.')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      showStatus('error', 'Invalid file type. Only PDF files are supported.')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      showStatus('info', 'Starting analysis... Processing your bank statement directly in memory', 0)

      // Send file directly to analyze endpoint (no separate upload step)
      const formData = new FormData()
      formData.append('file', file)

      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData, // Send file directly
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json() as ErrorResponse
        throw new Error(errorData.error ?? 'Error analyzing file')
      }

      const analysisResults = await analysisResponse.json() as BankStatement

      showStatus('success', `Analysis complete! Found ${analysisResults.transactions.length} transactions`)

      setResults(analysisResults)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)

      // Better error handling for different error types
      if (errorMessage.includes('appears to be')) {
        // Document type error - more specific messaging
        showStatus('error', `Wrong document type: ${errorMessage}`, 6000)
      } else if (errorMessage.includes('Failed to extract') || errorMessage.includes('Failed to get')) {
        // AI processing error
        showStatus('error', 'Document processing failed. The document could not be processed. Please try a different bank statement.', 5000)
      } else {
        // Generic error
        showStatus('error', `Analysis failed: ${errorMessage}`, 4000)
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

  const handleFileSelect = () => {
    if (isProcessing) {
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.click()
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
          // Clear file input value
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
                  {/* Fixed Status Messages - Top Right Corner */}
      {statusMessage.type && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg border shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-green-900/90 border-green-600 text-green-300'
              : statusMessage.type === 'error'
              ? 'bg-red-900/90 border-red-600 text-red-300'
              : 'bg-blue-900/90 border-blue-600 text-blue-300'
          }`}>
            <p className="text-sm font-medium">{statusMessage.message}</p>
          </div>
        </div>
      )}

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
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isProcessing
                    ? 'bg-gray-800 border-gray-600'
                    : 'hover:bg-gray-800 border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleFileSelect}
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
                    {file ? (
                      <div className="relative inline-block">
                        <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 mb-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-200 font-medium">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFile()
                              }}
                              className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700"
                              title="Remove file"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">
                          Ready for analysis, or click the × to remove
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-200 mb-2">
                          Drag and drop your PDF here, or click to browse
                        </p>
                        <p className="text-sm text-gray-400">
                          PDF files only, max 10MB
                        </p>
                      </>
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
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  ref={fileInputRef}
                />
              </div>

              <div className="mt-4 flex justify-center">
                {!file ? (
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
                    onClick={handleFileSelect}
                    disabled={isProcessing}
                  >
                    {!isProcessing ? 'Select File' : 'Processing...'}
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
