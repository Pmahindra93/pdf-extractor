'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react"

import type { BankStatement } from '../types'

interface ResultsProps {
  results: BankStatement
  file: File
  onAnalyzeAnother: () => void
}

export default function Results({ results, file, onAnalyzeAnother }: ResultsProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('')

  useEffect(() => {
    // Create object URL for PDF display
    const url = URL.createObjectURL(file)
    setPdfUrl(url)

    // Cleanup function to revoke object URL
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Analysis Status - Top Right Corner */}
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className="p-4 bg-gray-900/95 border border-gray-700 rounded-lg shadow-lg">
          <div className="space-y-3">
            {/* Analysis Status Message */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                results.reconciliation.isReconciled ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className={`font-medium text-sm ${
                results.reconciliation.isReconciled ? 'text-green-400' : 'text-red-400'
              }`}>
                {results.reconciliation.isReconciled
                  ? 'Analysis Complete - Bank statement is Verified'
                  : 'Analysis Complete - Bank Statement not verified'
                }
              </span>
            </div>

            {/* Transaction Count */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Transactions Found:</span>
              <span className="text-lg font-bold text-white">{results.transactions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Display */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col bg-gray-900 border-gray-700">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white">Original Document</CardTitle>
                <CardDescription className="text-gray-300">{file.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="w-full h-full border-0 rounded-lg overflow-hidden">
                  {pdfUrl && (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full"
                      title="Bank Statement PDF"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            <Card className="w-full h-[600px] flex flex-col bg-gray-900 border-gray-700">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="text-green-400" />
                  Analysis Results
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Here are the extracted details from the bank statement
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">Account Holder</h3>
                    <p className="text-gray-200">{results.accountHolder.name}</p>
                    <p className="text-gray-200 whitespace-pre-line">{results.accountHolder.address}</p>
                  </div>

                  {results.documentDate && (
                    <div>
                      <h3 className="text-lg font-medium text-white">Statement Date</h3>
                      <p className="text-gray-200">{results.documentDate}</p>
                    </div>
                  )}

                  {/* Add Currency Display */}
                  <div>
                    <h3 className="text-lg font-medium text-white">Currency</h3>
                    <p className="text-gray-200">{results.currency}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white">Balance Summary</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-400">Starting Balance</p>
                        <p className="text-lg font-medium text-white">
                          {results.currency} {typeof results.startingBalance === 'number'
                            ? results.startingBalance.toFixed(2)
                            : results.startingBalance}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Ending Balance</p>
                        <p className="text-lg font-medium text-white">
                          {results.currency} {typeof results.endingBalance === 'number'
                            ? results.endingBalance.toFixed(2)
                            : results.endingBalance}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white">Reconciliation</h3>
                    <div className={`mt-2 p-3 rounded-md ${results.reconciliation.isReconciled
                      ? 'bg-green-900/30 border border-green-600'
                      : 'bg-red-900/30 border border-red-600'}`}>
                      {results.reconciliation.isReconciled
                        ? <p className="text-green-300 flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Transactions balance matches ending balance
                          </p>
                        : <p className="text-red-300 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {`Discrepancy found: ${results.currency} ${results.reconciliation.discrepancy?.toFixed(2) ?? 'unknown'}`}
                          </p>
                      }
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white">Transactions</h3>
                    <div className="mt-2 border border-gray-700 rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount ({results.currency})</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                            {results.transactions.some(t => t.balance !== undefined) && (
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Balance ({results.currency})</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                          {results.transactions.map((transaction, index) => (
                            <tr key={index} className="hover:bg-gray-800">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{transaction.date}</td>
                              <td className="px-4 py-2 text-sm text-gray-200">{transaction.description}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200 text-right">
                                {typeof transaction.amount === 'number'
                                  ? transaction.amount.toFixed(2)
                                  : transaction.amount}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${transaction.type === 'credit' ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-red-900/50 text-red-300 border border-red-600'}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              {results.transactions.some(t => t.balance !== undefined) && (
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200 text-right">
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
            </Card>
          </div>
        </div>

        {/* Start Again button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => {
              onAnalyzeAnother()
              console.log('Ready for new analysis - You can now upload another bank statement')
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3"
          >
            <RotateCcw size={18} />
            Start Again
          </Button>
        </div>
      </div>
    </div>
  )
}

