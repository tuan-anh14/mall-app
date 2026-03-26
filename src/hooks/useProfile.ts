import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import {
  userService,
  type UpdateProfileDto,
  type ChangePasswordDto,
} from '@services/userService';

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileDto) => userService.updateProfile(data),
    onSuccess: (user) => setUser(user),
  });

  const changePassword = useMutation({
    mutationFn: (data: ChangePasswordDto) => userService.changePassword(data),
  });

  const becomeSeller = useMutation({
    mutationFn: (message?: string) => userService.becomeSellerRequest(message),
    onSuccess: async () => {
      // Refresh user to get updated sellerRequestStatus
      await useAuthStore.getState().hydrate();
    },
  });

  return { updateProfile, changePassword, becomeSeller };
}
