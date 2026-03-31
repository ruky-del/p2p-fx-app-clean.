import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const priceMap: Record<number, { credits: number; label: string }> = {
  2: { credits: 1, label: "1 Credit" },
  5: { credits: 3, label: "3 Credits" },
  15: { credits: 10, label: "10 Credits" },
};

export async function POST(req: Request) {
  try {
    const { amount, userId, email } = await req.json();

    if (!amount || !priceMap[amount]) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User not logged in" }, { status: 401 });
    }

    const pack = priceMap[amount];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: pack.label,
              description: "Unlock seller contact details and continue trading.",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        credits: String(pack.credits),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}