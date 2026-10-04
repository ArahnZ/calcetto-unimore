import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, match_number, team_a_score, team_b_score, played_at"
    )
    .order("match_number", { ascending: false });

  if (matchesError) {
    return NextResponse.json(
      { error: matchesError.message },
      { status: 500 }
    );
  }

  const matchIds = (matches ?? []).map(
    (match) => match.id
  );

  if (matchIds.length === 0) {
    return NextResponse.json({
      matches: [],
    });
  }

  const {
    data: matchPlayers,
    error: playersError,
  } = await supabase
    .from("match_players")
    .select(
      `
        match_id,
        team,
        goals,
        own_goals,
        player_id,
        players (
          id,
          name,
          nickname
        )
      `
    )
    .in("match_id", matchIds);

  if (playersError) {
    return NextResponse.json(
      { error: playersError.message },
      { status: 500 }
    );
  }

  const result = (matches ?? []).map(
    (match) => ({
      ...match,
      players: (matchPlayers ?? []).filter(
        (player) =>
          player.match_id === match.id
      ),
    })
  );

  return NextResponse.json({
    matches: result,
  });
}