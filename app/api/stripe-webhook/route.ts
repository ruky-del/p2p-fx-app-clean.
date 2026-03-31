import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const creditsToAdd = Number(session.metadata?.credits || 0);

      if (!userId || creditsToAdd <= 0) {
        return NextResponse.json({ received: true });
      }

      const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Profile fetch error:", fetchError.message);
        return new NextResponse("Profile fetch failed", { status: 500 });
      }

      const currentCredits = profile?.credits || 0;

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: currentCredits + creditsToAdd })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError.message);
        return new NextResponse("Profile update failed", { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}