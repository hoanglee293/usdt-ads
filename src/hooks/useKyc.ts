import { useMutation, useQuery } from '@tanstack/react-query';
import { submitKyc, retryKyc, getKycStatus, KycSubmitRequest, KycSubmitResponse } from '@/services/AuthService';

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

interface UseKycStatusReturn {
  status: "verify" | "retry" | "pending" | "not-verified" | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useKycStatus = (): UseKycStatusReturn => {
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const response = await getKycStatus();
      return response.status;
    },
    retry: 1,
  });

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    status: data ?? null,
    isLoading,
    error: error instanceof Error ? error : error ? new Error('Failed to fetch KYC status') : null,
    refetch,
  };
};

