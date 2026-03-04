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
7. [Save/Load and Persistence](#7-saveload-and-persistence)
8. [Actions Reference](#8-actions-reference)
9. [Conditions Reference](#9-conditions-reference)
10. [Expressions Reference](#10-expressions-reference)
11. [Triggers Reference](#11-triggers-reference)
12. [Game Use Cases](#12-game-use-cases)
13. [C3 Debugger](#13-c3-debugger)
14. [Feature Deep-Dive: Trigger Timing and Event Ordering](#14-feature-deep-dive-trigger-timing-and-event-ordering)
15. [Tips and Common Mistakes](#15-tips-and-common-mistakes)

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

## 7. Save/Load and Persistence

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

### Event sheet example

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

## 8. Actions Reference

### Health

| Action | Description |
|---|---|
| **Take damage** | Subtracts the given amount from current health unless dead or invulnerable. Handles death checks automatically. |
| **Heal** | Adds the given amount to current health up to max health, unless dead. |
| **Set health** | Directly sets current health, clamped between 0 and max health. Can trigger death when crossing to 0 from alive. |
| **Set max health** | Sets maximum health with a floor of 1, and clamps current health down if it now exceeds max. |
| **Set invulnerable** | Turns damage immunity on or off for future `Take damage` calls. |
| **Revive** | Clears dead state and restores current health to max health. |

Action usage example:

```text
Event: Difficulty changed to Hard
  Action: Enemy.SimpleHealth -> "Set max health", 250
  Action: Enemy.SimpleHealth -> "Set health", 250
  // Re-scales active enemies for new difficulty
```

---

## 9. Conditions Reference

| Condition | Description |
|---|---|
| **Is dead** | True when this instance is in dead state (health reached 0 and death logic applied). |
| **Is invulnerable** | True when this instance currently ignores `Take damage`. |

Condition usage example:

```text
Event: On fire button pressed
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: PlayerWeapon -> Shoot
  // Prevent actions while dead
```

---

## 10. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| **CurrentHealth** | Number | Current health value for this instance. |
| **MaxHealth** | Number | Current max-health cap for this instance. |
| **HealthPercent** | Number | Health percentage in the 0..100 range. |
| **LastDamage** | Number | Most recent value passed to `Take damage`. |
| **LastHeal** | Number | Most recent value passed to `Heal`. |

Expression usage example:

```text
Event: Every tick
  Action: HPText -> Set text to "HP: " & int(Player.SimpleHealth.CurrentHealth) & "/" & int(Player.SimpleHealth.MaxHealth)
  // Live HUD readout
```

---

## 11. Triggers Reference

| Trigger | Description |
|---|---|
| **On damaged** | Fires when non-lethal damage is applied successfully. |
| **On healed** | Fires when healing is applied successfully (while alive). |
| **On death** | Fires when the instance enters dead state. |

Trigger usage example:

```text
Event: Player.SimpleHealth -> On damaged
  Action: Camera -> Shake
  Action: Audio -> Play "hit"
  // Hit feedback pipeline
```

---

## 12. Game Use Cases

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

### 13) Combined pattern: boss phase + invulnerability + revive fallback

**Scenario:** Boss enters shielded phase at low HP; player can still revive.

```text
Event: Every tick
  Condition: Boss.SimpleHealth.HealthPercent <= 25
  Action: Boss.SimpleHealth -> "Set invulnerable", True
  // Phase transition to shielded mode

Event: BossShieldBroken = True
  Action: Boss.SimpleHealth -> "Set invulnerable", False

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

## 13. C3 Debugger

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

## 14. Feature Deep-Dive: Trigger Timing and Event Ordering

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

## 15. Tips and Common Mistakes

- **Do not pass negative amounts** to `Take damage` or `Heal`; validate inputs first.
- **Remember invulnerability only blocks damage**, not `Set health`.
- **Avoid overriding loaded HP** after `Load game` with startup reset events.
- **Use `Is dead` before gameplay actions** (shoot, move, interact) when needed.
- **Use `Set max health` + `Set health` together** when rescaling entities mid-run.
- **Do not assume `Revive` triggers heal events**; fire your own revive FX/SFX.
- **Use expressions for UI every tick**, but use triggers for one-shot effects.

Validation example:

```text
Event: Attempt to shoot
  Condition: Player.SimpleHealth -> Is dead (inverted)
  Action: PlayerWeapon -> Shoot
  // Prevent dead-state action leaks
```
