import { Injectable } from '@nestjs/common';
import { League, Player, Team, Field } from '@ultiverse/shared-types';

@Injectable()
export class FixturesService {
  // One demo league that mirrors a UC league conceptually
  private leagues: League[] = [
    {
      id: 'L_DEMO',
      name: 'Ultiverse Pod League (Demo)',
      start: '2025-06-01',
      end: '2025-08-31',
      type: 'league',
      externalRefs: {
        uc: { eventId: 156458, slug: 'maul-summer-league-2015', siteId: 1645 },
      },
      meta: { rosterView: 'public' },
    },
  ];

  // 8 pods for the demo league
  private teams: Team[] = [
    'Alpha',
    'Bravo',
    'Charlie',
    'Delta',
    'Echo',
    'Foxtrot',
    'Golf',
    'Hotel',
  ].map((name, idx) => ({
    id: `P${idx + 1}`,
    leagueId: 'L_DEMO',
    name: `Pod ${name}`,
    kind: 'pod' as const,
    skill: ['A', 'B', 'B', 'C', 'A', 'C', 'B', 'A'][idx],
    externalRefs: { uc: { teamId: undefined } },
    meta: {},
    memberIds: [`U${idx * 3 + 1}`, `U${idx * 3 + 2}`, `U${idx * 3 + 3}`],
  }));

  // matching players
  private players: Player[] = Array.from({ length: 24 }, (_, i) => ({
    id: `U${i + 1}`,
    name: `Player ${i + 1}`,
    email: `player${i + 1}@example.com`,
    rating: 3 + Math.round(Math.sin(i) + Math.random()),
    externalRefs: {},
    meta: {},
  }));

  private fields: Field[] = [
    {
      id: 'F1',
      name: 'Field 1',
      venue: 'Central Park',
      meta: { lights: false },
    },
    {
      id: 'F2',
      name: 'Field 2',
      venue: 'Central Park',
      meta: { lights: false },
    },
    { id: 'F3', name: 'Field 3', venue: 'Riverside', meta: { lights: true } },
  ];

  getLeagues(): League[] {
    return this.leagues;
  }
  getLeagueById(id: string): League | undefined {
    return this.leagues.find((l) => l.id === id);
  }

  getTeams(leagueId?: string, kind?: Team['kind']): Team[] {
    let rows = this.teams;
    if (leagueId) rows = rows.filter((t) => t.leagueId === leagueId);
    if (kind) rows = rows.filter((t) => t.kind === kind);
    return rows;
  }

  getPlayersByIds(ids: string[]): Player[] {
    const set = new Set(ids);
    return this.players.filter((p) => set.has(p.id));
  }

  getFields(): Field[] {
    return this.fields;
  }
  getFieldById(id: string): Field | undefined {
    return this.fields.find((f) => f.id === id);
  }
}
