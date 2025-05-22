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
  startingBalance: number;
  endingBalance: number;
  transactions: Transaction[];
  reconciliation: {
    calculatedBalance: number;
    isReconciled: boolean;
    discrepancy?: number;
  };
}
