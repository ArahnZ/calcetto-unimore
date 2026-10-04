"use client";

import { useEffect, useState } from "react";

type PlayerStats = {
  id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

type MatchPlayer = {
  match_id: string;
  team: "A" | "B";
  goals: number;
  player_id: string;
  players: {
    id: string;
    name: string;
    nickname: string | null;
  };
};

type Match = {
  id: string;
  match_number: number;
  team_a_score: number;
  team_b_score: number;
  played_at: string;
  players: MatchPlayer[];
};

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadMatches();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch("/api/stats");

      if (!response.ok) {
        throw new Error("Errore caricamento classifica");
      }

      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatches() {
    try {
      const response = await fetch("/api/public/matches");

      if (!response.ok) {
        throw new Error("Errore caricamento partite");
      }

      const data = await response.json();
      setMatches(data.matches ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setMatchesLoading(false);
    }
  }

  // Classifica marcatori:
  // 1. Gol totali
  // 2. Gol per partita
  // 3. Nome alfabetico
  const scorers = [...players].sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }

    const goalsPerMatchA =
      a.matches > 0 ? a.goals / a.matches : 0;

    const goalsPerMatchB =
      b.matches > 0 ? b.goals / b.matches : 0;

    if (goalsPerMatchB !== goalsPerMatchA) {
      return goalsPerMatchB - goalsPerMatchA;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              Calcetto Unimore
            </h1>

            <p className="text-sm text-gray-500">
              Statistiche e classifica
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Login
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* ========================= */}
        {/* CLASSIFICA */}
        {/* ========================= */}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-3xl font-bold">
              Classifica
            </h2>

            <p className="mt-1 text-gray-500">
              La classifica individuale aggiornata dopo ogni partita
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {loading ? (
              <div className="p-6 text-gray-500">
                Caricamento...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-sm text-gray-500">
                    <tr>
                      <th className="px-5 py-4">
                        #
                      </th>

                      <th className="px-5 py-4">
                        Giocatore
                      </th>

                      <th className="px-5 py-4 text-center">
                        PG
                      </th>

                      <th className="px-5 py-4 text-center">
                        V
                      </th>

                      <th className="px-5 py-4 text-center">
                        P
                      </th>

                      <th className="px-5 py-4 text-center">
                        S
                      </th>

                      <th className="px-5 py-4 text-center">
                        Gol
                      </th>

                      <th className="px-5 py-4 text-center">
                        Pt
                      </th>

                      <th className="px-5 py-4 text-center">
                        Pt/PG
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {players.map((player, index) => {
                      const pointsPerMatch =
                        player.matches > 0
                          ? player.points / player.matches
                          : 0;

                      return (
                        <tr
                          key={player.id}
                          className="border-t border-gray-100 transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-bold">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold">
                              {player.name}
                            </div>

                            {player.nickname && (
                              <div className="text-sm text-gray-500">
                                {player.nickname}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            {player.matches}
                          </td>

                          <td className="px-5 py-4 text-center">
                            {player.wins}
                          </td>

                          <td className="px-5 py-4 text-center">
                            {player.draws}
                          </td>

                          <td className="px-5 py-4 text-center">
                            {player.losses}
                          </td>

                          <td className="px-5 py-4 text-center font-semibold">
                            {player.goals}
                          </td>

                          <td className="px-5 py-4 text-center text-lg font-bold">
                            {player.points}
                          </td>

                          <td className="px-5 py-4 text-center font-semibold">
                            {pointsPerMatch.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ========================= */}
        {/* CLASSIFICA MARCATORI */}
        {/* ========================= */}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-3xl font-bold">
              Classifica marcatori
            </h2>

            <p className="mt-1 text-gray-500">
              Gol totali e media gol per partita
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {loading ? (
              <div className="p-6 text-gray-500">
                Caricamento...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-sm text-gray-500">
                    <tr>
                      <th className="px-5 py-4">
                        #
                      </th>

                      <th className="px-5 py-4">
                        Giocatore
                      </th>

                      <th className="px-5 py-4 text-center">
                        PG
                      </th>

                      <th className="px-5 py-4 text-center">
                        Gol
                      </th>

                      <th className="px-5 py-4 text-center">
                        Gol/PG
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {scorers.map((player, index) => {
                      const goalsPerMatch =
                        player.matches > 0
                          ? player.goals / player.matches
                          : 0;

                      return (
                        <tr
                          key={player.id}
                          className="border-t border-gray-100 transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-bold">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold">
                              {player.name}
                            </div>

                            {player.nickname && (
                              <div className="text-sm text-gray-500">
                                {player.nickname}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            {player.matches}
                          </td>

                          <td className="px-5 py-4 text-center text-lg font-bold">
                            {player.goals}
                          </td>

                          <td className="px-5 py-4 text-center font-semibold">
                            {goalsPerMatch.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ========================= */}
        {/* PARTITE */}
        {/* ========================= */}

        <section>
          <div className="mb-5">
            <h2 className="text-3xl font-bold">
              Partite
            </h2>

            <p className="mt-1 text-gray-500">
              Storico delle partite giocate
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {matchesLoading ? (
              <div className="p-6 text-gray-500">
                Caricamento partite...
              </div>
            ) : matches.length === 0 ? (
              <div className="p-6 text-gray-500">
                Nessuna partita giocata.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {matches.map((match) => {
                  const teamAPlayers = match.players.filter(
                    (player) => player.team === "A"
                  );

                  const teamBPlayers = match.players.filter(
                    (player) => player.team === "B"
                  );

                  return (
                    <div
                      key={match.id}
                      className="p-6"
                    >
                      {/* TESTATA PARTITA */}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-500">
                            Partita #{match.match_number}
                          </div>

                          <div className="mt-1 text-sm text-gray-400">
                            {new Date(
                              match.played_at
                            ).toLocaleDateString(
                              "it-IT"
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-lg font-bold">
                          <span>
                            Team A
                          </span>

                          <span className="rounded-xl bg-gray-100 px-5 py-3 text-2xl">
                            {match.team_a_score}

                            <span className="mx-2 text-gray-400">
                              -
                            </span>

                            {match.team_b_score}
                          </span>

                          <span>
                            Team B
                          </span>
                        </div>
                      </div>

                      {/* GIOCATORI */}

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">

                        {/* TEAM A */}

                        <div className="rounded-xl bg-gray-50 p-4">
                          <h3 className="mb-3 font-bold">
                            Team A
                          </h3>

                          <div className="space-y-2">
                            {teamAPlayers.map(
                              (player) => (
                                <div
                                  key={player.player_id}
                                  className="flex items-center justify-between"
                                >
                                  <span>
                                    {player.players.name}
                                  </span>

                                  {player.goals > 0 && (
                                    <span className="font-semibold">
                                      ⚽ {player.goals}
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* TEAM B */}

                        <div className="rounded-xl bg-gray-50 p-4">
                          <h3 className="mb-3 font-bold">
                            Team B
                          </h3>

                          <div className="space-y-2">
                            {teamBPlayers.map(
                              (player) => (
                                <div
                                  key={player.player_id}
                                  className="flex items-center justify-between"
                                >
                                  <span>
                                    {player.players.name}
                                  </span>

                                  {player.goals > 0 && (
                                    <span className="font-semibold">
                                      ⚽ {player.goals}
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}