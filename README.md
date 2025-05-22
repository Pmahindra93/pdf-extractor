# 🏦 Bank Statement Analyzer

A Next.js application that uses AI to extract and analyze data from PDF bank statements, providing structured information about transactions, balances, and account details.

## ✨ Features

- 📄 **PDF Upload & Processing** - Upload bank statement PDFs with validation
- 👤 **Account Information Extraction** - Automatically extracts account holder name and address
- 📅 **Document Date Detection** - Identifies and parses statement dates
- 💰 **Transaction Analysis** - Lists all transactions with amounts, dates, and descriptions
- 🔍 **Balance Reconciliation** - Shows starting/ending balances and performs accuracy checks
- 🎨 **Clean UI** - Modern, responsive interface built with Tailwind CSS
- 🔄 **Auto Cleanup** - Temporary files are automatically deleted after processing
- 🤖 **AI-Powered** - Uses Anthropic Claude for intelligent document parsing

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 with App Router |
| **API Layer** | Next.js API Routes (REST) |
| **UI Components** | Tailwind CSS + shadcn/ui |
| **Notifications** | Sonner toast library |
| **PDF Processing** | pdf-parse |
| **AI Processing** | Anthropic Claude |
| **Type Safety** | TypeScript throughout |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Anthropic API Key** (get one at [console.anthropic.com](https://console.anthropic.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bank-statement-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   # OR
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage

1. **Upload PDF** - Click "Select File" or drag & drop a bank statement PDF
2. **Wait for Processing** - The AI analyzes the document (usually takes 5-10 seconds)
3. **View Results** - See extracted account information, transactions, and reconciliation

### Supported File Types
- PDF files only
- Maximum file size: 10MB

## 🔌 API Routes

### `POST /api/upload`
Upload a PDF file for processing.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: PDF file

**Response:**
```json
{
  "fileId": "uuid-string",
  "message": "File uploaded successfully"
}
```

### `POST /api/analyze`
Analyze a previously uploaded PDF file.

**Request:**
```json
{
  "fileId": "uuid-string"
}
```

**Response:**
```json
{
  "accountHolder": {
    "name": "John Doe",
    "address": "123 Main St, City, State"
  },
  "documentDate": "2024-01-31",
  "startingBalance": 1000.00,
  "endingBalance": 1250.00,
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "Direct Deposit",
      "amount": 500.00,
      "type": "credit",
      "balance": 1500.00
    }
  ],
  "reconciliation": {
    "calculatedBalance": 1250.00,
    "isReconciled": true,
    "discrepancy": null
  }
}
```

## 📁 Project Structure

```
bank-statement-analyzer/
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   ├── 📂 analyze/
│   │   │   │   └── 📄 route.ts         # PDF analysis endpoint
│   │   │   └── 📂 upload/
│   │   │       └── 📄 route.ts         # File upload endpoint
│   │   ├── 📄 page.tsx                 # Main page component
│   │   ├── 📄 layout.tsx               # Root layout
│   │   └── 📄 globals.css              # Global styles
│   ├── 📂 components/
│   │   ├── 📄 FileUpload.tsx           # Upload component
│   │   └── 📂 ui/                      # shadcn/ui components
│   ├── 📂 types/
│   │   └── 📄 index.ts                 # TypeScript interfaces
│   └── 📂 styles/
│       └── 📄 globals.css              # Tailwind CSS imports
├── 📂 uploads/                         # Temporary file storage
├── 📂 .vscode/                         # VS Code configuration
├── 📄 .env.local                       # Environment variables
├── 📄 next.config.js                   # Next.js configuration
├── 📄 tailwind.config.js               # Tailwind CSS config
├── 📄 package.json                     # Dependencies & scripts
└── 📄 README.md                        # This file
```

## 🏗️ Architecture

```mermaid
graph TD
    A[User uploads PDF] --> B[/api/upload endpoint]
    B --> C[File stored temporarily]
    C --> D[Analysis requested]
    D --> E[/api/analyze endpoint]
    E --> F[PDF text extraction]
    F --> G[AI processing with Claude]
    G --> H[Structured data returned]
    H --> I[UI displays results]
    I --> J[Temporary files cleaned up]
```

### Data Flow

1. **File Upload** - User selects PDF file in browser
2. **Temporary Storage** - File uploaded to `/api/upload` and stored with unique ID
3. **Analysis Request** - Frontend calls `/api/analyze` with file ID
4. **Text Extraction** - PDF converted to text using `pdf-parse`
5. **AI Processing** - Text sent to Anthropic Claude for intelligent parsing
6. **Data Structuring** - AI returns structured JSON with account details and transactions
7. **Reconciliation** - System validates transaction math and balance accuracy
8. **Display** - Results shown in user-friendly format
9. **Cleanup** - Temporary files automatically deleted

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Yes |
| `OPENAI_API_KEY` | Alternative: OpenAI API key | No |

## 🚨 Error Handling

The application includes comprehensive error handling for:

- ❌ Invalid file types (non-PDF)
- ❌ Files exceeding size limits
- ❌ AI processing failures
- ❌ PDF parsing errors
- ❌ Network connectivity issues

## 🔒 Security Features

- ✅ File type validation
- ✅ File size limits
- ✅ Temporary file cleanup
- ✅ API key environment protection
- ✅ Input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Build fails with Babel errors**
- Ensure all dependencies are installed: `npm install`
- Try clearing `.next` folder: `rm -rf .next`

**"Unknown at rule @tailwind" error**
- Install VS Code Tailwind CSS extension
- Reload your editor

**AI processing fails**
- Check your `ANTHROPIC_API_KEY` in `.env.local`
- Ensure API key has sufficient credits

**PDF parsing errors**
- Ensure file is a valid PDF
- Check file isn't password protected
- Verify file size is under 10MB

---

Made with ❤️ using Next.js and Anthropic Claude
