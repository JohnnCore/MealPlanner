import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { registerAction } from '@/actions/register/actions';
import { type RegisterFormValues,registerSchema } from '@/lib/schemas/auth';

export function useRegister() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    try {
      const result = await registerAction(values);

      if ('error' in result) {
        setServerError(result.error);
        return;
      }

      // Auto login after register
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInRes?.error) {
        setServerError(signInRes.error);
        return;
      }

      router.push('/');
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  }
  return { form, serverError, onSubmit };
}
