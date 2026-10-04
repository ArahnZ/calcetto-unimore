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

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Calcetto Unimore</h1>
          <p className="mt-2 text-gray-600">
            Classifica individuale
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold">Classifica</h2>
            <p className="mt-1 text-sm text-gray-500">
              Aggiornata automaticamente dopo ogni partita
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Caricamento...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-gray-500">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Giocatore</th>
                    <th className="px-6 py-4 text-center">PG</th>
                    <th className="px-6 py-4 text-center">V</th>
                    <th className="px-6 py-4 text-center">P</th>
                    <th className="px-6 py-4 text-center">S</th>
                    <th className="px-6 py-4 text-center">Gol</th>
                    <th className="px-6 py-4 text-center">Pt</th>
                  </tr>
                </thead>

                <tbody>
                  {players.map((player, index) => (
                    <tr
                      key={player.id}
                      className="border-t border-gray-100"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold">
                          {player.name}
                        </div>
                        {player.nickname && (
                          <div className="text-sm text-gray-500">
                            {player.nickname}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {player.matches}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {player.wins}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {player.draws}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {player.losses}
                      </td>

                      <td className="px-6 py-4 text-center font-semibold">
                        {player.goals}
                      </td>

                      <td className="px-6 py-4 text-center text-lg font-bold">
                        {player.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}