Simple Health — Usage & Example Event Sheets

Overview
- Behavior provides: damage, healing, invulnerability, death events, last-damage/last-heal tracking, and save/load support.

Actions (examples)
- Take damage:
  - Action: `Take damage`
  - Example: Take 25 damage
    - Event sheet: Add action `Take damage (25)` on the instance.

- Heal:
  - Action: `Heal`
  - Example: Heal 15
    - Event sheet: Add action `Heal (15)` on the instance.

- Set invulnerable:
  - Action: `Set invulnerable`
  - Example: Set invulnerable to True/False
    - Event sheet: `Set invulnerable to True` or `Set invulnerable to False`

- Set health / Set max health:
  - Actions: `Set health`, `Set max health`
  - Example: `Set max health to 200`, `Set health to 150`

- Revive:
  - Action: `Revive` — restores current health to max and clears dead state.

Conditions / Triggers
- On death:
  - Trigger condition: `OnDeath` — fires when health reaches zero.
  - Example: Use this to run death logic, spawn effects, destroy instance, etc.

- On damaged / On healed:
  - Trigger conditions: `OnDamaged`, `OnHealed` — fire when damage or heal occurs.

- Query conditions:
  - `IsDead` — returns true when dead.
  - `IsInvulnerable` — returns current invulnerability state.

Expressions (values)
- `CurrentHealth()` — returns current health value.
- `MaxHealth()` — returns maximum health value.
- `HealthPercent()` — returns 0-100 percent.
- `LastDamage()` — last damage amount applied.
- `LastHeal()` — last heal amount applied.

Save / Load
- The behavior supports save/load via `_saveToJson` / `_loadFromJson` internally. No action required: the behavior state (max/current health, invulnerable, destroy-on-death flag, last damage/last heal, dead state) will be preserved when the Construct project save/load system serializes instance state.

Testing tips
- Start with `Set max health to 100`, then `Set health to 100`.
- Use `Take damage` and verify `OnDamaged` triggers until `OnDeath` fires and `IsDead` becomes true.
- Use `Set invulnerable to True` to prevent damage.
- Use `Revive` to return to alive state.

File references
- Runtime instance: src/runtime/instance.js
- ACEs are in: src/aces/Health/actions and src/aces/Health/conditions and src/aces/Health/expressions

If you want, I can add a small example event-sheet file or embed these examples into README.md instead.