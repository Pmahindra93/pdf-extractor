export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
}

export interface BankStatement {
  accountHolder: {
    name: string;
    address: string;
  };
  documentDate?: string;
  currency: string;
  startingBalance: number;
  endingBalance: number;
  transactions: Transaction[];
  reconciliation: {
    calculatedBalance: number;
    isReconciled: boolean;
    discrepancy?: number;
  };
}

// AI Response validation types
export interface ErrorResponse {
  error: string;
}

export type AIResponse = ErrorResponse | BankStatement;

// Type guard function
export function isErrorResponse(response: AIResponse): response is ErrorResponse {
  return 'error' in response;
}
