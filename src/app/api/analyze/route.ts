import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import type { BankStatement, AIResponse } from '../../../types'
import { isErrorResponse } from '../../../types'

// Initialize AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export async function POST(request: NextRequest) {
  try {
    // Check if this is a file upload (multipart)
    const contentType = request.headers.get('content-type') ?? ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }

    // Direct file upload approach
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
    const fileBuffer = Buffer.from(arrayBuffer)

    // Convert buffer to base64 for Anthropic API
    const base64PDF = fileBuffer.toString('base64')

    // Process the PDF directly with AI
    const results = await processWithAI(base64PDF)

    return NextResponse.json(results)

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred')
    console.error('Error analyzing file:', error.message)

    // Check if this is a document type error (should be 400, not 500)
    if (error.message.includes('appears to be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Generic processing error (500)
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: "You are a financial document analysis assistant. First determine if this is a bank statement. If not, return an error. If yes, extract the data accurately.",
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
              text: `Is this a bank statement? If NO, respond with:
{"error": "This appears to be a [document type] rather than a bank statement. Please upload a bank statement PDF."}

If YES, extract this JSON:
{
  "accountHolder": {"name": "Full Name", "address": "Complete address"},
  "documentDate": "DD MMM YYYY format",
  "currency": "Currency code",
  "startingBalance": number,
  "endingBalance": number,
  "transactions": [{"date": "date", "description": "desc", "amount": number, "type": "debit|credit", "balance": number}],
  "reconciliation": {"calculatedBalance": number, "isReconciled": boolean, "discrepancy": number}
}`
            }
          ]
        }
      ],
      temperature: 0,
    })

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

    const parsed = JSON.parse(jsonMatch[0]) as AIResponse

    // Type-safe error check
    if (isErrorResponse(parsed)) {
      throw new Error(parsed.error)
    }

    const results = parsed

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
