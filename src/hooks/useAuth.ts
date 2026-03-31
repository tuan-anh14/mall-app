import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import {
  authService,
  type LoginDto,
  type RegisterDto,
  type VerifyEmailDto,
} from '@services/authService';

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

  // Register only creates the account — no session is created.
  // After success, navigate to VerifyEmail screen.
  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => authService.register(data),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailDto) => authService.verifyEmail(data),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
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
    verifyEmail: verifyEmailMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    logout: logoutMutation,
  };
}
