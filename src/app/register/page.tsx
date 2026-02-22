'use client';
import { useState } from 'react';

import { Controller } from 'react-hook-form';
import { User, Mail, Lock, Eye, EyeOff, Check, ChefHat } from 'lucide-react';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

import { useRegister } from '../../hooks/useRegister';

/* icons replaced with lucide-react */

const features = [
  'AI-powered recipe suggestions based on your ingredients',
  'Drag-and-drop meal planning calendar',
  'Collaborative shopping lists for your family',
  'Track ingredient freshness and reduce waste',
];

export default function RegisterPage() {
  const { form, serverError, onSubmit } = useRegister();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">
      {/* ── Hero (left) ── */}
      <aside className="hidden md:flex flex-col items-center justify-center p-12 bg-linear-to-br from-amber-400 via-emerald-500 to-emerald-700 text-white">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center">
            <ChefHat size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">Join the Smart Pantry Community</h2>
          <p className="mt-3 text-white/80 text-sm">
            Thousands of home cooks are already reducing food waste and discovering amazing recipes
          </p>
          <ul className="mt-8 space-y-3 text-left">
            {features.map(f => (
              <li
                key={f}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm"
              >
                <span className="shrink-0">
                  <Check size={16} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Form (right) ── */}
      <section className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ChefHat size={20} />
            </div>
            <div>
              <p className="font-semibold text-base leading-none">Smart Pantry</p>
              <p className="text-xs text-muted-foreground">AI Meal Planner</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Start your smart cooking journey today
          </p>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field>
                  <FieldLabel>Full Name</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <User size={16} />
                    </span>
                    <Input
                      className="pl-9"
                      placeholder="John Doe"
                      autoComplete="name"
                      {...register('name')}
                      aria-invalid={!!errors.name}
                    />
                  </div>
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Mail size={16} />
                    </span>
                    <Input
                      className="pl-9"
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  <FieldError errors={[errors.email]} />
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Lock size={16} />
                    </span>
                    <Input
                      className="pl-9 pr-9"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPassword(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </span>
                  </div>
                  <FieldError errors={[errors.password]} />
                </Field>

                <Field>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Lock size={16} />
                    </span>
                    <Input
                      className="pl-9 pr-9"
                      placeholder="••••••••"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowConfirm(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </span>
                  </div>
                  <FieldError errors={[errors.confirmPassword]} />
                </Field>

                {/* Terms */}
                <Field>
                  <div className="flex items-start gap-2">
                    <Controller
                      name="terms"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="terms"
                          className="mt-0.5"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          aria-invalid={!!errors.terms}
                        />
                      )}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
                    >
                      I agree to the{' '}
                      <Link href="#" className="text-emerald-500 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="#" className="text-emerald-500 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  <FieldError errors={[errors.terms]} />
                </Field>

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Creating account…' : 'Create Account'}
                </Button>

                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-input/60" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <hr className="flex-1 border-input/60" />
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full bg-white/5"
                    onClick={() => signIn('google')}
                  >
                    Sign up with Google
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full bg-white/5"
                    onClick={() => signIn('github')}
                  >
                    Sign up with GitHub
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-500 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
