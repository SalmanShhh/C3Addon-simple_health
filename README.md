<img src="./src/icon.svg" width="100" /><br>
# Simple Health
<i>A complete health management behavior for Construct 3 with damage, healing, and death detection.</i> <br>
### Version 1.3.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon-simple_health/releases/download/salmanshh_simple_health-1.3.0.0.c3addon/salmanshh_simple_health-1.3.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon-simple_health/releases) </sub> <br>

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
| Description | Download |
| --- | --- |
| simple health example | [<img src="https://placehold.co/120x30/4493f8/FFF?text=Download&font=montserrat" width="120"/>](https://github.com/SalmanShhh/C3Addon-simple_health/raw/refs/heads/main/examples/simple%20health%20example.c3p) |

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Debug Mode | Write health events, and actions that were ignored, to the browser console to help find mistakes in events. Turn off for release. | check |
| Max Health | Initial maximum health for instances with this behavior. | float |
| Invulnerable | Start instances invulnerable to damage. | check |
| Destroy on Death | Destroy the instance when it dies. | check |
| Clear Statuses on Death | Remove all active statuses when the instance dies. | check |
| Enabled | When disabled, damage, healing and new statuses are ignored, and pool decay and status timers pause. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Heal | Increase health by the specified amount (up to max health). | Amount             *(number)* <br> |
| Revive | Revive the instance. Use -1 to restore to max health, or specify an amount. | Amount             *(number)* <br> |
| Set enabled | Enable or disable the behavior. Disabled ignores damage, healing and new statuses, and pauses timers. | State             *(combo)* <br> |
| Set health | Set the instance's current health (clamped between 0 and max). | Amount             *(number)* <br> |
| Set health absorption rate | Set the multiplier applied to damage that reaches real health. 1.0 = normal, 0.5 = 50% damage taken (resistance), 2.0 = double damage taken (vulnerability), 0 = immune. | Rate             *(number)* <br> |
| Set invulnerable | Set whether the instance is invulnerable to damage. | Invulnerable             *(boolean)* <br> |
| Set max health | Set the instance's maximum health (minimum 1). | Amount             *(number)* <br> |
| Take damage | Reduce health by the specified amount. | Amount             *(number)* <br> |
| Advance status turns | Advance all turn-based statuses: tick, drain stacks and expire them. | Turns             *(number)* <br> |
| Apply status | Apply or reapply a status for a duration in seconds or turns. | Status             *(string)* <br>Duration             *(number)* <br>Unit             *(combo)* <br>Stacks             *(number)* <br> |
| Clear all statuses | Remove every active status, firing On status (Removed) for each. |  |
| Remove status | Remove a status immediately, firing On status (Removed). | Status             *(string)* <br> |
| Remove status stacks | Remove stacks from a status. Reaching 0 stacks removes the status. | Status             *(string)* <br>Count             *(number)* <br> |
| Set status modifier | Set a multiplier the status applies while active. Several statuses multiply together. | Status             *(string)* <br>Modifier             *(combo)* <br>Multiplier             *(number)* <br> |
| Set status time remaining | Set the time remaining on an active status, in its unit. 0 expires it, -1 makes it permanent. | Status             *(string)* <br>Time remaining             *(number)* <br> |
| Set status stacking | Set how a status stacks and how its duration reacts to reapplying. | Status             *(string)* <br>Max stacks             *(number)* <br>Reapply mode             *(combo)* <br>Stacks lost per tick             *(number)* <br> |
| Set status tick | Set how often a status ticks and the damage or healing each tick applies. | Status             *(string)* <br>Type             *(combo)* <br>Amount per stack             *(number)* <br>Interval             *(number)* <br> |
| Add to health pool | Add health to a named health pool. | Pool             *(string)* <br>Amount             *(number)* <br> |
| Clear all health pools | Empty every health pool on this instance. |  |
| Clear health pool | Empty a named health pool. | Pool             *(string)* <br> |
| Set health pool absorption multiplier | Multiply every health pool's absorption rate without changing the rates themselves. | Multiplier             *(number)* <br> |
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
| Is enabled | True if the behavior is enabled. |  |
| Is invulnerable | True if the instance is currently invulnerable to damage. |  |
| On damaged | Trigger when the instance takes damage. |  |
| On death | Trigger when the instance dies. |  |
| On healed | Trigger when the instance is healed. |  |
| On health changed | Triggers whenever health changes for any reason (damage, healing, set health, revive, or max health clamp). |  |
| On revived | Triggers when the instance is revived from death. |  |
| Has any status | True if any status is currently active. |  |
| Has status | True if the status is currently active. | Status *(string)* <br> |
| On any status | Triggers when any status is applied, reapplied, ticks, expires or is removed. Use LastStatus for its name. | Event *(combo)* <br> |
| On status | Triggers when a status is applied, reapplied, ticks, expires or is removed. | Status *(string)* <br>Event *(combo)* <br> |
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
| StatusRemaining | Time remaining on a status, in seconds or turns. -1 if permanent, 0 if not active. | number | Status *(string)* <br> | 
| StatusStacks | Current stacks of a status. 0 if not active. | number | Status *(string)* <br> | 
| LastPoolDamageAbsorbed | Incoming damage absorbed by the pool that fired the last pool trigger. | number |  | 
| LastPoolName | Name of the health pool that fired the most recent pool trigger. | string |  | 
| LastTempDamageAbsorbed | Deprecated: use LastPoolDamageAbsorbed. Incoming damage absorbed by the pool that fired the last pool trigger. | number |  | 
| LastTempHealthType | Deprecated: use LastPoolName. Name of the health pool that fired the most recent pool trigger. | string |  | 
| PoolAbsorptionMultiplier | Multiplier currently applied to every pool's absorption rate: the global multiplier times every active status's. | number |  | 
| PoolAbsorptionRate | Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style. | number | Pool *(string)* <br> | 
| PoolByIndex | Name of the health pool at a 0-based index, in the order pools absorb damage (priority, then creation). | string | Index *(number)* <br> | 
| PoolCount | Number of health pools on this instance, including empty ones. | number |  | 
| PoolDecayRate | Pool health lost per second for a named pool. | number | Pool *(string)* <br> | 
| PoolHealth | Current health of a named pool. | number | Pool *(string)* <br> | 
| PoolPriority | Absorption priority of a named pool. Lower numbers absorb first. 0 if the pool does not exist. | number | Pool *(string)* <br> | 
| TempHealth | Deprecated: use PoolHealth. Current health of a named pool. | number | Pool *(string)* <br> | 
| TempHealthAbsorptionRate | Deprecated: use PoolAbsorptionRate. Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style. | number | Pool *(string)* <br> | 
| TempHealthDecayRate | Deprecated: use PoolDecayRate. Pool health lost per second for a named pool. | number | Pool *(string)* <br> | 
| TempHealthPriority | Deprecated: use PoolPriority. Absorption priority of a named pool. Lower numbers absorb first. 0 if the pool does not exist. | number | Pool *(string)* <br> | 
