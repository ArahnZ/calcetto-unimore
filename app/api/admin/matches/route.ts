import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function authenticate(request: NextRequest) {
  const supabase = getSupabaseFromRequest(request);

  if (!supabase) {
    return {
      supabase: null,
      error: NextResponse.json(
        { error: "Non autenticato." },
        { status: 401 }
      ),
    };
  }

  const authHeader = request.headers.get("authorization")!;
  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      supabase: null,
      error: NextResponse.json(
        { error: "Sessione non valida." },
        { status: 401 }
      ),
    };
  }

  return {
    supabase,
    error: null,
  };
}

export async function GET(request: NextRequest) {
  const { supabase, error } = await authenticate(request);

  if (error || !supabase) {
    return error;
  }

  const { data, error: matchesError } = await supabase
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

  return NextResponse.json({
    matches: data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await authenticate(request);

  if (error || !supabase) {
    return error;
  }

  const body = await request.json();

  const {
    matchNumber,
    matchDate,
    teamAScore,
    teamBScore,
    players,
  } = body;

  if (
    !Number.isInteger(matchNumber) ||
    !Number.isInteger(teamAScore) ||
    !Number.isInteger(teamBScore)
  ) {
    return NextResponse.json(
      { error: "Dati della partita non validi." },
      { status: 400 }
    );
  }

  if (!matchDate) {
    return NextResponse.json(
      { error: "Data della partita mancante." },
      { status: 400 }
    );
  }

  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json(
      { error: "Nessun giocatore selezionato." },
      { status: 400 }
    );
  }

  const matchId = crypto.randomUUID();

  const { error: matchError } = await supabase
    .from("matches")
    .insert({
      id: matchId,
      match_number: matchNumber,
      played_at: `${matchDate}T12:00:00`,
      team_a_score: teamAScore,
      team_b_score: teamBScore,
    });

  if (matchError) {
    return NextResponse.json(
      { error: matchError.message },
      { status: 500 }
    );
  }

  const matchPlayers = players.map(
    (player: {
      playerId: string;
      team: "A" | "B";
      goals: number;
    }) => ({
      match_id: matchId,
      player_id: player.playerId,
      team: player.team,
      goals: player.goals,
    })
  );

  const { error: playersError } = await supabase
    .from("match_players")
    .insert(matchPlayers);

  if (playersError) {
    await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    return NextResponse.json(
      { error: playersError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    matchId,
  });
}

export async function DELETE(request: NextRequest) {
  const { supabase, error } = await authenticate(request);

  if (error || !supabase) {
    return error;
  }

  const body = await request.json();
  const matchId = body.matchId;

  if (!matchId) {
    return NextResponse.json(
      { error: "ID partita mancante." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}