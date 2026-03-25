import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import { authService, type LoginDto, type RegisterDto } from '@services/authService';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const storeLogout = useAuthStore((s) => s.logout);

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (user) => setUser(user),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => authService.register(data),
    onSuccess: (user) => setUser(user),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const logoutMutation = useMutation({
    mutationFn: () => storeLogout(),
  });

  return {
    user,
    isAuthenticated,
    isHydrated,
    login: loginMutation,
    register: registerMutation,
    forgotPassword: forgotPasswordMutation,
    logout: logoutMutation,
  };
}
