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

`(I) effects` - semicolon separated list of current in-battle spell effects

`(J) curr_HP` - current HP value. When HP reaches 0 the character dies

`(K) curr_MP` - current MP value. Required to cast spells

`(L) base_HP` - base maximum HP value.

`(M) base_MP` - base maximum MP value.

`(N) base_strength` - base strength value

`(O) base_agility` - base agility value

`(P) attack` - total attack value, stored for convenience only

`(Q) defense` - total defense value, stored for convenience only

`(R) base_miss` - base rate (out of 32) of failing to land a physical attack

`(S) base_critical` - base rate (out of 32) of performing a critical hit

`(T) base_dodge` - base rate (out of 256) of evading a physical attack

`(U) base_resist.burn` - resistance (out of 16) for BURN attacks

`(V) base_resist.beat` - resistance (out of 16) for instant death spells

`(W) base_resist.numb` - resistance (out of 16) for paralysis

`(X) base_resist.poison` - resistance (out of 16) for poison

`(Y) base_resist.sap` - resistance (out of 16) for defense lowering spells

`(Z) base_resist.slow` - resistance (out of 16) for agility lowering spells

`(AA) base_resist.chaos` - resistance (out of 16) for confusion

`(AB) base_resist.robmagic` - resistance (out of 16) for MP stealing spells

`(AC) base_resist.sleep` - resistance (out of 16) for sleep

`(AD) base_resist.stopspell` - resistance (out of 16) for stopspell

`(AE) base_resist.surround` - resistance (out of 16) for surround

`(AF) base_resist.fear` - resistance (out of 16) from being frozen in fear

`(AG) equip.weapon` - character's equipped weapon

`(AH) equip.armor` - character's equipped body armor

`(AI) equip.shield` - character's equipped shield

`(AJ) equip.helmet` - character's equipped helmet

`(AK) heart.name` - character's equipped monster heart

`(AL) heart.experience` - monster heart experience value

`(AM-AR) inventory` - items in this character's possession. Limit of 6

`(AS-AV) loto3` - Loto3 lottery tickets. Limit of 4

`(AW-AZ) bol` - Ball of Light lottery tickets. Limit of 4

`(BA) deaths` - number of times this character has been defeated

`(BB) active` - is this character actively participating in the game?

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

`(M) resist.burn` - resistance (out of 16) for BURN attacks

`(N) resist.beat` - resistance (out of 16) for instant death spells

`(O) resist.numb` - resistance (out of 16) for paralysis

`(P) resist.poison` - resistance (out of 16) for poison

`(Q) resist.sap` - resistance (out of 16) for defense lowering spells

`(R) resist.slow` - resistance (out of 16) for agility lowering spells

`(S) resist.chaos` - resistance (out of 16) for confusion

`(T) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(U) resist.sleep` - resistance (out of 16) for sleep

`(V) resist.stopspell` - resistance (out of 16) for stopspell

`(W) resist.surround` - resistance (out of 16) for surround

`(X) resist.fear` - resistance (out of 16) from being frozen in fear

`(Y) saver.burn` - does this monster have BURN SAVER?

`(Z) saver.phys` - does this monster have PHYS SAVER?

`(AA) saver.ment` - does this monster have MENT SAVER?

`(AB) experience` - experience points awarded when the monster is defeated

`(AC) gold` - gold coins awarded when the monster is defeated

`(AD) drop.common.name` - item name the monster may drop after battle

`(AE) drop.common.rate` - rate (out of 256) for the common item drop

`(AF) drop.rare.name` - item name the monster may rarely drop after battle

`(AG) drop.rare.rate` - rate (out of 256) for the rare item drop

`(AH) drop.heart.name` - name of this monster's heart (see HEART data)

`(AI) drop.heart.rate` - rate (out of 1024) for a monster heart drop

`(AJ) behavior` - battle AI behavior (one of: fixed, random, custom)

`(AK-AR) pattern` - monster's attack pattern. Equal chance of each action

`(AS-AZ) flavor.attack` - flavor text for this monster's physical attack

`(BA) flavor.dodge` - flavor text when this monster dodges a physical attack

`(BB) flavor.confusion` - flavor text when this monster is confused

`(BC) flavor.idle` - flavor text when this monster is doing nothing

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
