import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Make sure the uploads directory exists
const createUploadsDirectory = async () => {
  try {
    const dirPath = join(process.cwd(), 'uploads')
    await mkdir(dirPath, { recursive: true })
    return dirPath
  } catch (error) {
    console.error('Error creating uploads directory:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate the file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size should not exceed 10MB' },
        { status: 400 }
      )
    }

    // Create a unique ID for the file
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const fileId = uuidv4() as string

    // Create uploads directory if it doesn't exist
    const uploadsDir = await createUploadsDirectory()

    // Generate file path with unique name
    const filePath = join(uploadsDir, `${fileId}.pdf`)

    // Convert the file to an ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save the file to disk
    await writeFile(filePath, buffer)

    // Return the file ID to the client
    return NextResponse.json({ fileId, message: 'File uploaded successfully' })

  } catch (error) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your upload' },
      { status: 500 }
    )
  }
}
