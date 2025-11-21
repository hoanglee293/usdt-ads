import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, UserProfile, updateProfile, UpdateProfileRequest } from '@/services/AuthService';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await getProfile();
      return response.user;
    },
    retry: 1,
  });

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error('Failed to fetch profile') : null,
    refetch,
  };
};

interface UseUpdateProfileReturn {
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useUpdateProfile = (): UseUpdateProfileReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      return await updateProfile(data);
    },
    onSuccess: () => {
      // Invalidate and refetch profile after successful update
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    updateProfile: async (data: UpdateProfileRequest) => {
      await mutation.mutateAsync(data);
    },
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : mutation.error ? new Error('Failed to update profile') : null,
  };
};

