import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET() {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/GBP",
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch live market rate." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const worldRate = data?.rates?.TZS;

    if (!worldRate || typeof worldRate !== "number") {
      return NextResponse.json(
        { error: "Invalid market rate received." },
        { status: 500 }
      );
    }

    // Different margins for each side of the business
    const gbpSellMargin = 0.02; // customer sells GBP to you
    const gbpBuyMargin = 0.04; // customer buys GBP from you

    // GBP -> TZS
    // customer gives you GBP, you pay them TZS
    const rafikiGbpToTzs = worldRate * (1 - gbpSellMargin);

    // TZS -> GBP
    // customer gives you TZS, you give them GBP
    const rafikiTzsToGbp = 1 / (worldRate * (1 + gbpBuyMargin));

    const now = new Date().toISOString();

    const { error: gbpError } = await supabase
      .from("exchange_rates")
      .update({
        base_rate: worldRate,
        rafiki_rate: rafikiGbpToTzs,
        updated_at: now,
      })
      .eq("pair", "GBP_TZS");

    if (gbpError) {
      console.error("GBP_TZS update error:", gbpError);
      return NextResponse.json(
        {
          error: "Failed to update GBP_TZS rate.",
          details: gbpError.message,
          code: gbpError.code,
          hint: gbpError.hint,
        },
        { status: 500 }
      );
    }

    const { error: tzsError } = await supabase
      .from("exchange_rates")
      .update({
        base_rate: 1 / worldRate,
        rafiki_rate: rafikiTzsToGbp,
        updated_at: now,
      })
      .eq("pair", "TZS_GBP");

    if (tzsError) {
      console.error("TZS_GBP update error:", tzsError);
      return NextResponse.json(
        {
          error: "Failed to update TZS_GBP rate.",
          details: tzsError.message,
          code: tzsError.code,
          hint: tzsError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      worldRate,
      rafikiGbpToTzs,
      rafikiTzsToGbp,
      gbpSellMargin,
      gbpBuyMargin,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Update rates route error:", error);
    return NextResponse.json(
      { error: "Something went wrong while updating rates." },
      { status: 500 }
    );
  }
}