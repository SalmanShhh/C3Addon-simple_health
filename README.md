<img src="./src/icon.svg" width="100" /><br>
# Simple Health
<i>A complete health management behavior for Construct 3 with damage, healing, and death detection.</i> <br>
### Version 1.2.0.2

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon-simple_health/releases/download/salmanshh_simple_health-1.2.0.2.c3addon/salmanshh_simple_health-1.2.0.2.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon-simple_health/releases) </sub> <br>

#### What's New in 1.2.0.2
**Added:**
- Damage priority for Temporary Health : A number assigned to each pool. Pools are consumed in ascending order (lowest number first). Default is `0`. Equal-priority pools are consumed in creation order.


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


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Heal | Increase health by the specified amount (up to max health). | Amount             *(number)* <br> |
| Revive | Revive the instance and restore it to max health. |  |
| Set health | Set the instance's current health (clamped between 0 and max). | Amount             *(number)* <br> |
| Set health absorption rate | Set the multiplier applied to damage that reaches real health. 1.0 = normal, 0.5 = 50% damage taken (resistance), 2.0 = double damage taken (vulnerability), 0 = immune. | Rate             *(number)* <br> |
| Set invulnerable | Set whether the instance is invulnerable to damage. | Invulnerable             *(boolean)* <br> |
| Set max health | Set the instance's maximum health (minimum 1). | Amount             *(number)* <br> |
| Take damage | Reduce health by the specified amount. | Amount             *(number)* <br> |
| Add temp health | Add to a named temporary health pool. | Type             *(string)* <br>Amount             *(number)* <br> |
| Clear all temp health | Remove all temporary health from every named pool. |  |
| Clear temp health | Remove all temporary health from a named pool. | Type             *(string)* <br> |
| Set temp health | Set a named temporary health pool to a specific value. | Type             *(string)* <br>Amount             *(number)* <br> |
| Set temp health absorption rate | Set how much of a named pool is consumed per 1 point of incoming damage. 1.0 = equal, 0.5 = armour-style (1 dmg costs 0.5 armour), 2.0 = fragile shield. | Type             *(string)* <br>Rate             *(number)* <br> |
| Set temp health decay rate | Set how much a named temporary health pool drains per second. 0 disables decay. | Type             *(string)* <br>Rate             *(number)* <br> |
| Set temp health pool priority | Set the damage-absorption priority for a named pool. Lower numbers are consumed first. Default is 0. Use this to reorder existing pools without changing their amounts or rates. | Type             *(string)* <br>Priority             *(number)* <br> |
| Set temp health rates | Set both the decay rate (HP lost per second) and absorption rate (temp HP cost per 1 damage) for a named pool in one action. | Type             *(string)* <br>Decay rate             *(number)* <br>Absorption rate             *(number)* <br> |
| Setup temp health pool | Fully configure a named temporary health pool in one action — sets the amount, decay rate, absorption rate, and priority together. | Type             *(string)* <br>Amount             *(number)* <br>Decay rate             *(number)* <br>Absorption rate             *(number)* <br>Priority             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| Is dead | True if the instance is dead (health is 0). |  |
| Is invulnerable | True if the instance is currently invulnerable to damage. |  |
| On damaged | Trigger when the instance takes damage. |  |
| On death | Trigger when the instance dies. |  |
| On healed | Trigger when the instance is healed. |  |
| Has any temp health | True if any temporary health pool has health remaining. |  |
| Has temp health | True if a specific named temporary health pool has any health remaining. | Type *(string)* <br> |
| Temp health pool is type | True if the temporary health pool that fired the last trigger matches the given type name. Use inside 'On temp health depleted' or 'On temp health absorbed damage' to filter by pool. | Type *(string)* <br> |
| On temp health absorbed damage | Triggers when temporary health intercepts incoming damage (even partially). |  |
| On temp health depleted | Triggers when temporary health reaches zero (from damage or time decay). |  |


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
| LastTempDamageAbsorbed | The amount of incoming damage intercepted by temporary health on the last hit. | number |  | 
| LastTempHealthType | The name of the temporary health pool that fired the most recent 'On temp health depleted' or 'On temp health absorbed damage' trigger. | string |  | 
| TempHealth | Current temporary health of a named pool. | number | Type *(string)* <br> | 
| TempHealthAbsorptionRate | Temp health cost per 1 point of incoming damage for a named pool (absorption rate). 1.0 = equal, 0.5 = armour-style. | number | Type *(string)* <br> | 
| TempHealthDecayRate | Temporary health lost per second for a named pool (time-based decay rate). | number | Type *(string)* <br> | 
| TempHealthPriority | Damage absorption priority of the named pool. Lower numbers are consumed first. Returns 0 if the pool does not exist. | number | Type *(string)* <br> | 


---
## Changelog

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
