# Soren Idle

A sci-fi idle game for Raycast. You crashed on **Soren**, an alien world. Salvage the wreck, build a
base, call the **Sorenians** who live here, and learn to survive. Tasks keep running while Raycast is
closed, and you collect the haul when you come back.

## Commands

| Command | Platforms | What it does |
| --- | --- | --- |
| **Play Soren Idle** | macOS, Windows | The game: pick tasks, craft gear, manage your base, trade and hunt. |
| **Soren Idle Ticker** | macOS | A menu bar status that keeps the game ticking in the background and notifies you when a task stops. |

## How to play

- Start with **Salvaging** and pick *Scavenge Hull Scrap*. Levels unlock new tasks.
- Eight skills run to level 99: Salvaging, Mining, Foraging, Cooking, Engineering, Combat,
  Hydroponics and Xenochemistry. They use the same XP curve as Melvor Idle, so the last levels take
  most of the time.
- **Engineering** builds your Base: a Workshop, drones, a Hydroponic Bay, and a Signal Beacon that
  calls the Sorenians. Once they arrive you can trade with them and take Bounties.
- **Combat** has areas, bosses and a damage triangle (kinetic beats bio, bio beats energy, energy
  beats kinetic). Gear only counts while it is worn.
- Progress is saved in Raycast's local storage. Use *Copy Save to Clipboard* to back it up.

## Pacing

Reaching level 99 in one skill takes roughly 120 hours of nonstop play with bare hands, less with
tools and potions. Run `npm run balance` for the full table.

## Development

```
npm install
npm run dev        # load the extension into Raycast
npm test           # engine tests
npm run balance    # time-to-level and time-to-unlock table
npm run lint
```

- `src/engine`: the game logic. It has no Raycast dependencies, so it is fully unit tested.
  `src/engine/data` holds the game content (items, tasks, buildings, areas, bounties, trade).
- `src/play.tsx`: the Play command. It owns the state and ticking, and hands off to a view.
- `src/views`: one file per screen (overview, tasks, inventory, base, equipment, trade, ...).
- `src/art`: the terminal-style scene art.
- `scripts`: tooling such as the balance simulation.
