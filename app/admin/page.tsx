"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  name: string;
  nickname: string | null;
};

type Match = {
  id: string;
  match_number: number;
  team_a_score: number;
  team_b_score: number;
  played_at: string;
};

export default function AdminPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [matchNumber, setMatchNumber] = useState("");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");

  const [selectedPlayers, setSelectedPlayers] = useState<
    Record<string, "A" | "B">
  >({});

  const [goals, setGoals] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);

        if (currentSession) {
          loadPlayers();
          loadMatches();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);

      if (currentSession) {
        await Promise.all([
          loadPlayers(),
          loadMatches(),
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSessionChecked(true);
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setLoginError(
          "Email o password non corretti."
        );
        return;
      }

      setSession(data.session);

      await Promise.all([
        loadPlayers(),
        loadMatches(),
      ]);
    } catch (err) {
      console.error(err);
      setLoginError(
        "Errore durante il login."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadPlayers() {
    try {
      const response = await fetch("/api/players");

      if (!response.ok) {
        setError(
          "Errore nel caricamento dei giocatori."
        );
        return;
      }

      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      console.error(err);
      setError(
        "Errore nel caricamento dei giocatori."
      );
    }
  }

  async function loadMatches() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/admin/matches",
        {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }
      );

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        setError(
          `Risposta API non valida. Status: ${response.status}.`
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(
          `Errore caricamento partite (${response.status}): ${
            data.error ?? "Errore sconosciuto"
          }`
        );

        setLoading(false);
        return;
      }

      setMatches(data.matches ?? []);
    } catch (err) {
      console.error(
        "Errore loadMatches:",
        err
      );

      setError(
        "Errore durante il caricamento delle partite."
      );
    } finally {
      setLoading(false);
    }
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayers((current) => {
      const copy = { ...current };

      if (copy[playerId]) {
        delete copy[playerId];
      } else {
        copy[playerId] = "A";
      }

      return copy;
    });
  }

  function changeTeam(
    playerId: string,
    team: "A" | "B"
  ) {
    setSelectedPlayers((current) => ({
      ...current,
      [playerId]: team,
    }));
  }

  function changeGoals(
    playerId: string,
    value: string
  ) {
    const number = Number(value);

    setGoals((current) => ({
      ...current,
      [playerId]: Number.isNaN(number)
        ? 0
        : number,
    }));
  }

  async function handleSave() {
    setError("");
    setMessage("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession) {
      setError("Sessione non trovata.");
      return;
    }

    const parsedMatchNumber =
      Number(matchNumber);

    const parsedTeamAScore =
      Number(teamAScore);

    const parsedTeamBScore =
      Number(teamBScore);

    if (
      !Number.isInteger(parsedMatchNumber) ||
      !Number.isInteger(parsedTeamAScore) ||
      !Number.isInteger(parsedTeamBScore)
    ) {
      setError(
        "Inserisci numero partita e risultati validi."
      );
      return;
    }

    const selectedIds =
      Object.keys(selectedPlayers);

    if (selectedIds.length === 0) {
      setError(
        "Seleziona almeno un giocatore."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/matches",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({
            matchNumber:
              parsedMatchNumber,
            teamAScore:
              parsedTeamAScore,
            teamBScore:
              parsedTeamBScore,
            players: selectedIds.map(
              (playerId) => ({
                playerId,
                team:
                  selectedPlayers[
                    playerId
                  ],
                goals:
                  goals[playerId] ?? 0,
              })
            ),
          }),
        }
      );

      const responseText =
        await response.text();

      let data;

      try {
        data = JSON.parse(
          responseText
        );
      } catch {
        setError(
          `Risposta API non valida. Status: ${response.status}.`
        );
        setSaving(false);
        return;
      }

      if (!response.ok) {
        setError(
          data.error ??
            "Errore durante il salvataggio."
        );
        setSaving(false);
        return;
      }

      setMessage(
        `Partita #${parsedMatchNumber} salvata correttamente!`
      );

      setMatchNumber("");
      setTeamAScore("");
      setTeamBScore("");
      setSelectedPlayers({});
      setGoals({});

      await loadMatches();
    } catch (err) {
      console.error(err);

      setError(
        "Errore durante il salvataggio della partita."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    matchId: string,
    matchNumber: number
  ) {
    const confirmed =
      window.confirm(
        `Vuoi davvero eliminare la partita #${matchNumber}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession) {
      setError(
        "Sessione non trovata."
      );
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/matches",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({
            matchId,
          }),
        }
      );

      const responseText =
        await response.text();

      let data;

      try {
        data = JSON.parse(
          responseText
        );
      } catch {
        setError(
          `Risposta API non valida. Status: ${response.status}.`
        );
        return;
      }

      if (!response.ok) {
        setError(
          data.error ??
            "Errore durante l'eliminazione."
        );
        return;
      }

      setMessage(
        `Partita #${matchNumber} eliminata.`
      );

      await loadMatches();
    } catch (err) {
      console.error(err);

      setError(
        "Errore durante l'eliminazione della partita."
      );
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setSession(null);
    setPlayers([]);
    setMatches([]);
  }

  if (!sessionChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-gray-900">
        <div className="text-gray-500">
          Caricamento...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-gray-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              Calcetto Unimore
            </h1>

            <p className="mt-2 text-gray-500">
              Accesso amministratore
            </p>
          </div>

          {loginError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loginError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleLogin();
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-800"
                placeholder="La tua email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleLogin();
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-800"
                placeholder="La tua password"
                autoComplete="current-password"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={
                loginLoading ||
                !email ||
                !password
              }
              className="w-full rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginLoading
                ? "Accesso..."
                : "Accedi"}
            </button>
          </div>

          <button
            onClick={() =>
              (window.location.href = "/")
            }
            className="mt-5 w-full text-sm text-gray-500 hover:text-gray-900"
          >
            ← Torna alla home
          </button>
        </div>
      </main>
    );
  }

  if (loading && players.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">
            Caricamento...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Admin
            </h1>

            <p className="mt-2 text-gray-600">
              Gestione partite di Calcetto Unimore
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Esci
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold">
              Partite salvate
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="p-6 text-gray-500">
              {loading
                ? "Caricamento partite..."
                : "Nessuna partita salvata."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-6"
                >
                  <div>
                    <div className="font-bold">
                      Partita #
                      {match.match_number}
                    </div>

                    <div className="mt-1 text-gray-600">
                      Team A{" "}
                      {match.team_a_score}{" "}
                      -{" "}
                      {match.team_b_score}{" "}
                      Team B
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      {new Date(
                        match.played_at
                      ).toLocaleString(
                        "it-IT"
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(
                        match.id,
                        match.match_number
                      )
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Elimina
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold">
              Inserisci partita
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Seleziona i giocatori,
              assegna il team e inserisci i
              gol.
            </p>
          </div>

          <div className="space-y-8 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Numero partita
                </label>

                <input
                  type="number"
                  value={matchNumber}
                  onChange={(e) =>
                    setMatchNumber(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-800"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Gol Team A
                </label>

                <input
                  type="number"
                  min="0"
                  value={teamAScore}
                  onChange={(e) =>
                    setTeamAScore(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-800"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Gol Team B
                </label>

                <input
                  type="number"
                  min="0"
                  value={teamBScore}
                  onChange={(e) =>
                    setTeamBScore(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-800"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-bold">
                Giocatori
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-sm text-gray-500">
                    <tr>
                      <th className="px-4 py-3">
                        Seleziona
                      </th>
                      <th className="px-4 py-3">
                        Giocatore
                      </th>
                      <th className="px-4 py-3">
                        Team
                      </th>
                      <th className="px-4 py-3">
                        Gol
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {players.map(
                      (player) => {
                        const selected =
                          selectedPlayers[
                            player.id
                          ];

                        return (
                          <tr
                            key={
                              player.id
                            }
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  selected
                                )}
                                onChange={() =>
                                  togglePlayer(
                                    player.id
                                  )
                                }
                                className="h-5 w-5"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold">
                                {
                                  player.name
                                }
                              </div>

                              {player.nickname && (
                                <div className="text-sm text-gray-500">
                                  {
                                    player.nickname
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {selected ? (
                                <select
                                  value={
                                    selected
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    changeTeam(
                                      player.id,
                                      e.target
                                        .value as
                                        | "A"
                                        | "B"
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 px-3 py-2"
                                >
                                  <option value="A">
                                    Team A
                                  </option>
                                  <option value="B">
                                    Team B
                                  </option>
                                </select>
                              ) : (
                                <span className="text-gray-400">
                                  —
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {selected ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    goals[
                                      player
                                        .id
                                    ] ?? 0
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    changeGoals(
                                      player.id,
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-24 rounded-lg border border-gray-300 px-3 py-2"
                                />
                              ) : (
                                <span className="text-gray-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Salvataggio..."
                : "Salva partita"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
