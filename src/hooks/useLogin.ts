import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { type LoginFormValues, loginSchema } from '@/lib/schemas/auth';

export function useLogin() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const res = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    const typed = res as { error?: string } | undefined;
    if (typed?.error) {
      setServerError(typed.error);
      return;
    }

    router.push('/');
  }

  return { form, serverError, onSubmit };
}
