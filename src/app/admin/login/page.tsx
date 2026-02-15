
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAdminSession } from '../admin-auth-actions';
import { useFormState } from 'react-dom';
import { KeyRound } from 'lucide-react';

const initialState = {
  error: '',
};

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(createAdminSession, initialState);

  return (
    <div className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="w-10 h-10 text-primary" />
          </div>
          <CardTitle>Admin Area</CardTitle>
          <CardDescription>Restricted access.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
