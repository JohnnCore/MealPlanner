'use client';
import Link from 'next/link';
import { Controller } from 'react-hook-form';
import { ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { useLogin } from '../../hooks/useLogin';

export default function LoginPage() {
  const { form, serverError, onSubmit } = useLogin();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">
      <section className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <ChefHat size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Welcome back!</h2>
              <p className="text-sm text-muted-foreground">Sign in to continue to your pantry</p>
            </div>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                  />
                  <FieldError errors={[errors.password]} />
                </Field>

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Controller
                      name="remember"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="remember"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                      Remember me for 30 days
                    </Label>
                  </div>
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Signing...' : 'Sign In'}
                </Button>

                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-input/60" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <hr className="flex-1 border-input/60" />
                </div>

                <div className="space-y-2">
                  <Button type="button" variant="ghost" className="w-full bg-white/5">
                    Continue with Google
                  </Button>
                  <Button variant="ghost" className="w-full bg-white/5">
                    Continue with GitHub
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary">
                    Sign up for free
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <aside className="hidden md:flex items-center justify-center p-12 bg-linear-to-br from-emerald-700 via-emerald-600 to-amber-500">
        <div className="max-w-lg text-center text-white">
          <div className="mx-auto mb-6 h-20 w-20 rounded-xl bg-white/10 flex items-center justify-center">
            <ChefHat size={28} className="text-white" />
          </div>
          <h3 className="text-3xl font-semibold">Smart Cooking Starts Here</h3>
          <p className="mt-3 text-muted-foreground">
            Manage your pantry, get AI-powered recipe suggestions, and plan your meals effortlessly
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-sm">Smart Recipes</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-sm">Meal Planning</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-sm">Smart Lists</div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
