# Simple Health - Complete Guide

**Simple Health** is a Construct 3 **behavior** that gives any object a full health system without writing custom bookkeeping events for every object type. It handles **damage**, **healing**, **death detection**, **invulnerability**, and health-related values you can read in conditions/expressions, so you can build player, enemy, and destructible-object health flows quickly and consistently.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Project Setup](#2-project-setup)
3. [Plugin Properties](#3-plugin-properties)
4. [Dealing Damage and Healing](#4-dealing-damage-and-healing)
5. [Death, Revive, and Destruction](#5-death-revive-and-destruction)
6. [Invulnerability Windows](#6-invulnerability-windows)
7. [Temporary Health](#7-temporary-health)
8. [Save/Load and Persistence](#8-saveload-and-persistence)
9. [Actions Reference](#9-actions-reference)
10. [Conditions Reference](#10-conditions-reference)
11. [Expressions Reference](#11-expressions-reference)
12. [Triggers Reference](#12-triggers-reference)
13. [Game Use Cases](#13-game-use-cases)
14. [C3 Debugger](#14-c3-debugger)
15. [Feature Deep-Dive: Trigger Timing and Event Ordering](#15-feature-deep-dive-trigger-timing-and-event-ordering)
16. [Tips and Common Mistakes](#16-tips-and-common-mistakes)

---

## 1. Core Concepts

### The problem this addon solves

Without a dedicated health behavior, you usually duplicate the same event logic across multiple object types: track current HP, clamp values, detect death, prevent actions when dead, and keep “last damage/heal” values for UI/FX. That grows into fragile event sheets where one enemy type handles edge cases differently than another. **Simple Health** centralizes that logic so all attached objects follow the same health rules.

### Key design decisions

- **Per-instance ownership**: this is a **behavior**, so each object instance has its own independent health state.
- **Clamped health range**: health is constrained to **0..MaxHealth**.
- **Dead-state guardrails**: when dead, the behavior blocks `Take damage`, `Heal`, and `Set health` calls.
- **Invulnerability scope**: invulnerability blocks **damage only**; it does not block direct `Set health`.
- **Optional auto-destroy**: death can optionally destroy the host instance.

Event example:

```text
Event: Enemy collides with Bullet
  Action: Enemy.SimpleHealth -> "Take damage", 25
  // One action handles subtraction, clamp, and death checks
```

### Key concepts at a glance

| Concept | What it means |
|---|---|
| **Current Health** | The live health value for this object instance. |
| **Max Health** | Upper limit for health; `Set max health` enforces a minimum of 1. |
| **Dead State** | Boolean state where health reached 0 and death logic has run. |
| **Invulnerable State** | Boolean state that ignores incoming `Take damage` calls. |
| **Last Damage / Last Heal** | Most recent numeric values passed to `Take damage` or `Heal`. |
| **Health Absorption Rate** | A damage multiplier (0.0–n) applied to any damage that reaches real health after all temp pools. `1.0` = normal, `0.5` = 50% resistance, `2.0` = double damage taken. |

### Scenarios where this addon excels

- **Player survivability systems**: consistent player HP handling with death trigger hooks.
- **Enemy health across many archetypes**: attach once, reuse the same events everywhere.
- **Breakable world objects**: crates/barrels that die and optionally self-destroy.
- **Boss phase scripting**: trigger logic when health crosses thresholds using expressions.
- **UI/feedback pipelines**: drive floating numbers, hit flashes, and health bars from triggers/expressions.
- **Temporary immunity mechanics**: invulnerability windows after hits or during dashes.

Event example:

```text
Event: On player dash starts
  Action: Player.SimpleHealth -> "Set invulnerable", True
  // Dash grants temporary damage immunity
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
| **Invulnerable** | Check | `False` | If enabled, instance starts immune to `Take damage`. |
| **Destroy on Death** | Check | `False` | If enabled, instance is destroyed when death occurs. |

Property-driven startup example:

```text
Event: On start of layout
  Condition: Player.SimpleHealth -> Is invulnerable
  Action: UI -> Set text to "Spawn Shield Active"
  // Reads configured startup invulnerability directly
```

---

## 4. Dealing Damage and Healing

This group covers how to reduce/increase health and read recent health deltas.

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
- `Take damage` ignores calls while invulnerable.
- Negative values are not blocked; passing negative numbers can create counterintuitive results.

Defensive example:

```text
Event: Apply incoming damage
  Condition: incomingDamage > 0
  Action: Target.SimpleHealth -> "Take damage", incomingDamage
  // Prevent accidental negative damage values
```

---

## 5. Death, Revive, and Destruction

This section controls death flow, respawn logic, and optional automatic destruction.

### What it does and when to use it

Use `On death` as the central hook for VFX/SFX, score, drops, and progression. Use `Revive` for respawn-style loops. Enable **Destroy on Death** when the object should be removed immediately at death.

### How to configure or call it

- Property: **Destroy on Death**
- Action: `Revive`
- Condition: `Is dead`
- Trigger: `On death`

### Event sheet example

```text
Event: Enemy.SimpleHealth -> On death
  Action: System -> Add 100 to Score
  Action: LootTable -> SpawnDropAt(Enemy.X, Enemy.Y)
  // Death trigger as single source for kill handling

Event: Player presses R
  Condition: Player.SimpleHealth -> Is dead
  Action: Player.SimpleHealth -> "Revive"
  Action: Player -> Set position to SpawnPoint.X, SpawnPoint.Y
  // Basic respawn flow
```

### Edge cases and gotchas

- `Revive` sets health to max and clears dead flag, but does not fire `On healed`.
- If **Destroy on Death** is true, the instance can be destroyed immediately after death trigger logic.
- In current implementation, lethal `Take damage` can fire `On death` twice (see section 14).

Safe destroy-handling example:

```text
Event: Enemy.SimpleHealth -> On death
  Action: System -> Create object "DeathFX" at Enemy.X, Enemy.Y
  // Keep death effects in this trigger so they run before possible destruction
```

---

## 6. Invulnerability Windows

Invulnerability is ideal for i-frames, spawn protection, cinematic immunity, and scripted “cannot die yet” moments.

### What it does and when to use it

When invulnerable is true, `Take damage` exits early with no health loss and no damage trigger.

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
- If you forget to unset invulnerability, the object appears immortal.

Verification example:

```text
Event: Every 1 second
  Condition: Player.SimpleHealth -> Is invulnerable
  Action: DebugText -> Set text to "INVULNERABLE"
  // Quick runtime check during balancing
```

---

## 7. Temporary Health

Temporary health sits in front of real health and absorbs incoming damage before it reaches the main health pool. It is organized into **named pools** — independent silos identified by a string key (e.g. `"shield"`, `"armour"`, `"barrier"`). Each pool is completely separate; multiple pools can be active at the same time and are consumed in the order they were created.

### Key concepts

| Concept | What it means |
|---|---|
| **Pool name / type** | A string key that identifies one silo. Names are case-sensitive. |
| **Amount** | How much temporary health the pool currently holds. |
| **Decay rate** | HP the pool loses per second automatically (0 = no decay). |
| **Absorption rate** | How much pool HP is spent per 1 point of incoming damage. `1.0` = equal trade. `0.5` = armour-style (1 damage costs only 0.5 pool HP, so 100 armour blocks 200 incoming damage). `2.0` = fragile shield (1 damage costs 2 pool HP). |
| **Damage priority** | Pools are hit in insertion order (first created = first consumed). |

### Three built-in pool behaviours

| Type | How to configure |
|---|---|
| **Simple shield** — absorbs damage, no recovery | `Setup "shield" \| amount 100 \| decay 0 \| absorption 1.0` |
| **Decaying shield** — drains away over time | `Setup "shield" \| amount 100 \| decay 10/s \| absorption 1.0` |
| **Armour** — consumed at a reduced rate | `Setup "armour" \| amount 200 \| decay 0 \| absorption 0.5` |

These are not exclusive — you can stack all three pool types on the same object simultaneously.

### Setting up a pool

The fastest way to configure a pool is a single `Setup temp health pool` action:

```text
Event: Player equips shield
  Action: Player.SimpleHealth -> "Setup temp health pool", "shield", 100, 0, 1.0
  // Creates/resets the "shield" pool with 100 HP, no decay, 1:1 absorption

Event: Player equips armour
  Action: Player.SimpleHealth -> "Setup temp health pool", "armour", 200, 0, 0.5
  // 1 incoming damage only costs 0.5 armour HP — 200 armour blocks 400 total damage

Event: Buff applied: fading barrier
  Action: Player.SimpleHealth -> "Setup temp health pool", "barrier", 150, 25, 1.0
  // barrier drains 25 HP/s even when not being hit
```

If you only need to adjust rates on an existing pool without changing the amount, use `Set temp health rates`:

```text
Event: Armour upgrade acquired
  Action: Player.SimpleHealth -> "Set temp health rates", "armour", 0, 0.25
  // Upgrade absorption rate to 0.25 — 1 damage now costs only 0.25 armour HP
```

### How damage flows through pools

When `Take damage` is called:

1. Each pool is checked **in insertion order**.
2. The pool absorbs as much damage as it can based on its `absorptionRate`.
3. If the pool is exhausted, overflow moves to the next pool in order.
4. Any remaining damage after all pools are drained hits real health.
5. `On temp health absorbed damage` fires for each pool that intercepted damage.
6. `On temp health depleted` fires for each pool that reached zero.

Real health and all existing health triggers (`On damaged`, `On death`) only fire if damage leaks through all pools.

### Filtering trigger events by pool

Both `On temp health depleted` and `On temp health absorbed damage` fire for any pool. Use `Temp health pool is type` as a sub-condition to run specific logic per pool:

```text
Event: Player.SimpleHealth -> On temp health depleted
  Sub-condition: Player.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_break"
    Action: Player -> Flash white

Event: Player.SimpleHealth -> On temp health depleted
  Sub-condition: Player.SimpleHealth -> Temp health pool is "armour"
    Action: Audio -> Play "armour_crack"
```

You can also read which pool triggered the event from the expression `LastTempHealthType`.

### Removing temporary health

```text
Event: Player.SimpleHealth -> "Clear temp health", "shield"
  // Removes the shield pool's HP (pool entry remains, amount = 0)

Event: Level transition
  Action: Player.SimpleHealth -> "Clear all temp health"
  // Zeros every pool at once
```

### Edge cases and gotchas

- Calling `Setup temp health pool` on an existing pool **replaces** its amount and rates entirely.
- Calling `Add temp health` on a pool that does not exist yet auto-creates it with `decayRate = 0` and `absorptionRate = 1.0`.
- An empty pool (amount = 0) is skipped during damage calculation — it does not block damage.
- `Absorption rate = 0` makes a pool effectively invincible from damage (it will never be consumed by hits, only by decay).
- Temporary health is **not** restored by `Heal` or `Revive`; manage it explicitly with pool actions.
- Pool state is **fully serialized** by save/load.

---

## 8. Save/Load and Persistence

The behavior supports Construct save/load by serializing internal health state.

### What it does and when to use it

Use this when your game uses savegames, checkpoints, or layout persistence and health state must restore correctly.

### Serialized fields

- Max health
- Current health
- Invulnerable state
- Destroy-on-death flag
- Dead state
- Last damage value
- Last heal value
- All temporary health pools (name, amount, decay rate, absorption rate)
- Health absorption rate

```text
Event: Player enters SavePoint
  Action: System -> Save game to slot "slot1"
  // Behavior state is included in C3 save data

Event: On start of layout
  Condition: globalShouldLoad = True
  Action: System -> Load game from slot "slot1"
  // Restores health/death/invulnerable and last delta values
```

### Edge cases and gotchas

- If you manually reset health after load in startup events, you can overwrite loaded values.
- Last damage/heal restore exactly as saved; clear your UI if you treat them as one-shot messages.

---

## 9. Actions Reference

### Health

| Action | Parameters | Description |
|---|---|---|
| **Take damage** | amount | Subtracts from current health unless dead or invulnerable. Pools intercept first. |
| **Heal** | amount | Adds to current health up to max health, unless dead. Does not restore temp health. |
| **Set health** | amount | Directly sets current health, clamped 0..max. Can trigger death. |
| **Set max health** | amount | Sets max health (minimum 1), clamps current health if needed. |
| **Set invulnerable** | state | Turns damage immunity on or off. |
| **Revive** | — | Clears dead state and restores current health to max. Does not restore temp health. |
| **Set health absorption rate** | rate | Sets the damage multiplier applied to real health after all temp pools. `1.0` = normal, `0.5` = 50% resistance, `2.0` = vulnerability. Minimum `0`. |

### Temporary Health

| Action | Parameters | Description |
|---|---|---|
| **Setup temp health pool** | type, amount, decayRate, absorptionRate | Create or fully reset a named pool in one action. The recommended way to grant temp health. |
| **Add temp health** | type, amount | Add to the amount of a named pool (auto-creates pool with default rates if new). |
| **Set temp health** | type, amount | Set a named pool's amount to an exact value. |
| **Set temp health rates** | type, decayRate, absorptionRate | Set both rates for an existing pool without changing its amount. |
| **Clear temp health** | type | Zero the amount of one named pool. |
| **Clear all temp health** | — | Zero the amount of every pool. |

Action usage example:

```text
Event: Difficulty changed to Hard
  Action: Enemy.SimpleHealth -> "Set max health", 250
  Action: Enemy.SimpleHealth -> "Set health", 250
  // Re-scales active enemies for new difficulty

Event: Boss phase 2 begins
  Action: Boss.SimpleHealth -> "Setup temp health pool", "phase_shield", 500, 0, 1.0
  // Grants a named shield pool that must be broken before dealing real damage
```

---

## 10. Conditions Reference

### Health

| Condition | Description |
|---|---|
| **Is dead** | True when this instance is in dead state (health reached 0 and death logic applied). |
| **Is invulnerable** | True when this instance currently ignores `Take damage`. |

### Temporary Health

| Condition | Parameters | Description |
|---|---|---|
| **Has temp health** | type | True if the named pool currently has any amount remaining. Invertible. |
| **Has any temp health** | — | True if any pool has any amount remaining. Invertible. |
| **Temp health pool is type** | type | True if the pool that fired the last temp health trigger matches the given name. Use inside `On temp health depleted` or `On temp health absorbed damage` to branch by pool. |

Condition usage example:

```text
Event: On fire button pressed
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: PlayerWeapon -> Shoot
  // Prevent actions while dead

Event: On shield upgrade button pressed
  Condition: Player.SimpleHealth -> Has temp health "shield" (inverted)
  Action: Player.SimpleHealth -> "Setup temp health pool", "shield", 100, 0, 1.0
  // Only grant a shield if one is not already active
```

---

## 11. Expressions Reference

### Health

| Expression | Returns | Description |
|---|---|---|
| **CurrentHealth** | Number | Current health value for this instance. |
| **MaxHealth** | Number | Current max-health cap for this instance. |
| **HealthPercent** | Number | Health percentage in the 0..100 range. |
| **LastDamage** | Number | Most recent damage that reached real health via `Take damage`. |
| **LastHeal** | Number | Most recent value passed to `Heal`. |
| **HealthAbsorptionRate** | Number | Current damage multiplier applied to real health. `1.0` by default. |

### Temporary Health

| Expression | Parameters | Returns | Description |
|---|---|---|---|
| **TempHealth** | type (string) | Number | Current amount in the named pool. Returns 0 if the pool does not exist. |
| **TempHealthDecayRate** | type (string) | Number | Decay rate (HP/s) of the named pool. |
| **TempHealthAbsorptionRate** | type (string) | Number | Absorption rate of the named pool. |
| **LastTempDamageAbsorbed** | — | Number | Incoming damage intercepted by the pool that most recently fired a trigger. |
| **LastTempHealthType** | — | String | Name of the pool that fired the most recent `On temp health depleted` or `On temp health absorbed damage` trigger. |

Expression usage example:

```text
Event: Every tick
  Action: HPText -> Set text to "HP: " & int(Player.SimpleHealth.CurrentHealth) & "/" & int(Player.SimpleHealth.MaxHealth)
  // Live HUD readout

Event: Every tick
  Action: ShieldBar -> Set width to (Player.SimpleHealth.TempHealth("shield") / 100) * 200
  // Shield bar scales with shield pool amount

Event: Player.SimpleHealth -> On temp health absorbed damage
  Action: ShieldHitText -> Set text to "-" & int(Player.SimpleHealth.LastTempDamageAbsorbed)
  // Floating number showing how much the shield just blocked
```

---

## 12. Triggers Reference

### Health

| Trigger | Description |
|---|---|
| **On damaged** | Fires when damage reaches real health (non-lethal). Fires only after all temp health pools are drained. |
| **On healed** | Fires when healing is applied successfully (while alive). |
| **On death** | Fires when real health reaches zero. |

### Temporary Health

| Trigger | Description |
|---|---|
| **On temp health absorbed damage** | Fires once per pool that intercepted any portion of an incoming hit. |
| **On temp health depleted** | Fires when any pool's amount reaches zero (from damage or time decay). |

Use `Temp health pool is type` as a sub-condition inside either trigger to run pool-specific logic:

```text
Event: Player.SimpleHealth -> On temp health depleted
  Sub-condition: Player.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_break"

Event: Player.SimpleHealth -> On damaged
  Action: Camera -> Shake
  Action: Audio -> Play "hit"
  // Only fires when damage gets past all pools to real health
```

---

## 13. Game Use Cases

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

**Scenario:** Player is protected for first 2 seconds after spawn.

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
  Action: Player.SimpleHealth -> "Revive"
  Action: Player -> Set position to Checkpoint.X, Checkpoint.Y
  // Quick retry loop
```

### 9) Damage number popups

**Scenario:** Spawn floating text showing last damage amount.

```text
Event: Enemy.SimpleHealth -> On damaged
  Action: System -> Create object "DamageText" at Enemy.X, Enemy.Y
  Action: DamageText -> Set text to "-" & int(Enemy.SimpleHealth.LastDamage)
  // LastDamage gives exact applied input
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

**Scenario:** Preserve exact HP when saving at checkpoints.

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
  Action: Player.SimpleHealth -> "Setup temp health pool", "shield", 100, 0, 1.0

Event: Player.SimpleHealth -> On temp health absorbed damage
  Sub-condition: Player.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_hit"
    Action: ShieldText -> Set text to int(Player.SimpleHealth.TempHealth("shield"))

Event: Player.SimpleHealth -> On temp health depleted
  Sub-condition: Player.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_break"
    Action: Player -> Flash white
```

### 14) Decaying barrier (time-based)

**Scenario:** A buff grants a barrier that fades over 10 seconds regardless of hits.

```text
Event: Player collects Barrier Powerup
  Action: Player.SimpleHealth -> "Setup temp health pool", "barrier", 200, 20, 1.0
  // Decays 20 HP/s → lasts 10 seconds with no hits

Event: Every tick
  Action: BarrierBar -> Set width to (Player.SimpleHealth.TempHealth("barrier") / 200) * 200

Event: Player.SimpleHealth -> On temp health depleted
  Sub-condition: Player.SimpleHealth -> Temp health pool is "barrier"
    Action: Audio -> Play "barrier_expired"
```

### 15) Layered armour + shield

**Scenario:** Enemy has armour (damaged at reduced rate) underneath a shield (takes full damage first). Shield must be destroyed before armour starts taking hits.

```text
Event: On start of layout
  // Shield created first → consumed first
  Action: Boss.SimpleHealth -> "Setup temp health pool", "shield", 150, 0, 1.0
  // Armour created second → consumed after shield is gone
  Action: Boss.SimpleHealth -> "Setup temp health pool", "armour", 300, 0, 0.5

Event: Boss.SimpleHealth -> On temp health depleted
  Sub-condition: Boss.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_break"
  Sub-condition: Boss.SimpleHealth -> Temp health pool is "armour"
    Action: Audio -> Play "armour_destroyed"
    // Now real health is exposed
```

### 17) Damage resistance (armoured enemy)

**Scenario:** An armoured enemy takes only 50% of all incoming damage, making it tankier without changing its max HP.

```text
Event: On enemy spawned
  Action: Enemy.SimpleHealth -> "Set health absorption rate", 0.5
  // All damage reaching real health is halved

Event: Player attacks enemy
  Action: Enemy.SimpleHealth -> "Take damage", 40
  // Enemy only loses 20 HP; armour absorption handled invisibly
```

### 18) Type weakness / vulnerability

**Scenario:** A fire elemental takes double damage from water attacks.

```text
Event: WaterProjectile overlaps FireEnemy
  Action: FireEnemy.SimpleHealth -> "Set health absorption rate", 2.0
  Action: FireEnemy.SimpleHealth -> "Take damage", WaterProjectile.BaseDamage
  Action: FireEnemy.SimpleHealth -> "Set health absorption rate", 1.0
  // Temporarily double absorption for this hit, then restore

Event: FireEnemy.SimpleHealth -> On damaged
  Action: System -> Create object "WeaknessFX" at FireEnemy.X, FireEnemy.Y
```

### 19) Combined: temp shield + resistant real health

**Scenario:** A tank unit has a shield pool that absorbs full damage, and when the shield is gone, its real health only takes 40% of any leftover damage.

```text
Event: On start of layout
  Action: Tank.SimpleHealth -> "Set health absorption rate", 0.4
  // Real health passively resists all overflow damage
  Action: Tank.SimpleHealth -> "Setup temp health pool", "shield", 200, 0, 1.0
  // Shield absorbs first 200 damage at full rate

Event: Tank.SimpleHealth -> On temp health depleted
  Sub-condition: Tank.SimpleHealth -> Temp health pool is "shield"
    Action: Audio -> Play "shield_break"
    // Real health now exposed but still at 40% absorption
```

### 20) Dynamic resistance buff / debuff

**Scenario:** A "Fortify" spell makes the player take 25% damage for 5 seconds, then returns to normal.

```text
Event: Player uses Fortify
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: Player.SimpleHealth -> "Set health absorption rate", 0.25
  Action: FortifyFX -> Start animation
  Action: System -> Wait 5.0 seconds
  Action: Player.SimpleHealth -> "Set health absorption rate", 1.0
  Action: FortifyFX -> Stop animation
  // Time-limited damage reduction without invulnerability

Event: Every tick
  Action: ResistText -> Set text to "Resistance: " & int((1 - Player.SimpleHealth.HealthAbsorptionRate) * 100) & "%"
  // Dynamic UI showing current resistance percentage
```

### 16) Combined pattern: boss phase + temp health + invulnerability + revive fallback

**Scenario:** Boss enters a shielded phase at low HP using a temp health pool; player can still revive.

```text
Event: Every tick
  Condition: Boss.SimpleHealth.HealthPercent <= 25
  Condition: Boss.SimpleHealth -> Has temp health "phase_shield" (inverted)
    Action: Boss.SimpleHealth -> "Setup temp health pool", "phase_shield", 500, 0, 1.0
    // Grant phase shield pool once when HP drops below 25%

Event: Boss.SimpleHealth -> On temp health depleted
  Sub-condition: Boss.SimpleHealth -> Temp health pool is "phase_shield"
    Action: Audio -> Play "phase_shield_break"
    // Real health is now exposed again

Event: Player.SimpleHealth -> On death
  Action: UI -> Show "Use Continue?"

Event: ContinueAccepted = True
  Action: Player.SimpleHealth -> "Revive"
  Action: Player.SimpleHealth -> "Set invulnerable", True
  Action: System -> Wait 1.0 seconds
  Action: Player.SimpleHealth -> "Set invulnerable", False
  // Revive + temporary protection
```

---

## 14. C3 Debugger

Simple Health implements `_getDebuggerProperties`, so live state appears in the Construct debugger.

### What sections the debugger shows

- One section titled with the behavior type name (for example, `Simple Health`).
- The section includes editable live values for key health fields.

### Debug fields reference

| Field | Meaning |
|---|---|
| **destroyOnDeath** | Whether this instance auto-destroys on death. |
| **maxHealth** | Current max health cap. |
| **CurrentHealth** | Current health value. |
| **Invulnerable** | Current damage-immunity flag. |
| **isDead** | Current dead-state flag. |
| **lastDamage** | Last damage amount received via `Take damage`. |
| **lastHeal** | Last heal amount received via `Heal`. |
| **lastTriggerTempType** | Name of the pool that fired the most recent temp health trigger. |
| **healthAbsorptionRate** | Current damage multiplier for real health. |
| **temp[name].amount** | Current amount in a named pool (one entry per pool). |
| **temp[name].decayRate** | Decay rate of a named pool. |
| **temp[name].absorptionRate** | Absorption rate of a named pool. |

### How to open the debugger

1. Preview your project.
2. Open the Construct debugger panel.
3. Select an instance that has Simple Health.
4. Inspect the behavior section and watch values update in real time.

Debugger validation example:

```text
Event: Press key K
  Action: Player.SimpleHealth -> "Take damage", 5
  // Confirm CurrentHealth drops and lastDamage updates in debugger
```

---

## 15. Feature Deep-Dive: Trigger Timing and Event Ordering

This section explains how health triggers fire during real gameplay events.

### Non-lethal damage flow

For non-lethal hits, the behavior updates values and then triggers `On damaged`.

```text
Event: Enemy hit by bullet
  Action: Enemy.SimpleHealth -> "Take damage", 10

Event: Enemy.SimpleHealth -> On damaged
  Action: EnemySprite -> Flash red
  // Safe place for hit reactions when target survived
```

### Healing flow

`Heal` updates current health (capped) and then triggers `On healed`.

```text
Event: Player uses potion
  Action: Player.SimpleHealth -> "Heal", 30

Event: Player.SimpleHealth -> On healed
  Action: UI -> Play "heal glow"
  // Runs immediately after successful heal
```

### Lethal damage flow

When `Take damage` is lethal, `takeDamage` clamps health to 0, sets dead state, fires `On death` once, and optionally destroys the instance — all in a single path.

---

## 16. Tips and Common Mistakes

- **Do not pass negative amounts** to `Take damage` or `Heal`; validate inputs first.
- **Remember invulnerability only blocks damage**, not `Set health`.
- **Avoid overriding loaded HP** after `Load game` with startup reset events.
- **Use `Is dead` before gameplay actions** (shoot, move, interact) when needed.
- **Use `Set max health` + `Set health` together** when rescaling entities mid-run.
- **Do not assume `Revive` triggers heal events**; fire your own revive FX/SFX.
- **Use expressions for UI every tick**, but use triggers for one-shot effects.
- **Pool creation order determines damage priority** — the first pool created is always consumed first.
- **`Setup temp health pool` replaces** the amount and both rates; use `Add temp health` if you want to stack on top of existing amounts.
- **Temp health is never restored by `Heal` or `Revive`** — manage pools with their own actions.
- **`LastDamage` only reflects damage that reached real health** — use `LastTempDamageAbsorbed` to read the intercepted portion.
- **An empty pool does not block damage** — a pool that exists with amount = 0 is simply skipped.
- **Use `Temp health pool is type` inside trigger events** rather than reading `LastTempHealthType` in a separate every-tick event.
- **Health absorption rate is not invulnerability** — it scales damage, so very small amounts of damage can still deplete health. Use `Set invulnerable` for true immunity.
- **Apply absorption rate before temp pools if you want resistance on everything** — absorption rate only affects damage that overflows past all temp pools, so pool-absorbed damage is unaffected.
- **Absorption rate 0 makes real health immune to overflow damage**, but temp pools will still be consumed. Use this to create a "pools must be drained first" pattern without hardcoding invulnerability.

Validation example:

```text
Event: Attempt to shoot
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: PlayerWeapon -> Shoot
  // Prevent dead-state action leaks
```
