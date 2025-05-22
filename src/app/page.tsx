import FileUpload from '@/components/FileUpload'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Bank Statement Analyzer</h1>
          <p className="text-gray-600">
            Upload a bank statement PDF to extract account details, transactions, and balance information
          </p>
        </div>

        <FileUpload />
      </div>
    </main>
  )
}
