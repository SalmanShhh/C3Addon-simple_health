<img src="./src/icon.svg" width="100" /><br>
# Simple Health
<i>A complete health management behavior for Construct 3 with damage, healing, and death detection.</i> <br>
### Version 1.3.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon-simple_health/releases/download/salmanshh_simple_health-1.3.0.0.c3addon/salmanshh_simple_health-1.3.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon-simple_health/releases) </sub> <br>

#### What's New in 1.3.0.0
**Added:**
- Status Effects: named statuses (burn, poison, stun, regen...) timed in seconds or turns.
- Status stacking with max stacks, reapply modes (refresh / extend / keep) and stacks lost per tick.
- Periodic status damage and healing that flows through health pools and absorption rate.
- Advance status turns action for turn-based games.
- Status triggers: On status applied / reapplied / ticked / expired / removed, plus On any status applied / removed.
- Status expressions: StatusStacks, StatusRemaining, StatusDuration, StatusCount, StatusByIndex, LastStatus, LastTickAmount, LastDamageStatus, LastHealStatus.
- Clear Statuses on Death property.
- New pool expressions: PoolHealth, PoolAbsorptionRate, PoolDecayRate, PoolPriority, LastPoolDamageAbsorbed, LastPoolName.

**Changed:**
- "Temporary Health" is now called "Health Pools" (display names only, existing projects are unaffected).
- Event sheet text now shows the object and behavior name ({my}).
- Deprecated TempHealth, TempHealthAbsorptionRate, TempHealthDecayRate, TempHealthPriority, LastTempDamageAbsorbed and LastTempHealthType in favour of the new Pool expressions.
- Deprecated ACEs are now hidden from the pickers, including Set health pool decay rate and Set health pool absorption rate (deprecated since 1.2.0.0; use Set health pool rates). Existing events keep working.


<sub>[View full changelog](#changelog)</sub>

---
<b><u>Author:</u></b> SalmanShh <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Max Health | Initial maximum health for instances with this behavior. | float |
| Invulnerable | Start instances invulnerable to damage. | check |
| Destroy on Death | Destroy the instance when it dies. | check |
| Clear Statuses on Death | Remove all active statuses when the instance dies. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Heal | Increase health by the specified amount (up to max health). | Amount             *(number)* <br> |
| Revive | Revive the instance. Use -1 to restore to max health, or specify an amount. | Amount             *(number)* <br> |
| Set health | Set the instance's current health (clamped between 0 and max). | Amount             *(number)* <br> |
| Set health absorption rate | Set the multiplier applied to damage that reaches real health. 1.0 = normal, 0.5 = 50% damage taken (resistance), 2.0 = double damage taken (vulnerability), 0 = immune. | Rate             *(number)* <br> |
| Set invulnerable | Set whether the instance is invulnerable to damage. | Invulnerable             *(boolean)* <br> |
| Set max health | Set the instance's maximum health (minimum 1). | Amount             *(number)* <br> |
| Take damage | Reduce health by the specified amount. | Amount             *(number)* <br> |
| Advance status turns | Advance all turn-based statuses: tick, drain stacks and expire them. | Turns             *(number)* <br> |
| Apply status | Apply or reapply a status for a duration in seconds or turns. | Status             *(string)* <br>Duration             *(number)* <br>Unit             *(combo)* <br>Stacks             *(number)* <br> |
| Clear all statuses | Remove every active status, firing 'On status removed' for each. |  |
| Remove status | Remove a status immediately, firing 'On status removed'. | Status             *(string)* <br> |
| Remove status stacks | Remove stacks from a status. Reaching 0 stacks removes the status. | Status             *(string)* <br>Count             *(number)* <br> |
| Set status periodic | Set the damage or healing a status applies on each tick. | Status             *(string)* <br>Type             *(combo)* <br>Amount per stack             *(number)* <br>Interval             *(number)* <br> |
| Set status remaining | Set the seconds or turns left on an active status. 0 expires it, -1 makes it permanent. | Status             *(string)* <br>Remaining             *(number)* <br> |
| Set status stacking | Set how a status stacks and how its duration reacts to reapplying. | Status             *(string)* <br>Max stacks             *(number)* <br>On reapply             *(combo)* <br>Stacks lost per tick             *(number)* <br> |
| Add to health pool | Add health to a named health pool. | Pool             *(string)* <br>Amount             *(number)* <br> |
| Clear all health pools | Empty every health pool on this instance. |  |
| Clear health pool | Empty a named health pool. | Pool             *(string)* <br> |
| Set health pool | Set a named health pool to a specific amount. | Pool             *(string)* <br>Amount             *(number)* <br> |
| Set health pool absorption rate | Set pool health lost per 1 damage. 1 = equal, 0.5 = armour-style, 2 = fragile. | Pool             *(string)* <br>Rate             *(number)* <br> |
| Set health pool decay rate | Set how much a health pool drains per second. 0 disables decay. | Pool             *(string)* <br>Rate             *(number)* <br> |
| Set health pool priority | Set a pool's absorption priority. Lower numbers absorb damage first. Default 0. | Pool             *(string)* <br>Priority             *(number)* <br> |
| Set health pool rates | Set a health pool's decay rate and absorption rate in one action. | Pool             *(string)* <br>Decay rate             *(number)* <br>Absorption rate             *(number)* <br> |
| Setup health pool | Fully configure a health pool: amount, decay rate, absorption rate and priority. | Pool             *(string)* <br>Amount             *(number)* <br>Decay rate             *(number)* <br>Absorption rate             *(number)* <br>Priority             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| Is dead | True if the instance is dead (health is 0). |  |
| Is invulnerable | True if the instance is currently invulnerable to damage. |  |
| On damaged | Trigger when the instance takes damage. |  |
| On death | Trigger when the instance dies. |  |
| On healed | Trigger when the instance is healed. |  |
| On health changed | Triggers whenever health changes for any reason (damage, healing, set health, revive, or max health clamp). |  |
| On revived | Triggers when the instance is revived from death. |  |
| Has any status | True if any status is currently active. |  |
| Has status | True if the status is currently active. | Status *(string)* <br> |
| On any status applied | Triggers when any status becomes active. Use LastStatus for its name. |  |
| On any status removed | Triggers whenever any status ends. Use LastStatus for its name. |  |
| On status applied | Triggers when a status becomes active. | Status *(string)* <br> |
| On status expired | Triggers when a status runs out of time or stacks. | Status *(string)* <br> |
| On status reapplied | Triggers when a status is applied while already active. | Status *(string)* <br> |
| On status removed | Triggers whenever a status ends for any reason. Use for cleanup. | Status *(string)* <br> |
| On status ticked | Triggers after each tick of a status. Use LastTickAmount for the tick amount. | Status *(string)* <br> |
| Any health pool has health | True if any health pool has health remaining. |  |
| Health pool has health | True if the named health pool has health remaining. | Pool *(string)* <br> |
| Is health pool | True if the pool that fired the last pool trigger has this name. | Pool *(string)* <br> |
| On health pool absorbed damage | Triggers when a health pool absorbs incoming damage, even partially. |  |
| On health pool increased | Triggers when health is added to a pool. Use LastPoolName for the pool. |  |
| On health pool depleted | Triggers when a health pool reaches zero, from damage or decay. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| CurrentHealth | Current health of the instance. | number |  | 
| HealthAbsorptionRate | The current damage multiplier applied to real health. 1.0 = normal, 0.5 = resistance, 2.0 = vulnerability. | number |  | 
| HealthPercent | Current health as a percentage of max health. | number |  | 
| LastDamage | Amount of last damage taken. | number |  | 
| LastHeal | Amount of last healing applied. | number |  | 
| MaxHealth | Maximum health of the instance. | number |  | 
| LastDamageStatus | Name of the status that caused LastDamage. Empty if the damage was direct. | string |  | 
| LastHealStatus | Name of the status that caused LastHeal. Empty if the heal was direct. | string |  | 
| LastStatus | Name of the status that fired the most recent status trigger. | string |  | 
| LastTickAmount | Amount the most recent status tick tried to apply, before health pools and absorption. | number |  | 
| StatusByIndex | Name of the active status at a 0-based index, in the order they became active. | string | Index *(number)* <br> | 
| StatusCount | Number of active statuses. | number |  | 
| StatusDuration | Duration the status was last applied with. -1 if permanent, 0 if not active. | number | Status *(string)* <br> | 
| StatusRemaining | Seconds or turns left on a status. -1 if permanent, 0 if not active. | number | Status *(string)* <br> | 
| StatusStacks | Current stacks of a status. 0 if not active. | number | Status *(string)* <br> | 
| LastPoolDamageAbsorbed | Incoming damage absorbed by the pool that fired the last pool trigger. | number |  | 
| LastPoolName | Name of the health pool that fired the most recent pool trigger. | string |  | 
| LastTempDamageAbsorbed | Deprecated: use LastPoolDamageAbsorbed. Incoming damage absorbed by the pool that fired the last pool trigger. | number |  | 
| LastTempHealthType | Deprecated: use LastPoolName. Name of the health pool that fired the most recent pool trigger. | string |  | 
| PoolAbsorptionRate | Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style. | number | Pool *(string)* <br> | 
| PoolDecayRate | Pool health lost per second for a named pool. | number | Pool *(string)* <br> | 
| PoolHealth | Current health of a named pool. | number | Pool *(string)* <br> | 
| PoolPriority | Absorption priority of a named pool. Lower numbers absorb first. 0 if the pool does not exist. | number | Pool *(string)* <br> | 
| TempHealth | Deprecated: use PoolHealth. Current health of a named pool. | number | Pool *(string)* <br> | 
| TempHealthAbsorptionRate | Deprecated: use PoolAbsorptionRate. Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style. | number | Pool *(string)* <br> | 
| TempHealthDecayRate | Deprecated: use PoolDecayRate. Pool health lost per second for a named pool. | number | Pool *(string)* <br> | 
| TempHealthPriority | Deprecated: use PoolPriority. Absorption priority of a named pool. Lower numbers absorb first. 0 if the pool does not exist. | number | Pool *(string)* <br> | 


---
## Changelog

### Version 1.3.0.0

**Added:**
- Status Effects: named statuses (burn, poison, stun, regen...) timed in seconds or turns.
- Status stacking with max stacks, reapply modes (refresh / extend / keep) and stacks lost per tick.
- Periodic status damage and healing that flows through health pools and absorption rate.
- Advance status turns action for turn-based games.
- Status triggers: On status applied / reapplied / ticked / expired / removed, plus On any status applied / removed.
- Status expressions: StatusStacks, StatusRemaining, StatusDuration, StatusCount, StatusByIndex, LastStatus, LastTickAmount, LastDamageStatus, LastHealStatus.
- Clear Statuses on Death property.
- New pool expressions: PoolHealth, PoolAbsorptionRate, PoolDecayRate, PoolPriority, LastPoolDamageAbsorbed, LastPoolName.

**Changed:**
- "Temporary Health" is now called "Health Pools" (display names only, existing projects are unaffected).
- Event sheet text now shows the object and behavior name ({my}).
- Deprecated TempHealth, TempHealthAbsorptionRate, TempHealthDecayRate, TempHealthPriority, LastTempDamageAbsorbed and LastTempHealthType in favour of the new Pool expressions.
- Deprecated ACEs are now hidden from the pickers, including Set health pool decay rate and Set health pool absorption rate (deprecated since 1.2.0.0; use Set health pool rates). Existing events keep working.

---

### Version 1.2.1.0

**Added:**
- Add Revive Action
- On Health Changed Condition
- Trigger condition for Health pool Added.


---

### Version 1.2.0.2

**Added:**
- Damage priority for Temporary Health : A number assigned to each pool. Pools are consumed in ascending order (lowest number first). Default is `0`. Equal-priority pools are consumed in creation order.

---

### Version 1.2.0.1

---

### Version 1.2.0.0

**Added:**
- Add Temporary Health Pools support.
- Set custom Absorption rates for Health & Temporary Health.
- Temporary Health (Absorption Rate / Decay Rate)

---

### Version 1.1.1.0

**Added:**
- Fix bug thatcan make "On death" trigger twice for a single lethal hit
- Create Guide

---

### Version 1.1.0.0

**Added:**
Debugger will display the name given to the behaviour.

---

### Version 1.0.0.0

**Added:**
Initial release.

---
