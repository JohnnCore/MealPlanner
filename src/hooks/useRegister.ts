import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { registerAction } from '@/actions/register/actions';

export function useRegister() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

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

    const typed = signInRes as { error?: string } | undefined;

    if (typed?.error) {
      setServerError(typed.error);
      return;
    }

    router.push('/');
  }

  return { form, serverError, onSubmit };
}
