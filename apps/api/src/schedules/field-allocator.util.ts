export function defaultFieldGrid(
  roundIndex: number,
  gamesInRound: number,
  opts: {
    fields: string[];
    startDate: string;
    startTime: string;
    durationMins: number;
    breakBetweenMins: number;
  },
) {
  const day = new Date(opts.startDate);
  day.setDate(day.getDate() + roundIndex * 7);
  const isoDay = day.toISOString().slice(0, 10);

  const slots: { start: string; field: string }[] = [];
  const perSlot = opts.fields.length;

  for (let i = 0; i < gamesInRound; i++) {
    const field = opts.fields[i % perSlot];
    const offsetBlocks = Math.floor(i / perSlot);
    const start = new Date(`${isoDay}T${opts.startTime}:00Z`);
    start.setMinutes(
      start.getMinutes() +
        offsetBlocks * (opts.durationMins + opts.breakBetweenMins),
    );
    slots.push({ start: start.toISOString(), field });
  }
  return slots;
}
