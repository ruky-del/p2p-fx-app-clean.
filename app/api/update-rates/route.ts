import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase environment variables.",
          hasUrl: !!supabaseUrl,
          hasServiceRoleKey: !!supabaseServiceRoleKey,
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const response = await fetch("https://api.exchangerate-api.com/v4/latest/GBP", {
      cache: "no-store",
    });

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
        {
          error: "Failed to update GBP_TZS rate.",
          details: gbpError.message,
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
      return NextResponse.json(
        {
          error: "Failed to update TZS_GBP rate.",
          details: tzsError.message,
        },
        { status: 500 }
      );
    }

    const { error: configUpdateError } = await supabase
      .from("exchange_config")
      .update({ updated_at: now })
      .eq("id", 1);

    if (configUpdateError) {
      return NextResponse.json(
        {
          error: "Failed to update exchange config timestamp.",
          details: configUpdateError.message,
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
  } catch (error: any) {
    console.error("Update rates route error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while updating rates.",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}