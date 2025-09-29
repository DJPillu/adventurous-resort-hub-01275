import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookingFormData, FormSchema } from "./booking/types";
import { PersonalInfoFields } from "./booking/PersonalInfoFields";
import { GuestCountFields } from "./booking/GuestCountFields";
import { DateFields } from "./booking/DateFields";
import { useNavigate } from 'react-router-dom';

interface BookingFormProps {
  onSubmit: (values: BookingFormData) => void;
}

export function BookingForm({ onSubmit }: BookingFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      adults: "1",
      children: "0",
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
  });

  const handleFormSubmit = async (values: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const bookingReference = `BK${Date.now().toString().slice(-6)}`;
      
      // Save booking to database
      const { data: booking, error: dbError } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingReference,
          name: values.name,
          email: values.email,
          phone: values.phone,
          adults: parseInt(values.adults),
          children: parseInt(values.children),
          check_in_date: values.checkInDate.toISOString().split('T')[0],
          check_out_date: values.checkOutDate.toISOString().split('T')[0],
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Pass booking data to parent component
      onSubmit({ ...values, bookingReference, bookingId: booking.id });
      form.reset();
      
      toast({
        title: "Booking Submitted",
        description: `Your booking reference is ${bookingReference}`,
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: "There was a problem processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <PersonalInfoFields form={form} />
        <GuestCountFields form={form} />
        <DateFields form={form} />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Book Now"
          )}
        </Button>
      </form>
    </Form>
  );
}
