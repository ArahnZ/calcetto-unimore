import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, match_number, team_a_score, team_b_score, played_at"
    )
    .order("match_number", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    matches: data ?? [],
  });
}