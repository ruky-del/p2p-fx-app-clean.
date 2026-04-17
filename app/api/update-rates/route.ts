import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const rate = 3600; // mfano GBP to TZS

    const { error } = await supabase
      .from("rates")
      .upsert({
        pair: "GBP_TZS",
        rate: rate,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to update GBP_TZS rate.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pair: "GBP_TZS",
      rate,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Unexpected server error.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}