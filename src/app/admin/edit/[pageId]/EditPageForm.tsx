
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateLovePage, makePagePermanent } from './actions';
import { useTransition } from 'react';
import { Loader2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';


// Define the schema for the form
const editSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Message is required.'),
  puzzleBackgroundAnimation: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditPageForm({ pageData }: { pageData: any }) {
  const [isPending, startTransition] = useTransition();
  const [isPermanentPending, startPermanentTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: pageData?.title || '',
      message: pageData?.message || '',
      puzzleBackgroundAnimation: pageData?.puzzleBackgroundAnimation || 'none',
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

  const handleMakePermanent = () => {
    startPermanentTransition(async () => {
      const result = await makePagePermanent(pageData.id);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Falha ao Tornar Permanente',
          description: result.error,
        });
      } else {
        toast({
          title: 'Página se tornou permanente!',
          description: 'A página não irá mais expirar.',
        });
        router.refresh(); // Re-fetches server component props and re-renders
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
         <FormField
          control={form.control}
          name="puzzleBackgroundAnimation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puzzle Background Animation (Admin)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an animation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="starry-sky">Starry Sky</SelectItem>
                  <SelectItem value="nebula">Nebula</SelectItem>
                  <SelectItem value="mystic-vortex">Mystic Vortex</SelectItem>
                  <SelectItem value="floating-dots">Floating Dots</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This animation will appear behind the puzzle screen.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4 border-t border-border">
          <Button type="submit" disabled={isPending || isPermanentPending} className="w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Alterações
          </Button>
          {pageData.expireAt && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              onClick={handleMakePermanent}
              disabled={isPending || isPermanentPending}
            >
              {isPermanentPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
              Tornar Permanente
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
