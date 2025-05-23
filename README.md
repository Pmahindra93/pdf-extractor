# Bank Statement Analyzer

A Next.js application that uses AI to extract and analyze data from PDF bank statements, providing structured information about transactions, balances, and account details.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Anthropic API Key** (get one at [console.anthropic.com](https://console.anthropic.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-extractor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory and the API key here:
   ANTHROPIC_API_KEY=your-anthropic-api-key-here


4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

##  Features

-  **Direct PDF Processing** - Upload bank statement PDFs with instant in-memory processing
- **Document Type Validation** - Automatically detects if uploaded document is a bank statement
-  **Account Information Extraction** - Automatically extracts account holder name and address
-  **Document Date Detection** - Identifies and parses statement dates in DD MMM YYYY format
-  **Transaction Analysis** - Lists all transactions with amounts, dates, and descriptions
-  **Balance Reconciliation** - Shows starting/ending balances and performs accuracy checks
-  **Verification Status** - Smart status indicators showing if bank statement is verified based on reconciliation
-  **Transaction Count Display** - Real-time transaction count in status area
-  **Modern Dark UI** - Professional dark theme with gradient headings and modern design
-  **In-Memory Processing** - No disk storage for enhanced security and speed
-  **AI-Powered** - Uses Anthropic Claude with native PDF document processing
-  **Smart Status Messages** - Top-right corner inline status messages with color-coded feedback
-  **File Removal** - Easy file removal with "×" button for quick file replacement
-  **Auto-Reset on Errors** - Easy recovery from upload mistakes without page refresh

##  Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 with App Router |
| **API Layer** | Next.js API Routes (REST) |
| **UI Components** | Tailwind CSS + shadcn/ui |
| **Notifications** | Inline status messages |
| **PDF Processing** | Anthropic Claude native document processing |
| **AI Processing** | Anthropic Claude Sonnet |
| **Type Safety** | TypeScript throughout |
| **Security** | In-memory processing, no data persistence |

##  Usage

1. **Upload PDF** - Click "Select File" or drag & drop a bank statement PDF
2. **File Management** - Remove selected file with "×" button if you want to choose a different one
3. **Document Validation** - AI automatically verifies it's a bank statement
4. **Wait for Processing** - The AI analyzes the document directly (usually takes 10-20 seconds)
5. **View Results** - See extracted account information, transactions, and reconciliation
6. **Status Monitoring** - Watch real-time status messages in top-right corner with transaction count
7. **Verification Check** - Green status indicates verified bank statement, red indicates discrepancies
8. **Try Again** - If wrong document type, click "Try Again" or wait for auto-reset

### Supported File Types
- PDF files only
- Maximum file size: 10MB
- Bank statements only (other document types will be rejected)

##  API Routes

### `POST /api/analyze`
Directly analyze a PDF file with document type validation.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: PDF file (bank statement)

**Success Response:**
```json
{
  "accountHolder": {
    "name": "John Doe",
    "address": "123 Main St, City, State"
  },
  "documentDate": "22 May 2025",
  "currency": "USD",
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

**Error Response (Wrong Document Type):**
```json
{
  "error": "This appears to be a resume rather than a bank statement. Please upload a bank statement PDF."
}
```

##  Project Structure

```
bank-statement-analyzer/
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   └── 📂 analyze/
│   │   │       └── 📄 route.ts         # Direct PDF analysis endpoint
│   │   ├── 📄 page.tsx                 # Main page component
│   │   ├── 📄 layout.tsx               # Root layout configuration
│   │   └── 📄 globals.css              # Global styles
│   ├── 📂 components/
│   │   ├── 📄 FileUpload.tsx           # Upload component with drag & drop
│   │   ├── 📄 Results.tsx              # Results display component
│   │   └── 📂 ui/                      # shadcn/ui components
│   ├── 📂 types/
│   │   └── 📄 index.ts                 # TypeScript interfaces & type guards
│   └── 📂 styles/
│       └── 📄 globals.css              # Tailwind CSS imports
├── 📄 .env.local                       # Environment variables
├── 📄 next.config.js                   # Next.js configuration
├── 📄 tailwind.config.js               # Tailwind CSS config
├── 📄 package.json                     # Dependencies & scripts
└── 📄 README.md                        # This file
```

##  Architecture

```
    A[User uploads PDF] --> B[/api/analyze endpoint]
    B --> C[Document type validation]
    C --> D{Is bank statement?}
    D -->|No| E[Error: Wrong document type]
    D -->|Yes| F[Anthropic Claude native PDF processing]
    F --> G[AI extracts structured data]
    G --> H[Balance reconciliation]
    H --> I[Results returned to UI]
    I --> J[Display results with PDF preview]
    E --> K[User notified via inline status]
    K --> L[Auto-reset for retry]
```

### Data Flow

1. **Direct File Upload** - User selects PDF file, sent directly to analysis
2. **In-Memory Processing** - File processed entirely in server memory (no disk storage)
3. **Document Type Validation** - AI first checks if document is a bank statement
4. **Native PDF Processing** - Anthropic Claude processes PDF directly (no text extraction step)
5. **AI Analysis** - Claude extracts structured data with high accuracy
6. **Data Validation** - System validates transaction math and balance accuracy
7. **Smart Error Handling** - Context-aware error messages with recovery options
8. **Instant Results** - Data displayed with PDF preview and reconciliation details

##  Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```



##  Error Handling

The application includes comprehensive error handling with smart notifications:

### Document Type Errors
-  **Non-bank statements** → "Wrong document type" with specific document identification
-  **Auto-recovery** → "Try Again" button or 2-second auto-reset

### Processing Errors
-  **Invalid file types** (non-PDF) → Immediate validation with inline status messages
-  **Files exceeding size limits** → 10MB limit with clear messaging
-  **AI processing failures** → Contextual error messages
-  **Network connectivity issues** → Retry suggestions

### User Experience
-  **Inline status messages** → All feedback shown as top-right corner notifications with color coding
-  **Instant feedback** → File selection and drag & drop work immediately
-  **Easy file removal** → "×" button allows quick file replacement without page refresh
-  **Real-time status** → Transaction count and verification status displayed during and after analysis
-  **Easy recovery** → No page refresh needed after errors

##  Security Features

-  **In-memory processing** → No sensitive data stored on disk
-  **Document type validation** → Only bank statements processed
-  **File type validation** → PDF files only
-  **File size limits** → 10MB maximum
-  **API key environment protection** → Secure credential handling
-  **Input sanitization** → All user inputs validated


##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Troubleshooting

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
- Verify you're using a supported Claude model

**PDF processing errors**
- Ensure file is a valid PDF
- Check file isn't password protected
- Verify file size is under 10MB
- Confirm document is actually a bank statement

**File upload not working**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page
- Verify file is a PDF under 10MB

**Status messages not appearing**
- Check browser console for JavaScript errors
- Ensure components are properly hydrated
- Try refreshing the page

---


