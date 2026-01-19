import { useState, useCallback, useMemo } from 'react';

import type { TransactionType, CreateTransactionData } from '@/infrastructure/database';

export interface TransactionFormData {
  accountId: string;
  type: TransactionType;
  amount: string;
  transactionDate: Date;
  categoryId?: string;
  merchant?: string;
  description?: string;
}

export interface TransactionFormErrors {
  accountId?: string;
  type?: string;
  amount?: string;
  transactionDate?: string;
  merchant?: string;
}

interface UseTransactionFormOptions {
  initialData?: Partial<TransactionFormData>;
}

interface UseTransactionFormReturn {
  formData: TransactionFormData;
  errors: TransactionFormErrors;
  isValid: boolean;
  setField: <K extends keyof TransactionFormData>(field: K, value: TransactionFormData[K]) => void;
  setAmount: (value: string) => void;
  validate: () => boolean;
  reset: () => void;
  getCreateData: () => CreateTransactionData | null;
}

const DEFAULT_FORM_DATA: TransactionFormData = {
  accountId: '',
  type: 'expense',
  amount: '',
  transactionDate: new Date(),
  categoryId: undefined,
  merchant: '',
  description: '',
};

export function useTransactionForm(options?: UseTransactionFormOptions): UseTransactionFormReturn {
  const initialData = useMemo(
    () => ({
      ...DEFAULT_FORM_DATA,
      ...options?.initialData,
    }),
    [options?.initialData]
  );

  const [formData, setFormData] = useState<TransactionFormData>(initialData);
  const [errors, setErrors] = useState<TransactionFormErrors>({});

  const setField = useCallback(
    <K extends keyof TransactionFormData>(field: K, value: TransactionFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof TransactionFormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const setAmount = useCallback(
    (value: string) => {
      const cleaned = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, amount: cleaned }));
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: undefined }));
      }
    },
    [errors.amount]
  );

  const validate = useCallback((): boolean => {
    const newErrors: TransactionFormErrors = {};

    if (!formData.accountId) {
      newErrors.accountId = 'Please select an account';
    }

    const amountNum = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Please select a date';
    } else if (formData.transactionDate > new Date()) {
      newErrors.transactionDate = 'Date cannot be in the future';
    }

    if (!formData.merchant?.trim() && !formData.description?.trim()) {
      newErrors.merchant = 'Please enter a merchant or description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  const getCreateData = useCallback((): CreateTransactionData | null => {
    if (!validate()) {
      return null;
    }

    const amountNum = parseFloat(formData.amount);

    return {
      accountId: formData.accountId,
      type: formData.type,
      amount: amountNum,
      transactionDate: formData.transactionDate,
      categoryId: formData.categoryId || undefined,
      merchant: formData.merchant?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    };
  }, [formData, validate]);

  const isValid = useMemo(() => {
    return (
      formData.accountId !== '' &&
      formData.amount !== '' &&
      parseFloat(formData.amount) > 0 &&
      !!(formData.merchant?.trim() || formData.description?.trim())
    );
  }, [formData]);

  return {
    formData,
    errors,
    isValid,
    setField,
    setAmount,
    validate,
    reset,
    getCreateData,
  };
}
