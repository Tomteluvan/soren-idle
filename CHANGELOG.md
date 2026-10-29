# Soren Idle Changelog

## [Unreleased]

- The game is now called Soren Idle. The planet is Soren and its people are the Sorenians.
- Every skill now runs to level 99 on the Melvor Idle XP curve, up from 50. Level 99 takes about
  120 hours of nonstop play with bare hands. Level requirements across tasks, buildings and gear
  were spread out to match, and XP rates were retuned per skill.
- Engineering has repeatable crafts now (Circuit Board, Servo Unit, Power Core, Fusion Cell), so it
  can be levelled like the other skills.
- Combat health and damage still grow in the same steps as before, one per three levels.
- The stats screen counts retreats. The unused deaths stat is gone.
- `npm run balance` prints how long each skill takes to level and each task takes to unlock.
- Gathering tasks are now resource nodes with health, like Melvor's rocks. Each cycle is a hit; when
  the node is spent it takes a few seconds to respawn. The task list shows the node's health and the
  respawn time.
- Mastery per task: repeating a task levels its mastery (up to 99). Each level adds one node health,
  every ten levels cut the task's time by 2.5%, and levels 25, 50, 75 and 99 add bonus yield. Combat
  and one-off crafts have none. XP rates were retuned for the time spent waiting on nodes.
- Play is now a main menu. Skills, Base, Equipment, Trade, Bounties, Bounty Shop, Inventory and Stats open as their own screens (Esc goes back), replacing the section dropdown. Your survivor's task and health stay at the top of every screen. Typing in the search bar on the menu still finds any task, item or building.
- Internal: the game data and the Play views are split into folders, one file per topic.
- Windows support for the Play command. The menu bar ticker stays macOS-only.
