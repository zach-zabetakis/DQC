The following documentation will explain what each column represents in the various CSV data files. Column names MUST NOT be changed under any circumstances. All cells are case sensitive unless otherwise specified.

## Accessory

Multiple ACCESSORY items can be equipped.  All accessories count toward a character's six item carry limit. Note that description is used for display purposes only.

`(A) name` - accessory name

`(B) description` - flavor description for this accessory

`(C) buy_price` - price of this item if bought from a shop

`(D) equip.ranger` - can this be equipped by Rangers?

`(E) equip.soldier` - can this be equipped by Soldiers?

`(F) equip.fighter` - can this be equipped by Fighters?

`(G) equip.priest` - can this be equipped by Priests?

`(H) equip.wizard` - can this be equipped by Wizards?

`(I) attack` - attack bonus

`(J) defense` - defense bonus

`(K) strength` - strength bonus

`(L) agility` - agility bonus

`(M) critical` - critical bonus

`(N) dodge` - dodge bonus

`(O) resist.burn` - resistance against burn spells and skills

`(P) resist.numb` - resistance against paralysis

`(Q) saver.burn` - does this accessory have BURN SAVER?

`(R) saver.phys` - does this accessory have PHYS SAVER?

`(S) saver.ment` - does this accessory have MENT SAVER?

`(T) is_cursed` - is this accessory cursed?

## Armor

Items which can be equipped in a character's ARMOR slot. Note that description is used for display purposes only.

`(A) name` - body armor name

`(B) description` - flavor description for this body armor

`(C) buy_price` - price of this item if bought from a shop

`(D) equip.ranger` - can this be equipped by Rangers?

`(E) equip.soldier` - can this be equipped by Soldiers?

`(F) equip.fighter` - can this be equipped by Fighters?

`(G) equip.priest` - can this be equipped by Priests?

`(H) equip.wizard` - can this be equipped by Wizards?

`(I) defense` - defense bonus

`(J) dodge` - dodge bonus

`(K) strength` - strength bonus

`(L) agility` - agility bonus

`(M) resist.beat` - resistance against instant death spells

`(N) saver.burn` - does this armor have BURN SAVER?

## Build

Each character job has its own build file, which contains the stat growths that the character will receive at each level up. A character is assigned a specific build (integer ranging from 0-15) during character creation based on the character name provided.  Each build has 2 'primary' stats and 2 'secondary' stats.

`(A) STR1` - primary strength stat growths

`(B) STR2` - secondary strength stat growths

`(C) AGI1` - primary agility stat growths

`(D) AGI2` - secondary agility stat growths

`(E) HP1` - primary HP stat growths

`(F) HP2` - secondary HP stat growths

`(G) MP1` - primary MP stat growths

`(H) MP2` - secondary HP stat growths

## Character

The brave heroes fighting to free the world from evil's grasp. All base values can be modified by equipment, heart, etc. `attack` and `defense` values are stored for convenience only and are recalculated based on other data.

`(A) player` - name of the player who controls this character

`(B) name` - character's name

`(C) build` - character build value (0-15). Based on name, affects stat growth

`(D) job` - character's job class

`(E) level` - character's experience level

`(F) experience` - total accumulated experience points

`(G) gold` - gold coins in this character's possession

`(H) status` - semicolon separated list of status ailments

`(I) effects` - semicolon separated list of current in-battle spell/skill effects

`(J) abilities` - semicolon separated list of used 1/day heart abilities

`(K) curr_HP` - current HP value. When HP reaches 0 the character dies

`(L) curr_MP` - current MP value. Required to cast spells

`(M) base_HP` - base maximum HP value.

`(N) base_MP` - base maximum MP value.

`(O) base_strength` - base strength value

`(P) base_agility` - base agility value

`(Q) attack` - total attack value, stored for convenience only

`(R) defense` - total defense value, stored for convenience only

`(S) base_miss` - base rate (out of 32) of failing to land a physical attack

`(T) base_critical` - base rate (out of 32) of performing a critical hit

`(U) base_dodge` - base rate (out of 256) of evading a physical attack

`(V) resist.burn` - resistance (out of 16) for BURN attacks

`(W) resist.beat` - resistance (out of 16) for instant death spells

`(X) resist.numb` - resistance (out of 16) for paralysis

`(Y) resist.poison` - resistance (out of 16) for poison

`(Z) resist.sap` - resistance (out of 16) for defense lowering spells

`(AA) resist.slow` - resistance (out of 16) for agility lowering spells

`(AB) resist.chaos` - resistance (out of 16) for confusion

`(AC) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(AD) resist.sleep` - resistance (out of 16) for sleep

`(AE) resist.stopspell` - resistance (out of 16) for stopspell

`(AF) resist.surround` - resistance (out of 16) for surround

`(AG) resist.fear` - resistance (out of 16) from being frozen in fear

`(AH) equip.weapon` - character's equipped weapon

`(AI) equip.armor` - character's equipped body armor

`(AJ) equip.shield` - character's equipped shield

`(AK) equip.helmet` - character's equipped helmet

`(AL) heart.name` - character's equipped monster heart

`(AM) heart.experience` - monster heart experience value

`(AN-AS) inventory` - items in this character's possession. Limit of 6

`(AT-AW) loto3` - Loto3 lottery tickets. Limit of 4

`(AX-BA) bol` - Ball of Light lottery tickets. Limit of 4

`(BB) deaths` - number of times this character has been defeated

`(BC) active` - is this character actively participating in the game?

## Command

In battle player commands are recorded in this file. Commands must be entered for each player, and for certain NPCs and enemy monsters, for each update run.

`(A) member.type` - member type. One of 'characters', 'allies', 'enemies'

`(B) member.name` - name of the member who is performing this command

`(C) type` - type of battle action that this command represents

`(D) name` - for certain commands, a more specific command name

`(E) flavor_prefix` - flavor text (prefix) for physical attacks

`(F) target.type` - target type. One of 'characters', 'allies', 'enemies'

`(G) target.name` - name of the target who is receiving this command

`(H) flavor_suffix` - flavor text (suffix) for physical attacks

## Experience

The experience required to advance to level N is found in array index N-1.

`(A) ranger` - experience table for Rangers

`(B) soldier` - experience table for Soldiers

`(C) fighter` - experience table for Fighters

`(D) priest` - experience table for Priests

`(E) wizard` - experience table for Wizards

## Heart

Monster hearts which grant the essence of the defeated monster. Note that description is for display purposes only.

`(A) name` - heart name

`(B) can_transform` - can this monster heart evolve into a stronger version?

`(C) transform.experience` - experience points required for a transformation

`(D) transform.name` - next level once this heart gains enough experience

`(E) description` - plain text version of the monster heart powers

`(F) abilities` - semicolon separated list of 1/day spell/skill/item abilities

`(F) HP` - bonus to the maximum HP stat

`(G) MP` - bonus to the maximum MP stat

`(H) strength` - bonus to the strength stat

`(I) agility` - bonus to the agility stat

`(J) critical` - bonus to the critical stat

`(K) dodge` - bonus to the dodge stat

`(L) saver.burn` - does this heart grant BURN saver?

`(M) saver.phys` - does this heart grant PHYS saver?

`(N) saver.ment` - does this heart grant MENT saver?

`(O) on_hit.chance` - rate (out of 32) to proc an on-hit effect

`(P) on_hit.effect` - effect produced on physical attacks

`(Q) on_hit.resist` - resistance key against this effect

## Helmet

Items which can be equipped in a character's HELMET slot. Note that description is for display purposes only.

`(A) name` - helmet name

`(B) description` - flavor description for this helmet

`(C) buy_price` - price of this item if bought from a shop

`(D) equip.ranger` - can this be equipped by Rangers?

`(E) equip.soldier` - can this be equipped by Soldiers?

`(F) equip.fighter` - can this be equipped by Fighters?

`(G) equip.priest` - can this be equipped by Priests?

`(H) equip.wizard` - can this be equipped by Wizards?

`(I) defense` - defense bonus

## Item

Miscellaneous items that are carried around in a character's inventory and have wide-ranging uses in and out of battle.  Note that description is for display purposes only

`(A) name` - item name

`(B) description` - flavor description for this item

`(C) buy_price` - price of this item if bought from a shop

`(D) type` - classification for this item's effects

`(E) target` - how many targets does this item affect?

`(F) break` - rate (out of 16) that this item is lost after use

`(G) minimum` - minimum value of damage/healing for this item

`(H) range` - range of damage/healing for this item

`(I) status` - status inflicted by this item

`(J) resist` - resistance type used to defend against this item

`(K) stat_from` - multiply FROM this stat and add/subtract TO the next one

`(L) stat_to` - multiply FROM the previous stat and add/subtract TO this one

`(M) multiplier` - stat multiplier used for calculation (null if not used)

`(N) persist` - type of persisting effect beyond this turn, otherwise FALSE

## Location

The World Map is split up into many different locations. Travel at your own risk.

`(A) map_position` - grid coordinates for this location

`(B) location` - description of this location

`(C) zone` - monsters that inhabit this location

`(D) terrain` - terrain type; affects encounter rate

## Monster

Monsters you may run into during your travels. Beware! Note that flavor text is for display purposes only.

`(A) name` - monster's name

`(B) max_HP` - maximum HP value. When HP reaches 0 the monster is defeated!

`(C) max_MP` - maximum MP value. Required to cast spells

`(D) attack` - attack value, used for physical attacks

`(E) defense` - defense value, protection against physical attacks

`(F) agility` - monster's response speed

`(G) miss` - rate (out of 32) of failing to land a physical attack

`(H) critical` - rate (out of 32) of performing a critical hit

`(I) dodge` - rate (out of 256) of evading a physical attack

`(J) regen` - does this monster automatically regenerate HP?

`(K) target_group` - does this monster's attacks target an entire group?

`(L) target_all` - does this monster's attacks target all opponents?

`(M) run_fac` - factor used for determining player flee chances

`(N) resist.burn` - resistance (out of 16) for BURN attacks

`(O) resist.beat` - resistance (out of 16) for instant death spells

`(P) resist.numb` - resistance (out of 16) for paralysis

`(Q) resist.poison` - resistance (out of 16) for poison

`(R) resist.sap` - resistance (out of 16) for defense lowering spells

`(S) resist.slow` - resistance (out of 16) for agility lowering spells

`(T) resist.chaos` - resistance (out of 16) for confusion

`(U) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(V) resist.sleep` - resistance (out of 16) for sleep

`(W) resist.stopspell` - resistance (out of 16) for stopspell

`(X) resist.surround` - resistance (out of 16) for surround

`(Y) resist.fear` - resistance (out of 16) from being frozen in fear

`(Z) saver.burn` - does this monster have BURN SAVER?

`(AA) saver.phys` - does this monster have PHYS SAVER?

`(AB) saver.ment` - does this monster have MENT SAVER?

`(AC) ally` - monster ally when calling for help

`(AC) experience` - experience points awarded when the monster is defeated

`(AD) gold` - gold coins awarded when the monster is defeated

`(AE) drop.common.name` - item name the monster may drop after battle

`(AF) drop.common.rate` - rate (out of 256) for the common item drop

`(AG) drop.rare.name` - item name the monster may rarely drop after battle

`(AH) drop.rare.rate` - rate (out of 256) for the rare item drop

`(AI) drop.heart.name` - name of this monster's heart (see HEART data)

`(AJ) drop.heart.rate` - rate (out of 1024) for a monster heart drop

`(AK) behavior` - battle AI behavior (one of: fixed, random, custom)

`(AL-AS) pattern` - monster's attack pattern. Equal chance of each action

`(AT-BA) flavor.attack` - flavor text for this monster's physical attack

`(BB) flavor.dodge` - flavor text when this monster dodges a physical attack

`(BC) flavor.confusion` - flavor text when this monster is confused

`(BD) flavor.idle` - flavor text when this monster is doing nothing

## NPC

Citizens of the land who may help you on your quest.

`(A) name` - Person's name

`(B) base_HP` - base maximum HP value

`(C) base_MP` - base maximum MP value

`(D) base_strength` - base strength value

`(E) base_agility` - base agility value

`(F) base_miss` - base rate (out of 32) of failing to land a physical attack

`(G) base_critical` - base rate (out of 32) of performing a critical hit

`(H) base_dodge` - base rate (out of 256) of evading a physical attack

`(I) experience` - experience points awarded if defeated (you murderer!)

`(J) gold` - gold coins awarded if defeated

`(K) resist.burn` - resistance (out of 16) for BURN attacks

`(L) resist.beat` - resistance (out of 16) for instant death spells

`(M) resist.numb` - resistance (out of 16) for paralysis

`(N) resist.poison` - resistance (out of 16) for poison

`(O) resist.sap` - resistance (out of 16) for defense lowering spells

`(P) resist.slow` - resistance (out of 16) for agility lowering spells

`(Q) resist.chaos` - resistance (out of 16) for confusion

`(R) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(S) resist.sleep` - resistance (out of 16) for sleep

`(T) resist.stopspell` - resistance (out of 16) for stopspell

`(U) resist.surround` - resistance (out of 16) for surround

`(V) resist.fear` - resistance (out of 16) from being frozen in fear

`(W) equip.weapon` - person's equipped weapon

`(X) equip.armor` - person's equipped body armor

`(Y) equip.shield` - person's equipped shield

`(Z) equip.helmet` - person's equipped helmet

`(AA-AF) inventory` - items in this person's possession. Limit of 6

`(AG) behavior` - battle AI behavior (one of: fixed, random, custom)

`(AH-AO) pattern` - NPC's attack pattern. Equal chance of each action

## Quest

Perform quests to test your strength or gain a variety of rewards. Note that name and employer are for display purposes only. If a number of battles is omitted then the quest is based on exploration and does not have a fixed progression.

`(A) id` - unique quest identifier

`(B) name` - quest display name

`(C) location` - town or area where this quest can be accepted

`(D) employer` - who is offering this quest

`(E) battles` - (optional) total number of battles in this quest

`(F) reward.experience` - experience reward upon quest completion

`(G) reward.gold` - gold reward upon quest completion

`(H) reward.item` - item reward upon quest completion

## Shield

Items which can be equipped in a character's SHIELD slot. Note that description is for display purposes only.

`(A) name` - shield name

`(B) description` - flavor description for this shield

`(C) buy_price` - price of this item if bought from a shop

`(D) equip.ranger` - can this be equipped by Rangers?

`(E) equip.soldier` - can this be equipped by Soldiers?

`(F) equip.fighter` - can this be equipped by Fighters?

`(G) equip.priest` - can this be equipped by Priests?

`(H) equip.wizard` - can this be equipped by Wizards?

`(I) defense` - defense bonus

## Skill

Special skills that can grant the user a variety of abilities.  Note that flavor text is for display purpose only.

`(A) name` - skill name

`(B) flaor` - flavor text for this skill's execution

`(C) type` - classification for this skill's effects

`(D) target` - how many targets does this skill affect?

`(E) minimum` - minimum value of damage/healing for this skill

`(F) range` - range of damage/healing for this skill

`(G) miss` - rate (out of 32) that this skill fails outright

`(H) priority` - priority level for skill (higher = earlier in battle)

`(I) status` - status inflicted if this skill lands on the target

`(J) resist` - resistance type used to defend against this skill

`(K) stat_from` - multiply FROM this stat and add/subtract TO the next one

`(L) stat_to` - multiply FROM the previous stat and add/subtract TO this one

`(M) multiplier` - stat multiplier used for calculation (null if not used)

`(N) persist` - type of persisting effect beyond this turn, otherwise FALSE

## Spell

Magical spells which will be learned at the appropriate experience level. Note that invocation and description are for display purposes only.

`(A) name` - spell name

`(B) invocation` - magical word used to cast this spell

`(C) description` - flavor description for this spell

`(D) MP` - MP required to cast this spell

`(E) level` - experience level required to learn this spell

`(F) learned.ranger` - can this spell be learned by Rangers?

`(G) learned.soldier` - can this spell be learned by Soldiers?

`(H) learned.fighter` - can this spell be learned by Fighters?

`(I) learned.priest` - can this spell be learned by Priests?

`(J) learned.wizard` - can this spell be learned by Wizards?

`(K) type` - classification for this spell's effects

`(L) target` - how many targets does this spell affect?

`(M) minimum` - minimum value of damage/healing for this spell

`(N) range` - range of damage/healing for this spell

`(O) miss` - rate (out of 32) that this spell fails in being cast

`(P) priority` - priority level for spell (higher = earlier in battle)

`(Q) status` - status inflicted if this spell lands on the target

`(R) resist` - resistance type used to defend against this spell

`(S) stat_from` - multiply FROM this stat and add/subtract TO the next one

`(T) stat_to` - multiply FROM the previous stat and add/subtract TO this one

`(U) multiplier` - stat multiplier used for calculation (null if not used)

`(V) persist` - type of persisting effect beyond this turn, otherwise FALSE

## Weapon

Items which can be equipped in a character's WEAPON slot. Note that description is for display purposes only.

`(A) name` - weapon name

`(B) description` - flavor description for this weapon

`(C) buy_price` - price of this item if bought from a shop

`(D) equip.ranger` - can this be equipped by Rangers?

`(E) equip.soldier` - can this be equipped by Soldiers?

`(F) equip.fighter` - can this be equipped by Fighters?

`(G) equip.priest` - can this be equipped by Priests?

`(H) equip.wizard` - can this be equipped by Wizards?

`(I) attack` - attack bonus

`(J) miss` - rate (out of 32) that a physical attack will fail

`(K) critical` - critical hit bonus

`(L) target_all` - does this weapon target all enemies?

`(M) target_group` - does this weapon attack an entire group?

`(N) on_hit.chance` - rate (out of 32) to proc an on-hit effect

`(O) on_hit.effect` - effect produced when this weapon hits

`(P) on_hit.resist` - resistance key against this effect

## Zone

Monster encounters are broken down into the zones they inhabit. Monsters at the beginning of the list are more common encounters than those at the end.

`(A) zone` - zone ID

`(B-F) encounter` - list of possible monster encounters
