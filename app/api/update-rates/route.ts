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

    const { data: config, error: configError } = await supabase
      .from("exchange_config")
      .select("gbp_sell_margin, gbp_buy_margin")
      .eq("id", 1)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: "Could not load exchange config." },
        { status: 500 }
      );
    }

    const gbpSellMargin = Number(config.gbp_sell_margin);
    const gbpBuyMargin = Number(config.gbp_buy_margin);

    const rafikiGbpToTzs = worldRate * (1 - gbpSellMargin);
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
      return NextResponse.json(
        { error: "Failed to update GBP_TZS rate.", details: gbpError.message },
        { status: 500 }
      );
    }

   