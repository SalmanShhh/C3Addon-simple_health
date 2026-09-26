# Simple Health - Complete Guide

**Simple Health** is a Construct 3 **behavior** that gives any object a full health system without custom bookkeeping events for every object type. It handles **damage**, **healing**, **death detection**, **invulnerability**, named **health pools** (shields, armour, barriers) and **status effects** (burn, poison, stun, regen) that run in real time or in turns. You get one consistent set of rules for players, enemies, bosses and breakable objects, plus triggers and expressions to drive your effects and UI.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Project Setup](#2-project-setup)
3. [Plugin Properties](#3-plugin-properties)
4. [Dealing Damage and Healing](#4-dealing-damage-and-healing)
5. [Death, Revive, and Destruction](#5-death-revive-and-destruction)
6. [Invulnerability Windows](#6-invulnerability-windows)
7. [Health Pools](#7-health-pools)
8. [Status Effects](#8-status-effects)
9. [Save/Load and Persistence](#9-saveload-and-persistence)
10. [Actions Reference](#10-actions-reference)
11. [Conditions Reference](#11-conditions-reference)
12. [Expressions Reference](#12-expressions-reference)
13. [Triggers Reference](#13-triggers-reference)
14. [Game Use Cases](#14-game-use-cases)
15. [C3 Debugger](#15-c3-debugger)
16. [Scripting](#16-scripting)
17. [Feature Deep-Dive: Trigger Timing and Event Ordering](#17-feature-deep-dive-trigger-timing-and-event-ordering)
18. [Tips and Common Mistakes](#18-tips-and-common-mistakes)
19. [Upgrading from 1.2.x](#19-upgrading-from-12x)

---

## 1. Core Concepts

### The problem this addon solves

Without a dedicated health behavior, you usually duplicate the same event logic across multiple object types: track current HP, clamp values, detect death, prevent actions when dead, and keep "last damage/heal" values for UI and effects. Shields need their own variables, and every damage-over-time effect needs a timer, a stack counter and a "is it still alive?" check before each tick. That grows into fragile event sheets where one enemy type handles edge cases differently than another. **Simple Health** centralizes that logic so all attached objects follow the same health rules.

### Key design decisions

- **Per-instance ownership**: this is a **behavior**, so each object instance has its own independent health, pools and statuses.
- **Clamped health range**: health is constrained to **0..MaxHealth**.
- **Dead-state guardrails**: when dead, the behavior blocks `Take damage`, `Heal`, `Set health` and `Apply status`, and statuses stop ticking.
- **Invulnerability scope**: invulnerability blocks **damage only**; it does not block direct `Set health`.
- **Optional auto-destroy**: death can optionally destroy the host instance.
- **You own the consequences**: a status like `"stun"` or `"slow"` is a named, timed flag. The behavior tracks it; your events decide what it does to movement, AI or visuals.

Event example:

```text
Event: Enemy collides with Bullet
  Action: Enemy.SimpleHealth -> "Take damage", 25
  // One action handles pools, absorption, clamping and death checks
```

### Key concepts at a glance

| Concept | What it means |
|---|---|
| **Current Health** | The live health value for this object instance. |
| **Max Health** | Upper limit for health; `Set max health` enforces a minimum of 1. |
| **Dead State** | Boolean state where health reached 0 and death logic has run. |
| **Health Pool** | A named reserve (for example `"shield"`) that absorbs damage before real health. |
| **Status** | A named condition (for example `"burn"`) with stacks and a duration in seconds or turns, which can deal damage or heal on each tick. |
| **Health Absorption Rate** | A multiplier applied to damage that reaches real health after all pools. `1.0` = normal, `0.5` = 50% resistance, `2.0` = double damage. Setting it to `0` also turns on **Invulnerable**. |

### Scenarios where this addon excels

- **Player survivability systems**: consistent player HP handling with death trigger hooks.
- **Enemy health across many archetypes**: attach once, reuse the same events everywhere.
- **Breakable world objects**: crates and barrels that die and optionally self-destroy.
- **Layered defences**: shields, armour and decaying barriers that soak damage in a set order.
- **Damage and healing over time**: burn, poison, bleed and regen without timer objects.
- **Turn-based games**: statuses that tick, drain and expire in a fixed order each time you advance a turn.
- **UI and feedback pipelines**: floating numbers, hit flashes, status icons and health bars driven by triggers and expressions.

Event example:

```text
Event: Player steps in fire
  Action: Player.SimpleHealth -> "Apply status", "burn", 3, seconds, 1
  // Burn damage, timing and expiry are handled by the behavior
```

---

## 2. Project Setup

### Step 1 - Install the addon

Install `salmanshh_simple_health.c3addon` in Construct 3.

### Step 2 - Add behavior to objects

Attach **Simple Health** to each object that needs HP (Player, Enemy, Breakable, etc.).

### Step 3 - Configure behavior properties

In the behavior properties panel, set:
- **Max Health** (default 100)
- **Invulnerable** (default false)
- **Destroy on Death** (default false)
- **Clear Statuses on Death** (default true)

### Step 4 - Wire first working example

```text
Event: On start of layout
  Action: Player.SimpleHealth -> "Set max health", 100
  Action: Player.SimpleHealth -> "Set health", 100
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Explicitly initialize state for clear, predictable startup

Event: Enemy collides with PlayerAttackHitbox
  Action: Enemy.SimpleHealth -> "Take damage", 20
  // Enemy loses HP on hit

Event: Enemy.SimpleHealth -> On death
  Action: System -> Create object "Explosion" at Enemy.X, Enemy.Y
  Action: Audio -> Play "enemy_death"
  // Hook death trigger to effects
```

In the event sheet, Construct shows each row with the object and behavior name first, for example `Enemy (SimpleHealth): Take 20 damage`.

### Step 5 - Read values for UI

```text
Event: Every tick
  Action: HealthBar -> Set width to (Player.SimpleHealth.CurrentHealth / Player.SimpleHealth.MaxHealth) * 200
  // Basic health bar scaling using expressions
```

---

## 3. Plugin Properties

| Property | Type | Default | Description |
|---|---|---|---|
| **Max Health** | Float | `100` | Initial maximum health for each instance with this behavior. Current health starts at this value. |
| **Invulnerable** | Check | `False` | If enabled, the instance starts immune to `Take damage`. |
| **Destroy on Death** | Check | `False` | If enabled, the instance is destroyed when it dies. |
| **Clear Statuses on Death** | Check | `True` | If enabled, every active status is removed when the instance dies, firing `On status removed` for each. If disabled, statuses stay but stop ticking until the instance is revived. |

Property-driven startup example:

```text
Event: On start of layout
  Condition: Player.SimpleHealth -> Is invulnerable
  Action: UI -> Set text to "Spawn Shield Active"
  // Reads configured startup invulnerability directly
```

---

## 4. Dealing Damage and Healing

This group covers how to reduce and restore health and read recent health changes.

### What it does and when to use it

Use `Take damage` when gameplay should reduce HP and potentially trigger death. Use `Heal` when restoring HP (capped at max). Use `Set health` for direct state assignment (cutscenes, checkpoints, debug tools, scripted transitions).

### How to call it

- `Take damage(amount)`
- `Heal(amount)`
- `Set health(amount)`
- Read back with `CurrentHealth`, `HealthPercent`, `LastDamage`, `LastHeal`

### Event sheet example

```text
Event: Player collides with Spike
  Action: Player.SimpleHealth -> "Take damage", 10
  // Natural damage flow with dead/invulnerable checks

Event: Player collides with Medkit
  Action: Player.SimpleHealth -> "Heal", 25
  Action: Medkit -> Destroy
  // Healing is capped at Max Health automatically

Event: Checkpoint reached
  Action: Player.SimpleHealth -> "Set health", 100
  // Force exact HP for checkpoint restores
```

### Edge cases and gotchas

- `Heal` and `Set health` do nothing if already dead.
- `Take damage` ignores calls while invulnerable and ignores amounts of 0 or less.
- `Heal` fires `On healed` even at full health, and `LastHeal` holds the amount you asked for, not what was restored. Status heals (section 8) do not have this quirk.
- `LastDamage` only changes when damage reaches real health. A hit fully absorbed by a health pool leaves it unchanged.

Defensive example:

```text
Event: Apply incoming damage
  Condition: incomingDamage > 0
  Action: Target.SimpleHealth -> "Take damage", incomingDamage
  // Keep damage values positive and explicit
```

---

## 5. Death, Revive, and Destruction

This section controls death flow, respawn logic, and optional automatic destruction.

### What it does and when to use it

Use `On death` as the central hook for effects, score, drops, and progression. Use `Revive` for respawn loops. Enable **Destroy on Death** when the object should be removed as soon as it dies.

### How to configure or call it

- Property: **Destroy on Death**
- Property: **Clear Statuses on Death**
- Action: `Revive(amount)` - use `-1` to restore to max health
- Condition: `Is dead`
- Triggers: `On death`, `On revived`

### Event sheet example

```text
Event: Enemy.SimpleHealth -> On death
  Action: System -> Add 100 to Score
  Action: LootTable -> SpawnDropAt(Enemy.X, Enemy.Y)
  // Death trigger as single source for kill handling

Event: Player presses R
  Condition: Player.SimpleHealth -> Is dead
  Action: Player.SimpleHealth -> "Revive", -1
  Action: Player -> Set position to SpawnPoint.X, SpawnPoint.Y
  // Basic respawn flow at full health
```

### Edge cases and gotchas

- `Revive` clears the dead flag and sets health (to max with `-1`, or to the amount you pass). It fires `On revived` and `On health changed`, but not `On healed`.
- On a lethal hit the order is: `On death`, then statuses are cleared (if **Clear Statuses on Death** is on), then `On health changed`, then the instance is destroyed (if **Destroy on Death** is on).
- `On death` fires exactly once per death.
- `Revive` does not restore health pools or statuses that were cleared.

Safe destroy-handling example:

```text
Event: Enemy.SimpleHealth -> On death
  Action: System -> Create object "DeathFX" at Enemy.X, Enemy.Y
  // Keep death effects in this trigger so they run before possible destruction
```

---

## 6. Invulnerability Windows

Invulnerability is ideal for i-frames, spawn protection, cinematic immunity, and scripted "cannot die yet" moments.

### What it does and when to use it

While invulnerable, `Take damage` exits early with no health loss, no pool consumption and no damage trigger. This includes damage from statuses.

### How to configure or call it

- Startup property: **Invulnerable**
- Action: `Set invulnerable(True/False)`
- Condition: `Is invulnerable`

### Event sheet example

```text
Event: Player.SimpleHealth -> On damaged
  Action: Player.SimpleHealth -> "Set invulnerable", True
  Action: Player -> Start blinking animation
  Action: System -> Wait 0.6 seconds
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Classic post-hit invulnerability window
```

### Edge cases and gotchas

- Invulnerability only affects `Take damage`; direct `Set health` still applies.
- Statuses keep counting down while invulnerable. Their damage ticks are simply blocked.
- If you forget to unset invulnerability, the object appears immortal.

Verification example:

```text
Event: Every 1 second
  Condition: Player.SimpleHealth -> Is invulnerable
  Action: DebugText -> Set text to "INVULNERABLE"
  // Quick runtime check during balancing
```

---

## 7. Health Pools

> Health pools were called **Temporary Health** before 1.3.0.0. Only the names you see in Construct changed; existing projects keep working. See [Upgrading from 1.2.x](#19-upgrading-from-12x).

A **health pool** sits in front of real health and absorbs incoming damage before it reaches it. Each pool has a **name** (for example `"shield"`, `"armour"`, `"barrier"`). Pools are independent: several can be active at once, and they absorb damage in **priority** order.

### Key concepts

| Concept | What it means |
|---|---|
| **Pool name** | A string key that identifies one pool. Pool names are case-sensitive (`"Shield"` and `"shield"` are different pools). |
| **Amount** | How much health the pool currently holds. |
| **Decay rate** | Health the pool loses per second automatically (0 = no decay). |
| **Absorption rate** | Pool health spent per 1 point of incoming damage. `1.0` = equal trade. `0.5` = armour-style (100 armour blocks 200 damage). `2.0` = fragile shield (1 damage costs 2 pool health). |
| **Priority** | Pools absorb damage in ascending priority order (lowest number first). Default `0`. Pools with equal priority go in the order they were created. |

### Three common pool setups

| Type | How to configure |
|---|---|
| **Simple shield**: absorbs damage, no recovery | `"Setup health pool", "shield", 100, 0, 1.0, 0` |
| **Decaying shield**: drains away over time | `"Setup health pool", "shield", 100, 10, 1.0, 0` |
| **Armour**: consumed at a reduced rate | `"Setup health pool", "armour", 200, 0, 0.5, 1` |

These are not exclusive; you can stack all three on the same object.

### Setting up a pool

The fastest way to configure a pool is a single `Setup health pool` action (pool, amount, decay rate, absorption rate, priority):

```text
Event: Player equips shield
  Action: Player.SimpleHealth -> "Setup health pool", "shield", 100, 0, 1.0, 0
  // Creates or resets the "shield" pool: 100 health, no decay, 1:1 absorption

Event: Player equips armour
  Action: Player.SimpleHealth -> "Setup health pool", "armour", 200, 0, 0.5, 1
  // 1 damage costs 0.5 armour, so 200 armour blocks 400 damage; absorbs after the shield

Event: Buff applied: fading barrier
  Action: Player.SimpleHealth -> "Setup health pool", "barrier", 150, 25, 1.0, 0
  // Barrier drains 25 per second even when not being hit
```

To adjust rates on an existing pool without changing its amount, use `Set health pool rates`:

```text
Event: Armour upgrade acquired
  Action: Player.SimpleHealth -> "Set health pool rates", "armour", 0, 0.25
  // 1 damage now costs only 0.25 armour
```

### How damage flows through pools

When `Take damage` is called:

1. Pools are checked in **priority order** (lowest first, then creation order).
2. Each pool absorbs as much damage as it can, based on its absorption rate.
3. If a pool runs out, the leftover damage moves to the next pool.
4. `On health pool absorbed damage` fires for each pool that took part of the hit.
5. `On health pool depleted` fires for each pool that reached zero.
6. Whatever is left after all pools is multiplied by the **health absorption rate** and hits real health.

Real health triggers (`On damaged`, `On death`) only fire if damage gets past every pool.

### Filtering trigger events by pool

Pool triggers fire for any pool. Use `Is health pool` as a sub-condition to run logic for one pool:

```text
Event: Player.SimpleHealth -> On health pool depleted
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_break"
    Action: Player -> Flash white

Event: Player.SimpleHealth -> On health pool depleted
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "armour"
    Action: Audio -> Play "armour_crack"
```

You can also read the pool's name with the `LastPoolName` expression.

### Removing pool health

```text
Event: Shield disabled
  Action: Player.SimpleHealth -> "Clear health pool", "shield"
  // Empties the shield pool (its settings are kept, amount = 0)

Event: Level transition
  Action: Player.SimpleHealth -> "Clear all health pools"
  // Empties every pool at once
```

### Edge cases and gotchas

- `Setup health pool` on an existing pool **replaces** its amount, rates and priority.
- `Add to health pool` on a pool that does not exist yet creates it with decay `0`, absorption `1.0` and priority `0`.
- `On health pool increased` fires from `Add to health pool`, and from `Set health pool` when the amount goes up. `Setup health pool` does not fire it.
- An empty pool (amount 0) is skipped; it does not block damage.
- Absorption rate `0` makes a pool immune to damage (only decay drains it).
- Pools are **not** restored by `Heal` or `Revive`; manage them with pool actions.
- Pools are fully saved and loaded.

---

## 8. Status Effects

A **status** is a named condition on an instance, such as `"burn"`, `"poison"`, `"stun"` or `"regen"`. It has **stacks**, a **duration** measured in **seconds** or **turns**, and can deal damage or heal on a regular **tick**. The behavior handles timing, stacking, ticking, expiry, death cleanup and save/load. What a status *means* for anything other than health (a stun stopping movement, a slow halving speed) is up to your events.

### Key concepts

| Concept | What it means |
|---|---|
| **Status name** | A string such as `"burn"`. Status names are **not** case-sensitive (`"Burn"` and `"burn"` are the same status). |
| **Stacks** | A whole-number intensity. Periodic damage and healing are multiplied by the current stacks. |
| **Duration unit** | `seconds` count down automatically and follow the object's time scale. `turns` only move when you use `Advance status turns`. |
| **Tick** | One periodic firing every *interval* seconds or turns. A tick applies the status's damage or healing and fires `On status ticked`. |
| **Reapply mode** | What applying an already-active status does to its duration: `refresh` (reset to the new duration), `extend` (add the new duration) or `keep` (unchanged). |
| **Active / inactive** | A status is active while it has stacks. When it ends it becomes inactive but keeps its settings, so you configure it once and apply it many times. |

### Applying a status

`Apply status` takes the name, duration, unit and number of stacks. Use `-1` as the duration for a permanent status that lasts until removed or until its stacks run out.

```text
Event: Player touches Lava
  Action: Player.SimpleHealth -> "Apply status", "burn", 3, seconds, 1
  // Burns for 3 seconds

Event: Enemy hit by SleepSpell
  Action: Enemy.SimpleHealth -> "Apply status", "sleep", 2, turns, 1
  // Sleeps for 2 turns; turns only pass when you advance them

Event: Player picks up Curse
  Action: Player.SimpleHealth -> "Apply status", "cursed", -1, seconds, 1
  // Permanent until removed
```

Applying is ignored when the instance is dead, the duration is `0`, or stacks is less than 1.

### Configuring stacking and ticks

Two actions configure a status. You can run them before the first apply (for example in `On created`) or at any time later; the settings are kept after the status expires.

- `Set status stacking` (name, max stacks, on reapply, stacks lost per tick). Max stacks `-1` means unlimited.
- `Set status periodic` (name, type, amount per stack, interval). Type is `none`, `damage` or `heal`.

Defaults: unlimited stacks, reapply `refresh`, no stacks lost per tick, type `none`, interval `1`.

```text
Event: Enemy.On created
  Action: Enemy.SimpleHealth -> "Set status periodic", "burn", damage, 3, 1
  // Burn deals 3 damage per stack every 1 second (or turn)
  Action: Enemy.SimpleHealth -> "Set status stacking", "burn", 5, refresh, 0
  // Up to 5 stacks; reapplying resets the duration
```

### Seconds vs turns

The unit is chosen **each time you apply** a status, so one project (even one object) can use both.

- **Seconds** statuses count down every frame using the object's own time scale. `System -> Set object time scale` to `0` pauses them for that object.
- **Turns** statuses ignore frame time. Each `Advance status turns` call moves them forward. The interval is rounded up to whole turns.

```text
Event: Player's turn ends
  Action: Player.SimpleHealth -> "Advance status turns", 1
  // Ticks, drains and expires every turns-based status on the player
```

`Advance status turns` with a count of 3 runs three separate turns. A status applied by a trigger during the first turn starts counting down on the second.

### Stacking and reapplying

Applying a status that is already active adds stacks (up to max stacks) and changes the duration according to the reapply mode:

| Reapply mode | Remaining duration after reapplying |
|---|---|
| `refresh` | Reset to the new duration. |
| `extend` | New duration added on top. A permanent (`-1`) duration on either side makes it permanent. |
| `keep` | Unchanged. Only stacks are added. |

Reapplying **never resets the tick timer**. An aura that reapplies burn every 0.5 seconds still ticks once per second. If you reapply with a different unit (seconds vs turns), the duration and tick timer restart.

The first application fires `On status applied`; later applications while active fire `On status reapplied`.

### Damage and healing over time

- Damage ticks go through the normal damage path: invulnerability, health pools (by priority) and the health absorption rate all apply, and `On damaged` / `On death` fire as usual.
- Heal ticks are skipped when the instance is already at full health (no `On healed`), and are capped to the missing health, so `LastHeal` is exactly what was restored.
- `LastTickAmount` holds what the tick tried to apply (amount per stack x stacks), before pools and absorption.
- `LastDamageStatus` / `LastHealStatus` name the status behind `LastDamage` / `LastHeal`, or are empty for direct hits and heals.
- A status can tick at most 8 times per frame. Intervals shorter than a frame are capped rather than stalling the game.

```text
Event: Enemy.SimpleHealth -> On damaged
  Action: System -> Create object "DamageText" at Enemy.X, Enemy.Y
  Action: DamageText -> Set text to "-" & int(Enemy.SimpleHealth.LastDamage)
  Sub-condition: Enemy.SimpleHealth.LastDamageStatus = "burn"
    Action: DamageText -> Set color to orange
  // Burn damage shows in orange, direct hits in the default color
```

### Stacks as duration

Set **stacks lost per tick** to make stacks drain on each tick. Combined with a permanent duration, the status lasts exactly as many ticks as it has stacks, and each tick hits harder the more stacks remain.

```text
Event: On start of layout
  Action: Enemy.SimpleHealth -> "Set status periodic", "poison", damage, 1, 1
  Action: Enemy.SimpleHealth -> "Set status stacking", "poison", -1, keep, 1
  // Poison deals damage equal to its stacks, then loses 1 stack per turn

Event: Card "Deadly Poison" played on Enemy
  Action: Enemy.SimpleHealth -> "Apply status", "poison", -1, turns, 5
  // 5 + 4 + 3 + 2 + 1 = 15 damage over 5 turns, then it expires
```

### Status triggers

Most status triggers take a status name and only run for that status. The "any" versions run for every status; read the name with `LastStatus`.

```text
Event: Player.SimpleHealth -> On status "stun" applied
  Action: Player -> Set 8Direction enabled to False
  Action: StunStars -> Set visible

Event: Player.SimpleHealth -> On status "stun" removed
  Action: Player -> Set 8Direction enabled to True
  Action: StunStars -> Set invisible
  // "Removed" covers every way a status can end, so cleanup always runs
```

Ending order: when a status runs out naturally, `On status expired` fires first, then `On status removed`, then `On any status removed`. `Remove status`, `Remove status stacks` down to 0, `Clear all statuses` and death cleanup only fire the two "removed" triggers.

### Reading status state

| Expression | Use it for |
|---|---|
| `StatusStacks(name)` | Stack counters on icons. 0 when not active. |
| `StatusRemaining(name)` | Seconds or turns left. `-1` when permanent, 0 when not active. |
| `StatusDuration(name)` | The duration it was applied with, for progress bars: `StatusRemaining / StatusDuration`. |
| `StatusCount` / `StatusByIndex(i)` | Looping over all active statuses, in the order they became active. |

```text
Event: Every tick
  Action: StatusIcons -> Destroy
  Repeat Player.SimpleHealth.StatusCount times
    Action: System -> Create object "StatusIcon" at 20 + loopindex * 40, 20
    Action: StatusIcon -> Set animation to Player.SimpleHealth.StatusByIndex(loopindex)
  // Rebuild a row of status icons from the active list
```

### Changing and removing statuses

```text
Event: Player drinks Antidote
  Action: Player.SimpleHealth -> "Remove status", "poison"

Event: Player uses Cleanse
  Action: Player.SimpleHealth -> "Clear all statuses"

Event: Player uses Partial Cure
  Action: Player.SimpleHealth -> "Remove status stacks", "bleed", 2

Event: Player uses Quicken
  Action: Player.SimpleHealth -> "Set status remaining", "haste", 10
  // 0 expires it now, -1 makes it permanent
```

### Death and revive

With **Clear Statuses on Death** on (the default), every status is removed when the instance dies, firing `On status removed` for each. With it off, statuses stay but do not tick while dead, and continue after `Revive`.

### Edge cases and gotchas

- Status names are case-insensitive, but health pool names are case-sensitive.
- `On status ticked` fires even when the status's type is `none`, which is useful for custom per-tick logic.
- `On status ticked` does not fire if that tick killed the instance.
- A status applied during another status's tick does not tick until the next frame or turn.
- `Set status periodic` stores the amount you pass. An expression like `Self.SimpleHealth.MaxHealth / 16` is worked out once, when the action runs, so run it again after `Set max health` if you need it to follow max health.
- Statuses are fully saved and loaded, including stacks, time left, tick timing and the active order.

---

## 9. Save/Load and Persistence

The behavior supports Construct save/load by serializing its full state.

### What it does and when to use it

Use this when your game uses savegames, checkpoints, or layout persistence and health state must restore correctly.

### Serialized fields

- Max health, current health, dead state
- Invulnerable, Destroy on Death and Clear Statuses on Death flags
- Last damage and last heal values, and the statuses behind them
- Health absorption rate
- All health pools (name, amount, decay rate, absorption rate, priority)
- All statuses (settings, stacks, time left, tick timing) and their active order

```text
Event: Player enters SavePoint
  Action: System -> Save game to slot "slot1"
  // Behavior state is included in C3 save data

Event: On start of layout
  Condition: globalShouldLoad = True
  Action: System -> Load game from slot "slot1"
  // Restores health, pools and statuses
```

### Edge cases and gotchas

- If you manually reset health after load in startup events, you can overwrite loaded values.
- Last damage/heal restore exactly as saved; clear your UI if you treat them as one-shot messages.
- Saves made with 1.2.x load normally; they simply have no statuses.

---

## 10. Actions Reference

### Health

| Action | Parameters | Description |
|---|---|---|
| **Take damage** | amount | Subtracts from current health unless dead or invulnerable. Health pools absorb first. |
| **Heal** | amount | Adds to current health up to max health, unless dead. Does not refill pools. |
| **Set health** | amount | Directly sets current health, clamped 0..max. Can trigger death. |
| **Set max health** | amount | Sets max health (minimum 1) and clamps current health if needed. |
| **Set invulnerable** | state | Turns damage immunity on or off. |
| **Revive** | amount | Clears dead state and sets health to the amount, or to max with `-1`. |
| **Set health absorption rate** | rate | Sets the multiplier on damage that reaches real health. `0` also turns on Invulnerable; any value above `0` turns it off. |

### Health Pools

| Action | Parameters | Description |
|---|---|---|
| **Setup health pool** | pool, amount, decay rate, absorption rate, priority | Create or fully reset a pool in one action. The recommended way to grant pool health. |
| **Add to health pool** | pool, amount | Add to a pool's amount (creates the pool with default rates if new). |
| **Set health pool** | pool, amount | Set a pool's amount to an exact value. |
| **Set health pool rates** | pool, decay rate, absorption rate | Set both rates without changing the amount. |
| **Set health pool decay rate** | pool, rate | Set how much the pool drains per second. |
| **Set health pool absorption rate** | pool, rate | Set pool health spent per 1 point of damage. |
| **Set health pool priority** | pool, priority | Change the absorption order without touching amount or rates. |
| **Clear health pool** | pool | Empty one pool. |
| **Clear all health pools** | none | Empty every pool. |

### Status Effects

| Action | Parameters | Description |
|---|---|---|
| **Apply status** | status, duration, unit, stacks | Apply or reapply a status. Duration `-1` = permanent. Unit is `seconds` or `turns`. |
| **Remove status** | status | End a status now, firing `On status removed`. |
| **Remove status stacks** | status, count | Remove stacks; reaching 0 removes the status. |
| **Set status remaining** | status, remaining | Set time or turns left. `0` expires it, `-1` makes it permanent. |
| **Clear all statuses** | none | Remove every active status. |
| **Advance status turns** | turns | Move every turns-based status forward: tick, drain stacks, expire. |
| **Set status stacking** | status, max stacks, on reapply, stacks lost per tick | Configure stacking and how reapplying affects duration. |
| **Set status periodic** | status, type, amount per stack, interval | Configure the damage or healing each tick applies. |

Action usage example:

```text
Event: Difficulty changed to Hard
  Action: Enemy.SimpleHealth -> "Set max health", 250
  Action: Enemy.SimpleHealth -> "Set health", 250
  // Re-scales active enemies for new difficulty

Event: Boss phase 2 begins
  Action: Boss.SimpleHealth -> "Setup health pool", "phase_shield", 500, 0, 1.0, 0
  Action: Boss.SimpleHealth -> "Apply status", "enraged", -1, seconds, 1
  // Shield must be broken first; "enraged" is a flag your AI events read
```

---

## 11. Conditions Reference

### Health

| Condition | Description |
|---|---|
| **Is dead** | True when this instance is dead (health reached 0 and death logic ran). |
| **Is invulnerable** | True when this instance currently ignores `Take damage`. |

### Health Pools

| Condition | Parameters | Description |
|---|---|---|
| **Health pool has health** | pool | True if the named pool has any amount left. Invertible. |
| **Any health pool has health** | none | True if any pool has any amount left. Invertible. |
| **Is health pool** | pool | True if the pool that fired the last pool trigger has this name. Use inside pool triggers. |

### Status Effects

| Condition | Parameters | Description |
|---|---|---|
| **Has status** | status | True if the status is active. Invertible. |
| **Has any status** | none | True if any status is active. Invertible. |

Condition usage example:

```text
Event: On fire button pressed
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Condition: Player.SimpleHealth -> Has status "stun" (inverted)
  Action: PlayerWeapon -> Shoot
  // No shooting while dead or stunned

Event: On shield upgrade button pressed
  Condition: Player.SimpleHealth -> Health pool "shield" has health (inverted)
  Action: Player.SimpleHealth -> "Setup health pool", "shield", 100, 0, 1.0, 0
  // Only grant a shield if one is not already active
```

---

## 12. Expressions Reference

### Health

| Expression | Returns | Description |
|---|---|---|
| **CurrentHealth** | Number | Current health value. |
| **MaxHealth** | Number | Current max health. |
| **HealthPercent** | Number | Health as a percentage, 0..100. |
| **LastDamage** | Number | Most recent damage that reached real health. |
| **LastHeal** | Number | Most recent heal amount. |
| **HealthAbsorptionRate** | Number | Current multiplier on damage that reaches real health. `1.0` by default. |

### Health Pools

| Expression | Parameters | Returns | Description |
|---|---|---|---|
| **PoolHealth** | pool | Number | Current amount in the pool. 0 if it does not exist. |
| **PoolDecayRate** | pool | Number | Decay rate (per second) of the pool. |
| **PoolAbsorptionRate** | pool | Number | Absorption rate of the pool. |
| **PoolPriority** | pool | Number | Absorption priority of the pool. Lower absorbs first. |
| **LastPoolDamageAbsorbed** | none | Number | Damage absorbed by the pool that fired the last pool trigger. |
| **LastPoolName** | none | String | Name of the pool that fired the most recent pool trigger. |

### Status Effects

| Expression | Parameters | Returns | Description |
|---|---|---|---|
| **StatusStacks** | status | Number | Current stacks. 0 if not active. |
| **StatusRemaining** | status | Number | Seconds or turns left. `-1` if permanent, 0 if not active. |
| **StatusDuration** | status | Number | Duration it was last applied with. `-1` if permanent, 0 if not active. |
| **StatusCount** | none | Number | Number of active statuses. |
| **StatusByIndex** | index | String | Name of the active status at a 0-based index, in the order they became active. |
| **LastStatus** | none | String | Name of the status that fired the most recent status trigger. |
| **LastTickAmount** | none | Number | Amount the last tick tried to apply, before pools and absorption. |
| **LastDamageStatus** | none | String | Status that caused `LastDamage`. Empty for direct damage. |
| **LastHealStatus** | none | String | Status that caused `LastHeal`. Empty for direct heals. |

### Deprecated (still work)

These are the pre-1.3.0.0 names. Existing projects keep working; use the new names in new events.

| Old expression | Use instead |
|---|---|
| `TempHealth(pool)` | `PoolHealth(pool)` |
| `TempHealthAbsorptionRate(pool)` | `PoolAbsorptionRate(pool)` |
| `TempHealthDecayRate(pool)` | `PoolDecayRate(pool)` |
| `TempHealthPriority(pool)` | `PoolPriority(pool)` |
| `LastTempDamageAbsorbed` | `LastPoolDamageAbsorbed` |
| `LastTempHealthType` | `LastPoolName` |

Expression usage example:

```text
Event: Every tick
  Action: HPText -> Set text to "HP: " & int(Player.SimpleHealth.CurrentHealth) & "/" & int(Player.SimpleHealth.MaxHealth)
  // Live HUD readout

Event: Every tick
  Action: ShieldBar -> Set width to (Player.SimpleHealth.PoolHealth("shield") / 100) * 200
  // Shield bar scales with the shield pool

Event: Every tick
  Action: BurnTimer -> Set text to Player.SimpleHealth.StatusRemaining("burn") > 0 ? str(ceil(Player.SimpleHealth.StatusRemaining("burn"))) : ""
  // Seconds of burn left, hidden when not burning
```

---

## 13. Triggers Reference

### Health

| Trigger | Description |
|---|---|
| **On damaged** | Damage reached real health and the instance survived. |
| **On healed** | Healing was applied while alive. |
| **On death** | Real health reached zero. Fires once per death. |
| **On health changed** | Health changed for any reason (damage, healing, set health, revive, max health clamp). |
| **On revived** | The instance was revived. |

### Health Pools

| Trigger | Description |
|---|---|
| **On health pool absorbed damage** | Fires once per pool that absorbed part of a hit. |
| **On health pool depleted** | A pool reached zero, from damage or decay. |
| **On health pool increased** | Health was added to a pool. |

Use `Is health pool` as a sub-condition inside any pool trigger to run logic for one pool.

### Status Effects

| Trigger | Description |
|---|---|
| **On status applied** (status) | The status became active. |
| **On any status applied** | Any status became active. Use `LastStatus`. |
| **On status reapplied** (status) | The status was applied while already active. |
| **On status ticked** (status) | The status ticked, after its damage or healing was applied. |
| **On status expired** (status) | The status ran out of time or stacks. |
| **On status removed** (status) | The status ended for any reason. Use for cleanup. |
| **On any status removed** | Any status ended. Use `LastStatus`. |

```text
Event: Player.SimpleHealth -> On health pool depleted
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_break"

Event: Player.SimpleHealth -> On damaged
  Action: Camera -> Shake
  Action: Audio -> Play "hit"
  // Only fires when damage gets past all pools to real health

Event: Player.SimpleHealth -> On any status removed
  Action: StatusLog -> Append LastStatus & " wore off"
  // One handler for every status ending
```

---

## 14. Game Use Cases

### 1) Basic player damage loop

**Scenario:** Player loses health on enemy contact and dies at 0.

```text
Event: Player collides with Enemy
  Action: Player.SimpleHealth -> "Take damage", 15

Event: Player.SimpleHealth -> On death
  Action: System -> Go to layout "GameOver"
  // Minimal complete loop
```

### 2) Basic healing pickup

**Scenario:** Pickup restores health and is consumed.

```text
Event: Player collides with HealthPickup
  Action: Player.SimpleHealth -> "Heal", 20
  Action: HealthPickup -> Destroy
  // Healing is automatically capped by max health
```

### 3) Breakable crate with auto-destroy

**Scenario:** Crates should vanish immediately at death.

```text
Event: On start of layout
  Action: Crate.SimpleHealth -> "Set invulnerable", False
  // Crate behavior property Destroy on Death should be enabled

Event: Bullet collides with Crate
  Action: Crate.SimpleHealth -> "Take damage", 999
```

### 4) Boss health bar

**Scenario:** UI bar reflects boss HP continuously.

Layer structure:

```text
[UI]
  [BossBar]
[Gameplay]
  [Boss]
```

Event sheet:

```text
Event: Every tick
  Action: BossBarFill -> Set width to (Boss.SimpleHealth.HealthPercent / 100) * 600
  // Directly consume percentage expression
```

### 5) Spawn shield window

**Scenario:** Player is protected for the first 2 seconds after spawn.

```text
Event: On start of layout
  Action: Player.SimpleHealth -> "Set invulnerable", True
  Action: System -> Wait 2.0 seconds
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Intro safety buffer
```

### 6) Post-hit i-frames

**Scenario:** After being hit, player gets brief immunity.

```text
Event: Player.SimpleHealth -> On damaged
  Action: Player.SimpleHealth -> "Set invulnerable", True
  Action: System -> Wait 0.4 seconds
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Prevent rapid multi-hit stacks
```

### 7) Difficulty scaling on wave start

**Scenario:** Enemies gain more max HP each wave.

```text
Event: On wave started
  Action: For each Enemy
    Action: Enemy.SimpleHealth -> "Set max health", 100 + (waveIndex * 20)
    Action: Enemy.SimpleHealth -> "Set health", 100 + (waveIndex * 20)
  // Reinitialize active enemies to scaled values
```

### 8) Revive at checkpoint

**Scenario:** Dead player can respawn at checkpoint with full HP.

```text
Event: On key R pressed
  Condition: Player.SimpleHealth -> Is dead
  Action: Player.SimpleHealth -> "Revive", -1
  Action: Player -> Set position to Checkpoint.X, Checkpoint.Y
  // Quick retry loop
```

### 9) Damage number popups

**Scenario:** Spawn floating text showing last damage amount.

```text
Event: Enemy.SimpleHealth -> On damaged
  Action: System -> Create object "DamageText" at Enemy.X, Enemy.Y
  Action: DamageText -> Set text to "-" & int(Enemy.SimpleHealth.LastDamage)
  // LastDamage is the damage that actually reached real health
```

### 10) Heal number popups

**Scenario:** Show green healing numbers when healed.

```text
Event: Player.SimpleHealth -> On healed
  Action: System -> Create object "HealText" at Player.X, Player.Y
  Action: HealText -> Set text to "+" & int(Player.SimpleHealth.LastHeal)
  // Hooked to heal trigger
```

### 11) One-hit kill hazard with state guard

**Scenario:** Lava should kill living targets only.

```text
Event: Player touches Lava
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: Player.SimpleHealth -> "Set health", 0
  // Explicit kill without relying on large damage values
```

### 12) Save/load checkpoint health

**Scenario:** Preserve exact HP, pools and statuses when saving at checkpoints.

```text
Event: Player overlaps Checkpoint
  Action: System -> Save game to slot "checkpoint"

Event: On continue selected
  Action: System -> Load game from slot "checkpoint"
  // Restores behavior state automatically
```

### 13) Shield that breaks and shows feedback

**Scenario:** Player has a shield that blocks damage, plays a sound when hit, and breaks with a visual effect.

```text
Event: On start of layout
  Action: Player.SimpleHealth -> "Setup health pool", "shield", 100, 0, 1.0, 0

Event: Player.SimpleHealth -> On health pool absorbed damage
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_hit"
    Action: ShieldText -> Set text to int(Player.SimpleHealth.PoolHealth("shield"))

Event: Player.SimpleHealth -> On health pool depleted
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_break"
    Action: Player -> Flash white
```

### 14) Decaying barrier (time-based)

**Scenario:** A buff grants a barrier that fades over 10 seconds regardless of hits.

```text
Event: Player collects Barrier Powerup
  Action: Player.SimpleHealth -> "Setup health pool", "barrier", 200, 20, 1.0, 0
  // Decays 20 per second, so it lasts 10 seconds with no hits

Event: Every tick
  Action: BarrierBar -> Set width to (Player.SimpleHealth.PoolHealth("barrier") / 200) * 200

Event: Player.SimpleHealth -> On health pool depleted
  Sub-condition: Player.SimpleHealth -> Triggering health pool is "barrier"
    Action: Audio -> Play "barrier_expired"
```

### 15) Layered armour + shield

**Scenario:** Boss has armour (damaged at a reduced rate) underneath a shield (takes full damage first).

```text
Event: On start of layout
  Action: Boss.SimpleHealth -> "Setup health pool", "shield", 150, 0, 1.0, 0
  // Priority 0 absorbs first
  Action: Boss.SimpleHealth -> "Setup health pool", "armour", 300, 0, 0.5, 1
  // Priority 1 absorbs once the shield is gone

Event: Boss.SimpleHealth -> On health pool depleted
  Sub-condition: Boss.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_break"
  Sub-condition: Boss.SimpleHealth -> Triggering health pool is "armour"
    Action: Audio -> Play "armour_destroyed"
    // Now real health is exposed
```

### 16) Damage resistance (armoured enemy)

**Scenario:** An armoured enemy takes only 50% of incoming damage without changing its max HP.

```text
Event: On enemy spawned
  Action: Enemy.SimpleHealth -> "Set health absorption rate", 0.5
  // All damage reaching real health is halved

Event: Player attacks enemy
  Action: Enemy.SimpleHealth -> "Take damage", 40
  // Enemy only loses 20 HP
```

### 17) Type weakness / vulnerability

**Scenario:** A fire elemental takes double damage from water attacks.

```text
Event: WaterProjectile overlaps FireEnemy
  Action: FireEnemy.SimpleHealth -> "Set health absorption rate", 2.0
  Action: FireEnemy.SimpleHealth -> "Take damage", WaterProjectile.BaseDamage
  Action: FireEnemy.SimpleHealth -> "Set health absorption rate", 1.0
  // Double damage for this hit only, then restore

Event: FireEnemy.SimpleHealth -> On damaged
  Action: System -> Create object "WeaknessFX" at FireEnemy.X, FireEnemy.Y
```

### 18) Combined: shield pool + resistant real health

**Scenario:** A tank unit has a shield that absorbs full damage; once it is gone, real health only takes 40% of leftover damage.

```text
Event: On start of layout
  Action: Tank.SimpleHealth -> "Set health absorption rate", 0.4
  // Real health resists all overflow damage
  Action: Tank.SimpleHealth -> "Setup health pool", "shield", 200, 0, 1.0, 0
  // Shield absorbs the first 200 damage at full rate

Event: Tank.SimpleHealth -> On health pool depleted
  Sub-condition: Tank.SimpleHealth -> Triggering health pool is "shield"
    Action: Audio -> Play "shield_break"
```

### 19) Timed resistance buff as a status

**Scenario:** A "Fortify" spell makes the player take 25% damage for 5 seconds.

```text
Event: Player uses Fortify
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: Player.SimpleHealth -> "Apply status", "fortify", 5, seconds, 1
  Action: Player.SimpleHealth -> "Set health absorption rate", 0.25

Event: Player.SimpleHealth -> On status "fortify" removed
  Action: Player.SimpleHealth -> "Set health absorption rate", 1.0
  // Timer, save/load and cleanup handled by the status; no Wait needed
```

### 20) Combined pattern: boss phase + pool + invulnerability + revive

**Scenario:** Boss gains a phase shield at low HP; the player can continue after dying.

```text
Event: Every tick
  Condition: Boss.SimpleHealth.HealthPercent <= 25
  Condition: Boss.SimpleHealth -> Health pool "phase_shield" has health (inverted)
  Condition: Trigger once while true
    Action: Boss.SimpleHealth -> "Setup health pool", "phase_shield", 500, 0, 1.0, 0

Event: Boss.SimpleHealth -> On health pool depleted
  Sub-condition: Boss.SimpleHealth -> Triggering health pool is "phase_shield"
    Action: Audio -> Play "phase_shield_break"

Event: Player.SimpleHealth -> On death
  Action: UI -> Show "Use Continue?"

Event: ContinueAccepted = True
  Action: Player.SimpleHealth -> "Revive", -1
  Action: Player.SimpleHealth -> "Set invulnerable", True
  Action: System -> Wait 1.0 seconds
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Revive + temporary protection
```

### 21) Burning damage over time

**Scenario:** Fire attacks set enemies on fire for 4 seconds, 5 damage per second.

```text
Event: Enemy.On created
  Action: Enemy.SimpleHealth -> "Set status periodic", "burn", damage, 5, 1

Event: Fireball collides with Enemy
  Action: Enemy.SimpleHealth -> "Apply status", "burn", 4, seconds, 1
  Action: Fireball -> Destroy

Event: Enemy.SimpleHealth -> On status "burn" applied
  Action: Enemy -> Set effect "Tint" enabled
Event: Enemy.SimpleHealth -> On status "burn" removed
  Action: Enemy -> Set effect "Tint" disabled
```

A 4 second burn with a 1 second interval ticks exactly 4 times.

### 22) Burning ground that keeps refreshing

**Scenario:** Standing in fire keeps you burning; stepping out lets it run out.

```text
Event: Player is overlapping FireTile
  Condition: Every 0.5 seconds
  Action: Player.SimpleHealth -> "Apply status", "burn", 3, seconds, 1

Event: On start of layout
  Action: Player.SimpleHealth -> "Set status stacking", "burn", 1, refresh, 0
  // One stack, duration resets while standing in fire
```

Reapplying keeps the tick timer, so the player still takes damage once per second.

### 23) Stun that stops movement

**Scenario:** A stun blocks input for 1.5 seconds.

```text
Event: Player.SimpleHealth -> On status "stun" applied
  Action: Player -> Set Platform ignoring input

Event: Player.SimpleHealth -> On status "stun" removed
  Action: Player -> Set Platform not ignoring input

Event: Shockwave hits Player
  Action: Player.SimpleHealth -> "Apply status", "stun", 1.5, seconds, 1
```

Using `On status removed` for cleanup means death, cleanse and expiry all restore input.

### 24) Deckbuilder poison

**Scenario:** Poison deals damage equal to its stacks each turn, then loses one stack.

```text
Event: On start of layout
  Action: Enemy.SimpleHealth -> "Set status periodic", "poison", damage, 1, 1
  Action: Enemy.SimpleHealth -> "Set status stacking", "poison", -1, keep, 1

Event: Card "Poison Stab" played on Enemy
  Action: Enemy.SimpleHealth -> "Apply status", "poison", -1, turns, 3

Event: Enemy turn starts
  Action: Enemy.SimpleHealth -> "Advance status turns", 1
```

### 25) Skip a unit's turn while asleep

**Scenario:** Sleeping units lose their action for a number of turns.

```text
Event: Unit's turn starts
  Action: Unit.SimpleHealth -> "Advance status turns", 1
  Sub-condition: Unit.SimpleHealth -> Has status "sleep"
    Action: TurnManager -> End turn for Unit
    // Still asleep, skip the action
```

### 26) Regeneration that stays quiet at full health

**Scenario:** A regen buff heals 3 per second for 10 seconds, with green numbers only when it heals.

```text
Event: Player drinks RegenPotion
  Action: Player.SimpleHealth -> "Set status periodic", "regen", heal, 3, 1
  Action: Player.SimpleHealth -> "Apply status", "regen", 10, seconds, 1

Event: Player.SimpleHealth -> On healed
  Condition: Player.SimpleHealth.LastHealStatus = "regen"
  Action: System -> Create object "HealText" at Player.X, Player.Y
  Action: HealText -> Set text to "+" & int(Player.SimpleHealth.LastHeal)
```

At full health the regen tick is skipped, so no `+3` numbers pop up.

### 27) Status icon bar with timers

**Scenario:** Show an icon, stack count and time left for every active status.

```text
Event: Every tick
  Action: StatusIcon -> Destroy
  Repeat Player.SimpleHealth.StatusCount times
    Local: name = Player.SimpleHealth.StatusByIndex(loopindex)
    Action: System -> Create object "StatusIcon" at 24 + loopindex * 48, 24
    Action: StatusIcon -> Set animation to name
    Action: StatusIcon -> Set text to Player.SimpleHealth.StatusStacks(name)
    Action: StatusIcon -> Set width to 40 * (Player.SimpleHealth.StatusRemaining(name) / Player.SimpleHealth.StatusDuration(name))
    // Permanent statuses report -1; check for it if you draw timers
```

### 28) Freeze time for enemies

**Scenario:** A time-stop power pauses enemy statuses while the player keeps moving.

```text
Event: Player uses TimeStop
  Action: System -> Set Enemy time scale to 0
  Action: System -> Wait 3 seconds
  Action: System -> Restore Enemy time scale
  // Seconds-based statuses follow each object's time scale
```

### 29) Cleanse with a limit

**Scenario:** A cleanse removes up to 2 stacks of bleed and all poison.

```text
Event: Player uses Cleanse
  Action: Player.SimpleHealth -> "Remove status stacks", "bleed", 2
  Action: Player.SimpleHealth -> "Remove status", "poison"
```

### 30) Poison that ignores shields (custom tick)

**Scenario:** Poison should bypass health pools and damage real health directly.

```text
Event: On start of layout
  Action: Player.SimpleHealth -> "Set status periodic", "poison", none, 0, 1
  // Type none: the behavior only handles timing

Event: Player.SimpleHealth -> On status "poison" ticked
  Action: Player.SimpleHealth -> "Set health", Player.SimpleHealth.CurrentHealth - 2 * Player.SimpleHealth.StatusStacks("poison")
  // Set health skips pools; LastDamageStatus stays empty for custom damage
```

### 31) Crops that need watering (non-combat turns)

**Scenario:** In a farming game each day is a turn; unwatered crops take blight damage.

```text
Event: Day ends
  Action: Crop.SimpleHealth -> "Advance status turns", 1
  Sub-condition: Crop.SimpleHealth -> Has status "watered" (inverted)
    Action: Crop.SimpleHealth -> "Apply status", "blight", -1, turns, 1

Event: Player waters Crop
  Action: Crop.SimpleHealth -> "Apply status", "watered", 1, turns, 1
  Action: Crop.SimpleHealth -> "Remove status", "blight"

Event: Crop.SimpleHealth -> On death
  Action: Crop -> Set animation to "withered"
```

Set up blight once with `"Set status periodic", "blight", damage, 10, 1`.

### Other game use cases

**Platformers.** Health, i-frames after hits, and a `"poison"` status from swamp water that ticks until the player finds a cure.

**Twin-stick shooters.** Shield pools that recharge between waves and burn statuses from flamethrowers.

**Survivors-likes.** Hundreds of enemies with aura statuses; the behavior handles every tick, so there is no per-enemy timer loop in the event sheet.

**Roguelike deckbuilders.** Poison, vulnerable and weak as turn statuses that stack, drain and expire when the player ends their turn.

**Tactics games.** Fire, bleed and stun as turn statuses advanced per team, with pools as cover or armour.

**Monster-taming RPGs.** Sleep, burn and paralysis as turn statuses; sleep skips the monster's move while active.

**ARPGs.** Stacking bleed with a max stack cap, burning ground that refreshes, and regen potions.

**MOBAs and hero shooters.** Regen, damage over time, and a stun that disables abilities in your events.

**Tower defense.** Slow and freeze statuses on creeps read by your movement events, plus burn from fire towers.

**Fighting games.** Guard as a health pool that absorbs chip damage, and a dizzy status after a combo.

**Soulslikes.** Poise as a pool, bleed build-up as stacks that expire, and a poison status from swamps.

**Survival games.** Hunger and cold as permanent statuses that deal damage every few seconds until fixed.

**Idle and incremental games.** Turn-based "cycles" that advance statuses on each production step.

**Farming and life sims.** Crops and animals with vitality, watered and sick statuses measured in days.

**Racing games.** Vehicle health with an armour pool and a burning status after a crash.

**Strategy games.** Buildings under siege with burn statuses and repair regen.

**Card battlers.** Units with shield pools and stacking statuses advanced per round.

**Stealth games.** A "spotted" status on guards that expires and triggers AI changes when removed.

**Puzzle games.** Blocks with health and a "cracked" status that expires into destruction.

**Horror games.** A sanity bar as health and a "panic" status that ticks damage while the player stays in darkness.

**Educational games.** Quiz "lives" as health and a "hint cooldown" as a timed status.

---

## 15. C3 Debugger

Simple Health implements `_getDebuggerProperties`, so live state appears in the Construct debugger.

### What sections the debugger shows

- **Behavior name** (for example `SimpleHealth`): health, flags and every health pool. Most values are editable.
- **Behavior name - Statuses**: the Clear Statuses on Death flag, the last status and last damage status, and each active status's stacks (editable) and time left.

### Debug fields reference

| Field | Meaning |
|---|---|
| **destroyOnDeath** | Whether this instance destroys itself on death. |
| **maxHealth** | Current max health. |
| **CurrentHealth** | Current health value. |
| **Invulnerable** | Current damage-immunity flag. |
| **isDead** | Current dead-state flag. |
| **lastDamage** | Last damage that reached real health. |
| **lastHeal** | Last heal amount. |
| **healthAbsorptionRate** | Current multiplier on damage to real health. |
| **lastPoolName** | Name of the pool that fired the most recent pool trigger. |
| **pool[name].amount** | Current amount in a pool (one set of entries per pool). |
| **pool[name].decayRate** | Decay rate of a pool. |
| **pool[name].absorptionRate** | Absorption rate of a pool. |
| **pool[name].priority** | Absorption priority of a pool. |
| **clearStatusesOnDeath** | Whether statuses are cleared on death. |
| **lastStatus** | Name of the status that fired the most recent status trigger. |
| **lastDamageStatus** | Status behind the last damage, empty for direct hits. |
| **[status].stacks** | Stacks of an active status. Setting it to 0 removes the status. |
| **[status].remaining** | Time or turns left, or "permanent". |

### How to open the debugger

1. Preview your project in debug mode.
2. Open the Construct debugger panel.
3. Select an instance that has Simple Health.
4. Inspect the behavior sections and watch values update in real time.

Debugger validation example:

```text
Event: Press key K
  Action: Player.SimpleHealth -> "Apply status", "burn", 5, seconds, 3
  // Watch burn.stacks and burn.remaining in the Statuses section
```

---

## 16. Scripting

Actions, conditions and expressions are also available from script under their **ACE name** in PascalCase (for example `ApplyStatus`, `TakeDamage`, `StatusStacks`). These call exactly the same code as the event sheet, with the same side effects and triggers. The exceptions are `HealthAbsorptionRate` and the deprecated `Temp...` pool expressions, which are event-sheet only; use `PoolHealth`, `PoolAbsorptionRate` and the other new pool expressions from script.

### Accessing the behavior

The behavior is reached through the name it has in your project (shown in the Behaviors dialog), not the addon ID:

```js
const player = runtime.objects.Player.getFirstInstance();
const health = player.behaviors.SimpleHealth;
```

### Calling actions

Parameters are in the same order as in the event sheet. Dropdown parameters take the 0-based index; for statuses you can also pass the option name as a string.

```js
health.TakeDamage(10);
health.Heal(25);
health.SetupTempHealthPool("shield", 100, 0, 1, 0);   // "Setup health pool"
health.ApplyStatus("burn", 5, "seconds", 1);          // or 0 for seconds, 1 for turns
health.SetStatusPeriodic("burn", "damage", 3, 1);     // or 1 for damage
health.SetStatusStacking("poison", -1, "keep", 1);    // or 2 for keep
health.AdvanceStatusTurns(1);
```

Health pool ACEs keep their original script names from before the rename (`AddTempHealth`, `SetTempHealth`, `SetupTempHealthPool`, and so on).

### Reading state

```js
health.CurrentHealth();
health.PoolHealth("shield");
health.HasStatus("stun");          // true / false
health.StatusStacks("poison");
health.StatusRemaining("burn");

for (let i = 0; i < health.StatusCount(); i++) {
  console.log(health.StatusByIndex(i));
}
```

### Triggers

Triggers (`On damaged`, `On status ticked`, and so on) run event sheet blocks; this version does not dispatch script events. From script, either call your own function from those events or check state with the methods above.

### A complete example

```js
// Apply a stacking bleed and report how dangerous it is
function applyBleed(enemy, stacks) {
  const h = enemy.behaviors.SimpleHealth;
  h.SetStatusStacking("bleed", 10, "refresh", 0);
  h.SetStatusPeriodic("bleed", "damage", 2, 0.5);
  h.ApplyStatus("bleed", 4, "seconds", stacks);
  const perSecond = h.StatusStacks("bleed") * 2 / 0.5;
  console.log(`Bleeding for ${perSecond} damage per second`);
}
```

---

## 17. Feature Deep-Dive: Trigger Timing and Event Ordering

This section explains the order in which triggers fire, so you know what each expression holds inside each trigger.

### Non-lethal damage flow

`Take damage` passes through pools (firing pool triggers), then updates health and fires `On damaged`, then `On health changed`.

```text
Event: Enemy.SimpleHealth -> On damaged
  Action: EnemySprite -> Flash red
  // Safe place for hit reactions when target survived
```

### Healing flow

`Heal` updates current health (capped) and then fires `On healed`, then `On health changed`.

### Lethal damage flow

On a lethal hit: health is clamped to 0, the dead flag is set, `On death` fires once, statuses are cleared (if enabled, firing `On status removed` for each), `On health changed` fires, and finally the instance is destroyed if **Destroy on Death** is on.

### Status tick flow

For each active status, every frame (seconds) or every advanced turn (turns):

1. The time left counts down.
2. If a tick is due: its damage or healing is applied (which fires `On damaged`, `On healed`, `On death` and so on as normal).
3. `On status ticked` fires. `LastTickAmount`, `LastStatus` and (for damage that reached real health) `LastDamageStatus` are set.
4. Stacks are drained if **stacks lost per tick** is set. At 0 stacks the status expires.
5. If the time left reached 0, the status expires: `On status expired`, then `On status removed`, then `On any status removed`.

If a tick kills the instance, processing stops immediately and no other status ticks on that frame or turn.

```text
Event: Enemy.SimpleHealth -> On status "burn" ticked
  Action: System -> Create object "Ember" at Enemy.X, Enemy.Y
  // Runs after the burn damage for this tick was applied
```

---

## 18. Tips and Common Mistakes

- **Do not pass negative amounts** to `Take damage` or `Heal`; validate inputs first.
- **Invulnerability only blocks damage**, not `Set health`.
- **Avoid overriding loaded HP** after `Load game` with startup reset events.
- **Use `Is dead` before gameplay actions** (shoot, move, interact) when needed.
- **Use `Set max health` + `Set health` together** when rescaling entities mid-run.
- **`Revive` does not fire `On healed`**; use `On revived` for revive effects.
- **Use expressions for UI every tick**, but triggers for one-shot effects.
- **Pool priority decides damage order**: lower numbers absorb first; equal priorities go in creation order.
- **`Setup health pool` replaces** the amount, rates and priority; use `Add to health pool` to stack on top.
- **`LastDamage` only reflects damage that reached real health**; use `LastPoolDamageAbsorbed` for the absorbed part.
- **Use `Is health pool` inside pool triggers** rather than reading `LastPoolName` in a separate every-tick event.
- **Absorption rate `0` is invulnerability**: it turns on the Invulnerable flag and blocks `Take damage` entirely, pools included. Use a tiny value like `0.001` if pools should still absorb while real health is immune.
- **Absorption rate only affects damage that gets past every pool**; pool-absorbed damage is unaffected.
- **Clean up in `On status removed`, not `On status expired`**: expired only covers running out naturally, while removed covers every way a status ends.
- **Status names ignore case, pool names do not**: `"Burn"` and `"burn"` are one status, but two different pools.
- **Turns statuses never move on their own**: call `Advance status turns` from your turn system.
- **Configure once, apply many times**: status settings persist on the instance after the status ends.
- **Periodic amounts are fixed when set**: rerun `Set status periodic` if the amount should follow changing stats.
- **Permanent statuses report `-1`** for `StatusRemaining` and `StatusDuration`; handle it in timer UI.

Validation example:

```text
Event: Attempt to shoot
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: PlayerWeapon -> Shoot
  // Prevent dead-state action leaks
```

---

## 19. Upgrading from 1.2.x

Version 1.3.0.0 renames **Temporary Health** to **Health Pools** and adds Status Effects. Your existing projects open and run unchanged: only the names shown in Construct changed, and the old expressions still work.

| Before 1.3.0.0 | From 1.3.0.0 |
|---|---|
| Category "Temporary Health" | Category "Health Pools" |
| Setup temp health pool | Setup health pool |
| Add temp health | Add to health pool |
| Set temp health | Set health pool |
| Set temp health rates | Set health pool rates |
| Set temp health decay rate | Set health pool decay rate |
| Set temp health absorption rate | Set health pool absorption rate |
| Set temp health pool priority | Set health pool priority |
| Clear temp health | Clear health pool |
| Clear all temp health | Clear all health pools |
| Has temp health | Health pool has health |
| Has any temp health | Any health pool has health |
| Temp health pool is type | Is health pool |
| On temp health absorbed damage | On health pool absorbed damage |
| On temp health depleted | On health pool depleted |
| On temp health added | On health pool increased |
| `TempHealth(pool)` | `PoolHealth(pool)` |
| `TempHealthAbsorptionRate(pool)` | `PoolAbsorptionRate(pool)` |
| `TempHealthDecayRate(pool)` | `PoolDecayRate(pool)` |
| `TempHealthPriority(pool)` | `PoolPriority(pool)` |
| `LastTempDamageAbsorbed` | `LastPoolDamageAbsorbed` |
| `LastTempHealthType` | `LastPoolName` |

Other changes to be aware of:

- Event sheet rows now show the object and behavior name first, for example `Player (SimpleHealth): Take 10 damage`.
- The new **Clear Statuses on Death** property defaults to on. It has no effect until you use statuses.
- Old expressions are marked deprecated in the addon but may still appear in the expression picker, labelled "Deprecated: use ...". Prefer the new names in new events.
