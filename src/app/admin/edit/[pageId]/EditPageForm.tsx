
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateLovePage } from './actions';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the schema for the form
const editSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Message is required.'),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditPageForm({ pageData }: { pageData: any }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: pageData?.title || '',
      message: pageData?.message || '',
    },
  });

  const onSubmit = (values: EditFormValues) => {
    startTransition(async () => {
      const result = await updateLovePage(pageData.id, values);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error,
        });
      } else {
        toast({
          title: 'Update Successful',
          description: 'The page has been updated.',
        });
        // The server action will handle the redirect
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Title</FormLabel>
              <FormControl>
                <Input placeholder="For the love of my life" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Love Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your love declaration here..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
