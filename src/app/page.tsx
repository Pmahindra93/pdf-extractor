import FileUpload from '@/components/FileUpload'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black text-white p-6 md:p-24">
      <div className="w-full max-w-5xl">
        <FileUpload />
      </div>
    </main>
  )
}
