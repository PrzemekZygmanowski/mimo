import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateCheckInCommand } from "../types";
import { EnergySelector } from "./EnergySelector";
import { MoodSelector } from "./MoodSelector";
import { Button } from "./ui/button";

// Zod schema dla walidacji formularza
const checkInSchema = z.object({
  mood_level: z.number({ required_error: "Wybierz poziom nastroju" }).int().min(1).max(5),
  energy_level: z.number({ required_error: "Wybierz poziom energii" }).int().min(1).max(3),
  notes: z.string().max(500, "Notatki mogą mieć maksymalnie 500 znaków").optional().or(z.literal("")),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInFormProps {
  onSubmit: (data: CreateCheckInCommand) => Promise<void>;
}

export function CheckInForm({ onSubmit }: CheckInFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    mode: "onChange",
    defaultValues: {
      notes: "",
    },
  });

  const onSubmitForm = async (data: CheckInFormData) => {
    const command: CreateCheckInCommand = {
      mood_level: data.mood_level,
      energy_level: data.energy_level,
      notes: data.notes && data.notes.trim() !== "" ? data.notes.trim() : undefined,
    };
    await onSubmit(command);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className='space-y-6 max-w-md w-full'>
      {/* Mood selector */}
      <div className='space-y-2'>
        <Label>Jak się dzisiaj czujesz?</Label>
        <Controller
          name='mood_level'
          control={control}
          render={({ field }) => (
            <MoodSelector selected={field.value} onChange={field.onChange} error={errors.mood_level?.message} />
          )}
        />
      </div>

      {/* Energy selector */}
      <div className='space-y-2'>
        <Label>Jaki jest Twój poziom energii?</Label>
        <Controller
          name='energy_level'
          control={control}
          render={({ field }) => (
            <EnergySelector selected={field.value} onChange={field.onChange} error={errors.energy_level?.message} />
          )}
        />
      </div>

      {/* Notes textarea */}
      <div className='space-y-2'>
        <Label htmlFor='notes'>Notatki (opcjonalnie)</Label>
        <textarea
          id='notes'
          {...register("notes")}
          className='mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none'
          rows={4}
          placeholder='Dodaj swoje notatki...'
        />
        {errors.notes && <p className='text-sm text-destructive'>{errors.notes.message}</p>}
      </div>

      {/* Submit button */}
      <div className='pt-2'>
        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? "Wysyłanie..." : "Wyślij"}
        </Button>
      </div>
    </form>
  );
}
