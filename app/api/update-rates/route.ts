import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function GET() {
  try {
    const response = await fetch(
  "https://open.er-api.com/v6/latest/GBP",
  { cache: "no-store" }
);

if (!response.ok) {
  return NextResponse.json(
    { error: "Failed to fetch live market rate." },
    { status: 500 }
  );
}

const data = await response.json();
console.log("FULL API RESPONSE:", data);
const worldRate = data.rates.TZS;

if (!worldRate || typeof worldRate !== "number") {
  console.error("Rate API response:", data);
  return NextResponse.json(
    { error: "Invalid market rate received." },
    { status: 500 }
  );
}

    // Change this margin whenever you want
    const margin = 0.02; // 2%

    // GBP -> TZS
    const rafikiGbpToTzs = worldRate * (1 + margin);

    // TZS -> GBP
    const worldTzsToGbp = 1 / worldRate;
    const rafikiTzsToGbp = 1 / rafikiGbpToTzs;

    const { error: gbpError } = await supabase
      .from("exchange_rates")
      .update({
        base_rate: worldRate,
        rafiki_rate: rafikiGbpToTzs,
        updated_at: new Date().toISOString(),
      })
      .eq("pair", "GBP_TZS");

    if (gbpError) {
      console.error("GBP_TZS update error:", gbpError);
      return NextResponse.json(
        { error: "Failed to update GBP_TZS rate." },
        { status: 500 }
      );
    }

    const { error: tzsError } = await supabase
      .from("exchange_rates")
      .update({
        base_rate: worldTzsToGbp,
        rafiki_rate: rafikiTzsToGbp,
        updated_at: new Date().toISOString(),
      })
      .eq("pair", "TZS_GBP");

    if (tzsError) {
      console.error("TZS_GBP update error:", tzsError);
      return NextResponse.json(
        { error: "Failed to update TZS_GBP rate." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      worldRate,
      rafikiGbpToTzs,
      rafikiTzsToGbp,
      margin,
    });
  } catch (error) {
    console.error("Update rates route error:", error);
    return NextResponse.json(
      { error: "Something went wrong while updating rates." },
      { status: 500 }
    );
  }
}