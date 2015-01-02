The following documentation will explain what each column represents in the various data files. Column names MUST NOT be changed under any circumstances. All cells are case sensitive unless otherwise specified.

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

`(O) resist_burn` - resistance against burn spells and skills

`(P) resist_numb` - resistance against paralysis

`(Q) saver.phys` - does this accessory have PHYS SAVER?

`(R) is_cursed` - is this accessory cursed?

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

`(M) resist_beat` - resistance against instant death spells

`(N) saver.burn` - does this armor have BURN SAVER?

## Character

The brave heroes fighting to free the world from evil's grasp. All base values can be modified by equipment, heart, etc. `attack`, `defense`, and `saver` values are stored for convenience only and are recalculated based on other data.

`(A) player` - name of the player who controls this character

`(B) name` - character's name

`(C) job` - character's job class

`(D) level` - character's experience level

`(E) experience` - total accumulated experience points

`(F) gold` - gold coins in this character's possession

`(G) base_HP` - base maximum HP value. When HP reaches 0 the character dies

`(H) base_MP` - base maximum MP value. Required to cast spells

`(I) base_strength` - base strength value

`(J) base_agility` - base agility value

`(K) attack` - total attack value, stored for convenience only

`(L) defense` - total defense value, stored for convenience only

`(M) base_critical` - base rate (out of 32) of performing a critical hit

`(N) base_dodge` - base rate (out of 256) of evading a physical attack

`(O) base_resist.burn` - resistance (out of 16) for BURN attacks

`(P) base_resist.beat` - resistance (out of 16) for instant death spells

`(Q) base_resist.numb` - resistance (out of 16) for paralysis

`(R) base_resist.poison` - resistance (out of 16) for poison

`(S) base_resist.sap` - resistance (out of 16) for defense lowering spells

`(T) base_resist.slow` - resistance (out of 16) for agility lowering spells

`(U) base_resist.chaos` - resistance (out of 16) for confusion

`(V) base_resist.robmagic` - resistance (out of 16) for MP stealing spells

`(W) base_resist.sleep` - resistance (out of 16) for sleep

`(X) base_resist.stopspell` - resistance (out of 16) for stopspell

`(Y) base_resist.surround` - resistance (out of 16) for surround

`(Z) base_resist.fear` - resistance (out of 16) from being frozen in fear

`(AA) base_saver.burn` - does this character have BURN SAVER?

`(AB) base_saver.phys` - does this character have PHYS SAVER?

`(AC) base_saver.ment` - does this character have MENT SAVER?

`(AD) equip.weapon` - character's equipped weapon

`(AE) equip.armor` - character's equipped body armor

`(AF) equip.shield` - character's equipped shield

`(AG) equip.helmet` - character's equipped helmet

`(AH) heart.name` - character's equipped monster heart

`(AI) heart.experience` - monster heart experience value

`(AJ-AO) inventory` - items in this character's possession. Limit of 6

`(AP) deaths` - number of times this character has been defeated

`(AQ) active` - is this character actively participating in the game? 

## Experience

The experience required to advance to level N is found in array index N-1.

`(A) ranger` - experience table for Rangers

`(B) soldier` - experience table for Soldiers

`(C) fighter` - experience table for Fighters

`(D) priest` - experience table for Priests

`(E) wizard` - experience table for Wizards

## Heart

Monster hearts which grant the essence of the defeated monster
Note that description is for display purposes only.

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

Monsters you may run into during your travels. Beware!
Note that flavor text is for display purposes only.

`(A) name` - monster's name

`(B) maxHP` - maximum HP value. When HP reaches 0 the monster is defeated!

`(C) maxMP` - maximum MP value. Required to cast spells

`(D) attack` - attack value, used for physical attacks

`(E) defense` - defense value, protection against physical attacks

`(F) agility` - monster's response speed

`(G) critical` - rate (out of 32) of performing a critical hit

`(H) dodge` - rate (out of 256) of evading a physical attack

`(I) experience` - experience points awarded when the monster is defeated

`(J) gold` - gold coins awarded when the monster is defeated

`(K) drop.common.name` - item name the monster may drop after battle

`(L) drop.common.rate` - rate (out of 256) for the common item drop

`(M) drop.rare.name` - item name the monster may rarely drop after battle

`(N) drop.rare.rate` - rate (out of 256) for the rare item drop

`(O) drop.heart.name` - name of this monster's heart (see HEART data)

`(P) drop.heart.rate` - rate (out of 1024) for a monster heart drop

`(Q) resist.burn` - resistance (out of 16) for BURN attacks

`(R) resist.beat` - resistance (out of 16) for instant death spells

`(S) resist.numb` - resistance (out of 16) for paralysis

`(T) resist.poison` - resistance (out of 16) for poison

`(U) resist.sap` - resistance (out of 16) for defense lowering spells

`(V) resist.slow` - resistance (out of 16) for agility lowering spells

`(W) resist.chaos` - resistance (out of 16) for confusion

`(X) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(Y) resist.sleep` - resistance (out of 16) for sleep

`(Z) resist.stopspell` - resistance (out of 16) for stopspell

`(AA) resist.surround` - resistance (out of 16) for surround

`(AB) resist.fear` - resistance (out of 16) from being frozen in fear

`(AC) saver.burn` - does this monster have BURN SAVER?

`(AD) saver.phys` - does this monster have PHYS SAVER?

`(AE) saver.ment` - does this monster have MENT SAVER?

`(AF-AN) pattern` - monster's attack pattern. Equal chance of each action

`(AN-AU) flavor.attack` - flavor text for this monster's physical attack

`(AV) flavor.dodge` - flavor text when this monster dodges a physical attack

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
