'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from 'sonner'
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
    <div className="w-full max-w-7xl mx-auto">
      {/* Top right button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            onAnalyzeAnother()
            toast.success('Ready for new analysis', {
              description: 'You can now upload another bank statement'
            })
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Analyze Another Statement
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Display */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Original Document</CardTitle>
              <CardDescription>{file.name}</CardDescription>
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
          <Card className="w-full h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Here are the extracted details from the bank statement
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
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
          </Card>
        </div>
      </div>
    </div>
  )
}

