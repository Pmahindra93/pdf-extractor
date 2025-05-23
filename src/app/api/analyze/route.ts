import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import type { BankStatement } from '../../../types'

// Initialize AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export async function POST(request: NextRequest) {
  try {
    // Check if this is a file upload (multipart) or JSON request (legacy)
    const contentType = request.headers.get('content-type') ?? ''

    let fileBuffer: Buffer

    if (contentType.includes('multipart/form-data')) {
      // NEW: Direct file upload approach
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are accepted' },
          { status: 400 }
        )
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size should not exceed 10MB' },
          { status: 400 }
        )
      }

      // Convert file to buffer (in-memory processing)
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)

    } else {
      // LEGACY: JSON request with fileId (keeping for backwards compatibility)
      const body = await request.json() as { fileId?: string }
      const { fileId } = body

      if (!fileId) {
        return NextResponse.json(
          { error: 'No fileId provided' },
          { status: 400 }
        )
      }

      // This is the old disk-based approach
      const fs = await import('fs/promises')
      const path = await import('path')

      const filePath = path.join(process.cwd(), 'uploads', `${fileId}.pdf`)
      fileBuffer = await fs.readFile(filePath)

      // Clean up the file
      try {
        await fs.unlink(filePath)
      } catch (cleanupError) {
        console.error('Error deleting file:', cleanupError)
      }
    }

    // Convert buffer to base64 for Anthropic API
    const base64PDF = fileBuffer.toString('base64')

    // Process the PDF directly with AI (no pdf-parse needed!)
    const results = await processWithAI(base64PDF)

    return NextResponse.json(results)

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred')
    console.error('Error analyzing file:', error.message)
    return NextResponse.json(
      { error: 'An error occurred while analyzing the file' },
      { status: 500 }
    )
  }
}

// Function to process PDF directly with AI
async function processWithAI(base64PDF: string): Promise<BankStatement> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Using faster Sonnet model
      max_tokens: 4000,
      system: "You are a financial document analysis assistant. Extract structured information from bank statements with high accuracy. Always return valid JSON without explanatory text. Use null for missing values. CRITICAL: Always extract transaction amounts as positive numbers and use the type field to indicate debit/credit.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                data: base64PDF,
                media_type: 'application/pdf'
              }
            },
            {
              type: 'text',
              text: `Analyze this bank statement PDF and extract the following information in JSON format:

{
  "accountHolder": {
    "name": "Full Name",
    "address": "Complete address"
  },
  "documentDate": "Date of the statement in format 'DD MMM YYYY' (e.g., '22 May 2025')",
  "currency": "Currency code (e.g., USD, EUR, GBP) or symbol (e.g., $, €, £)",
  "startingBalance": number,
  "endingBalance": number,
  "transactions": [
    {
      "date": "Transaction date",
      "description": "Transaction description",
      "amount": number (ALWAYS positive),
      "type": "debit" or "credit",
      "balance": number (optional)
    }
  ],
  "reconciliation": {
    "calculatedBalance": number,
    "isReconciled": boolean,
    "discrepancy": number (if not reconciled)
  }
}

IMPORTANT: For transaction amounts, always extract the absolute value (positive number) and use the "type" field to indicate if it's a debit or credit.`
            }
          ]
        }
      ],
      temperature: 0,
    })

    // Extract JSON from the response
    const firstContent = response.content[0]
    if (!firstContent || firstContent.type !== 'text') {
      throw new Error('Failed to get text response from AI')
    }

    const content = firstContent.text
    const jsonRegex = /\{[\s\S]*\}/
    const jsonMatch = jsonRegex.exec(content)

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response')
    }

    // Parse the JSON with proper type assertion
    const results = JSON.parse(jsonMatch[0]) as BankStatement

    // Ensure currency field exists, default to USD if not found
    if (!results.currency) {
      results.currency = 'USD'
    }

    // Normalize and validate transaction amounts (keep existing logic)
    const normalizedTransactions = results.transactions.map((transaction) => {
      const normalizedAmount = Math.abs(transaction.amount)
      return { ...transaction, amount: normalizedAmount }
    })

    // Calculate reconciliation (keep existing logic)
    const netChange = normalizedTransactions.reduce((sum: number, transaction) => {
      if (transaction.type === 'credit') {
        return sum + transaction.amount
      } else if (transaction.type === 'debit') {
        return sum - transaction.amount
      } else {
        return sum
      }
    }, 0)

    const calculatedEndingBalance = results.startingBalance + netChange
    const discrepancy = results.endingBalance - calculatedEndingBalance
    const isReconciled = Math.abs(discrepancy) < 0.01

    results.transactions = normalizedTransactions
    results.reconciliation = {
      calculatedBalance: calculatedEndingBalance,
      isReconciled: isReconciled,
      discrepancy: isReconciled ? undefined : discrepancy
    }

    return results
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error in AI processing'
    console.error('Error in AI processing:', error)
    throw new Error(error)
  }
}
