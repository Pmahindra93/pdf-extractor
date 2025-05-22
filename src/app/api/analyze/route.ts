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
3. A list of all transactions with:
   - Date
   - Description
   - Amount
   - Type (debit or credit)
   - Balance after transaction (if available)
4. The starting balance of the statement
5. The ending balance of the statement

Also perform a reconciliation check to verify if the transactions add up correctly to match the difference between starting and ending balance.

Return your analysis as a properly formatted JSON object with the following structure:
{
  "accountHolder": {
    "name": "Full Name",
    "address": "Complete address"
  },
  "documentDate": "Date of the statement",
  "startingBalance": number,
  "endingBalance": number,
  "transactions": [
    {
      "date": "Transaction date",
      "description": "Transaction description",
      "amount": number,
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
      system: "You are a financial document analysis assistant. You extract structured information from bank statements with high accuracy. Always return valid JSON without any explanatory text. Use null for missing values.",
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
    // Find JSON in the response using RegExp.exec() as preferred by ESLint
    const jsonRegex = /\{[\s\S]*\}/
    const jsonMatch = jsonRegex.exec(content)

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response')
    }

    // Parse the JSON with proper type assertion
    const results = JSON.parse(jsonMatch[0]) as BankStatement

    // Additional calculations/validations if needed
    const transactionSum = results.transactions.reduce((sum: number, transaction) => {
      if (transaction.type === 'credit') {
        return sum + transaction.amount
      } else {
        return sum - transaction.amount
      }
    }, 0)

    const calculatedEndingBalance = results.startingBalance + transactionSum
    const isReconciled = Math.abs(calculatedEndingBalance - results.endingBalance) < 0.01 // Allow tiny rounding errors

    // Update reconciliation
    results.reconciliation = {
      calculatedBalance: calculatedEndingBalance,
      isReconciled: isReconciled,
      discrepancy: isReconciled ? undefined : results.endingBalance - calculatedEndingBalance
    }

    return results
  } catch (error) {
    console.error('Error in AI processing:', error)
    throw error
  }
}
