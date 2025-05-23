import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { Anthropic } from '@anthropic-ai/sdk'
import pdfParse from 'pdf-parse'
import type { BankStatement } from '../../../types'

// Initialize AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '', // Set this in your .env.local file
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { fileId?: string }
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { error: 'No fileId provided' },
        { status: 400 }
      )
    }

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', `${fileId}.pdf`)

    // Read the file
    const fileBuffer = await readFile(filePath)

    // Parse the PDF - suppress ESLint warning for external library typing issue
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const pdfData = await pdfParse(fileBuffer) as { text: string }

    // Extract the text
    const textContent = pdfData.text

    // Process the text using AI
    const results = await processWithAI(textContent)

    // Clean up - delete the file after processing
    try {
      await unlink(filePath)
    } catch (cleanupError) {
      console.error('Error deleting file:', cleanupError)
      // Continue even if cleanup fails
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error analyzing file:', error)
    return NextResponse.json(
      { error: 'An error occurred while analyzing the file' },
      { status: 500 }
    )
  }
}

// Function to process text with AI
async function processWithAI(textContent: string): Promise<BankStatement> {
  try {
    const prompt = `
You are a financial document analysis AI specializing in banking statements. I will provide you with the text extracted from a PDF bank statement. Please analyze it and extract the following information in a structured JSON format:

1. Name and address of the account holder
2. Date of the document (if present)
3. Currency of the statement (look for currency symbols like $, €, £, ¥ or currency codes like USD, EUR, GBP, JPY)
4. A list of all transactions with:
   - Date
   - Description
   - Amount (ALWAYS as a positive number, regardless of debit/credit)
   - Type (debit or credit)
   - Balance after transaction (if available)
5. The starting balance of the statement
6. The ending balance of the statement

IMPORTANT: For transaction amounts, always extract the absolute value (positive number) and use the "type" field to indicate if it's a debit or credit. For example:
- A $100 withdrawal should be: {"amount": 100, "type": "debit"}
- A $50 deposit should be: {"amount": 50, "type": "credit"}

Return your analysis as a properly formatted JSON object with the following structure:
{
  "accountHolder": {
    "name": "Full Name",
    "address": "Complete address"
  },
  "documentDate": "Date of the statement",
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

Here is the bank statement text content:
${textContent}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: "You are a financial document analysis assistant. You extract structured information from bank statements with high accuracy. Always return valid JSON without any explanatory text. Use null for missing values. CRITICAL: Always extract transaction amounts as positive numbers and use the type field to indicate debit/credit.",
      messages: [
        { role: 'user', content: prompt }
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

    // Normalize and validate transaction amounts
    const normalizedTransactions = results.transactions.map((transaction) => {
      // Ensure amounts are always positive (take absolute value)
      const normalizedAmount = Math.abs(transaction.amount)

      return {
        ...transaction,
        amount: normalizedAmount
      }
    })

    // Calculate the net change from transactions
    const netChange = normalizedTransactions.reduce((sum: number, transaction) => {
      if (transaction.type === 'credit') {
        // Credits increase the balance
        return sum + transaction.amount
      } else if (transaction.type === 'debit') {
        // Debits decrease the balance
        return sum - transaction.amount
      } else {
        // Skip unknown transaction types silently
        return sum
      }
    }, 0)

    // Calculate what the ending balance should be
    const calculatedEndingBalance = results.startingBalance + netChange

    // Check if reconciled (allow for small rounding errors)
    const discrepancy = results.endingBalance - calculatedEndingBalance
    const isReconciled = Math.abs(discrepancy) < 0.01

    // Update the transactions in results with normalized amounts
    results.transactions = normalizedTransactions

    // Update reconciliation with correct calculations
    results.reconciliation = {
      calculatedBalance: calculatedEndingBalance,
      isReconciled: isReconciled,
      discrepancy: isReconciled ? undefined : discrepancy
    }

    return results
  } catch (error) {
    console.error('Error in AI processing:', error)
    throw error
  }
}
