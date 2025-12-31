<img src="./src/icon.svg" width="100" /><br>
# Simple Health
<i>A complete health management behavior for Construct 3 with damage, healing, and death detection.</i> <br>
### Version 1.1.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon-simple_health/releases/download/salmanshh_simple_health-1.1.0.0.c3addon/salmanshh_simple_health-1.1.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon-simple_health/releases) </sub> <br>

#### What's New in 1.1.0.0
**Added:**
Debugger will display the name given to the behaviour.


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
| Set invulnerable | Set whether the instance is invulnerable to damage. | Invulnerable             *(boolean)* <br> |
| Set max health | Set the instance's maximum health (minimum 1). | Amount             *(number)* <br> |
| Take damage | Reduce health by the specified amount. | Amount             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| Is dead | True if the instance is dead (health is 0). |  |
| Is invulnerable | True if the instance is currently invulnerable to damage. |  |
| On damaged | Trigger when the instance takes damage. |  |
| On death | Trigger when the instance dies. |  |
| On healed | Trigger when the instance is healed. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| CurrentHealth | Current health of the instance. | number |  | 
| HealthPercent | Current health as a percentage of max health. | number |  | 
| LastDamage | Amount of last damage taken. | number |  | 
| LastHeal | Amount of last healing applied. | number |  | 
| MaxHealth | Maximum health of the instance. | number |  | 


---
## Changelog

### Version 1.1.0.0

**Added:**
Debugger will display the name given to the behaviour.

---

### Version 1.0.0.0

**Added:**
Initial release.

---
