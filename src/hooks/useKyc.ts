import { useMutation } from '@tanstack/react-query';
import { submitKyc, retryKyc, KycSubmitRequest, KycSubmitResponse } from '@/services/AuthService';

interface UseSubmitKycReturn {
  submitKyc: (data: KycSubmitRequest) => Promise<KycSubmitResponse>;
  isLoading: boolean;
  error: Error | null;
}

export const useSubmitKyc = (): UseSubmitKycReturn => {
  const mutation = useMutation({
    mutationFn: async (data: KycSubmitRequest) => {
      console.log('data', data);
      return await submitKyc(data);
    },
  });

  return {
    submitKyc: async (data: KycSubmitRequest) => {
      return await mutation.mutateAsync(data);
    },
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : mutation.error ? new Error('Failed to submit KYC') : null,
  };
};

interface UseRetryKycReturn {
  retryKyc: (data: KycSubmitRequest) => Promise<KycSubmitResponse>;
  isLoading: boolean;
  error: Error | null;
}

export const useRetryKyc = (): UseRetryKycReturn => {
  const mutation = useMutation({
    mutationFn: async (data: KycSubmitRequest) => {
      return await retryKyc(data);
    },
  });

  return {
    retryKyc: async (data: KycSubmitRequest) => {
      return await mutation.mutateAsync(data);
    },
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : mutation.error ? new Error('Failed to retry KYC') : null,
  };
};

