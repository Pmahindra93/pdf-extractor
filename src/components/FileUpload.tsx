'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from 'sonner'
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

  if (results) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              Here are the extracted details from the bank statement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Account Holder</h3>
                <p className="text-gray-700">{results.accountHolder.name}</p>
                <p className="text-gray-700 whitespace-pre-line">{results.accountHolder.address}</p>
              </div>

              {results.documentDate && (
                <div>
                  <h3 className="text-lg font-medium">Statement Date</h3>
                  <p className="text-gray-700">{results.documentDate}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium">Balance Summary</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Starting Balance</p>
                    <p className="text-lg font-medium">{typeof results.startingBalance === 'number'
                      ? results.startingBalance.toFixed(2)
                      : results.startingBalance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ending Balance</p>
                    <p className="text-lg font-medium">{typeof results.endingBalance === 'number'
                      ? results.endingBalance.toFixed(2)
                      : results.endingBalance}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Reconciliation</h3>
                <div className={`mt-2 p-3 rounded-md ${results.reconciliation.isReconciled
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'}`}>
                  {results.reconciliation.isReconciled
                    ? <p className="text-green-700 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Transactions balance matches ending balance
                      </p>
                    : <p className="text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {`Discrepancy found: ${results.reconciliation.discrepancy?.toFixed(2) ?? 'unknown'}`}
                      </p>
                  }
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Transactions</h3>
                <div className="mt-2 border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        {results.transactions.some(t => t.balance !== undefined) && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.transactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{transaction.description}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            {typeof transaction.amount === 'number'
                              ? transaction.amount.toFixed(2)
                              : transaction.amount}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {transaction.type}
                            </span>
                          </td>
                          {results.transactions.some(t => t.balance !== undefined) && (
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                              {transaction.balance !== undefined
                                ? (typeof transaction.balance === 'number'
                                    ? transaction.balance.toFixed(2)
                                    : transaction.balance)
                                : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => {
              setFile(null)
              setResults(null)
              setError(null)
              toast.success('Ready for new analysis', {
                description: 'You can now upload another bank statement'
              })
            }}>
              Analyze Another Statement
            </Button>
          </CardFooter>
        </Card>
      </div>
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
