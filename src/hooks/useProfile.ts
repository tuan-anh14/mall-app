import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '@store/authStore';
import {
  userService,
  type UpdateProfileDto,
  type ChangePasswordDto,
} from '@services/userService';
import type { CreateAddressDto, UpdateAddressDto, UpdateSettingsDto } from '@types/profile';
import { QUERY_KEYS } from '@constants/queryKeys';

export const PROFILE_QUERY_KEY   = QUERY_KEYS.profile;
export const ADDRESSES_QUERY_KEY = QUERY_KEYS.addresses;
export const SETTINGS_QUERY_KEY  = QUERY_KEYS.settings;

/** Don't retry on 401 — session is handled by the interceptor */
function noRetryOn401(failureCount: number, error: unknown): boolean {
  if (error instanceof AxiosError && error.response?.status === 401) return false;
  return failureCount < 2;
}

// ─── Individual hooks — only call what you need ─────────────────────────────

export function useProfileQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: userService.getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: noRetryOn401,
  });
}

export function useAddressesQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: userService.getAddresses,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: noRetryOn401,
  });
}

export function useSettingsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: userService.getSettings,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
    retry: noRetryOn401,
  });
}

// ─── Mutation-only hook (no queries fired) ───────────────────────────────────

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileDto) => userService.updateProfile(data),
    onSuccess: (profileUser) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profileUser);
      const authUser = useAuthStore.getState().user;
      if (authUser) setUser({ ...authUser, name: profileUser.name });
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: ChangePasswordDto) => userService.changePassword(data),
  });

  const becomeSeller = useMutation({
    mutationFn: (message?: string) => userService.becomeSellerRequest(message),
    onSuccess: async () => {
      await useAuthStore.getState().hydrate();
    },
  });

  const createAddress = useMutation({
    mutationFn: (data: CreateAddressDto) => userService.createAddress(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }),
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressDto }) =>
      userService.updateAddress(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }),
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }),
  });

  const updateSettings = useMutation({
    mutationFn: (data: UpdateSettingsDto) => userService.updateSettings(data),
    onSuccess: (settings) =>
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings),
  });

  const deleteAccount = useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => useAuthStore.getState().reset(),
  });

  return {
    updateProfile,
    changePassword,
    becomeSeller,
    createAddress,
    updateAddress,
    deleteAddress,
    updateSettings,
    deleteAccount,
  };
}

// ─── Convenience composite hook (backward-compat) ────────────────────────────

export function useProfile() {
  const profileQuery = useProfileQuery();
  const addressesQuery = useAddressesQuery();
  const settingsQuery = useSettingsQuery();
  const mutations = useProfileMutations();

  return {
    profile: profileQuery.data,
    profileLoading: profileQuery.isLoading,
    addresses: addressesQuery.data ?? [],
    addressesLoading: addressesQuery.isLoading,
    settings: settingsQuery.data,
    settingsLoading: settingsQuery.isLoading,
    ...mutations,
  };
}
