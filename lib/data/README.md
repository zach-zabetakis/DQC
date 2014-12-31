The following documentation will explain what each column represents in the various data files. All cells are case sensitive unless otherwise specified.

## Accessories

Multiple ACCESSORY items can be equipped.  All accessories count toward a character's six item carry limit.

`(A) name` - accessory name

`(B) buy_price` - price of this item if bought from a shop

`(C) equip.ranger` - can this be equipped by Rangers?

`(D) equip.soldier` - can this be equipped by Soldiers?

`(E) equip.fighter` - can this be equipped by Fighters?

`(F) equip.priest` - can this be equipped by Priests?

`(G) equip.wizard` - can this be equipped by Wizards?

`(H) attack` - attack bonus

`(I) defense` - defense bonus

## Armor

Items which can be equipped in a character's ARMOR slot.

`(A) name` - body armor name

`(B) buy_price` - price of this item if bought from a shop

`(C) equip.ranger` - can this be equipped by Rangers?

`(D) equip.soldier` - can this be equipped by Soldiers?

`(E) equip.fighter` - can this be equipped by Fighters?

`(F) equip.priest` - can this be equipped by Priests?

`(G) equip.wizard` - can this be equipped by Wizards?

`(H) attack` - attack bonus

`(I) defense` - defense bonus

## Characters

The brave heroes fighting to free the world from evil's grasp.
All base values can be modified by equipment, heart, etc.

`(A) player` - name of the player who controls this character

`(B) name` - character's name

`(C) class` - character's class

`(D) level` - character's experience level

`(E) experience` - total accumulated experience points

`(F) gold` - gold coins in this character's possession

`(G) maxHP` - base maximum HP value. When HP reaches 0 the character dies

`(H) maxMP` - base maximum MP value. Required to cast spells

`(I) strength` - base strength value

`(J) agility` - base agility value

`(K) attack` - attack value, used for physical attacks

`(L) defense` - defense value, protection against physical attacks

`(M) critical` - base rate (out of 32) of performing a critical hit

`(N) dodge` - base rate (out of 256) of evading a physical attack

`(O) resist.burn` - resistance (out of 16) for BURN attacks

`(P) resist.beat` - resistance (out of 16) for instant death spells

`(Q) resist.numb` - resistance (out of 16) for paralysis

`(R) resist.poison` - resistance (out of 16) for poison

`(S) resist.sap` - resistance (out of 16) for defense lowering spells

`(T) resist.slow` - resistance (out of 16) for agility lowering spells

`(U) resist.chaos` - resistance (out of 16) for confusion

`(V) resist.robmagic` - resistance (out of 16) for MP stealing spells

`(W) resist.sleep` - resistance (out of 16) for sleep

`(X) resist.stopspell` - resistance (out of 16) for stopspell

`(Y) resist.surround` - resistance (out of 16) for surround

`(Z) resist.fear` - resistance (out of 16) from being frozen in fear

`(AA) saver.burn` - does this character have BURN SAVER?

`(AB) saver.phys` - does this character have PHYS SAVER?

`(AC) saver.ment` - does this character have MENT SAVER?

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

The experience required to advance to level N is found in row N-1 of the array.

`(A) ranger` - experience table for Rangers

`(B) soldier` - experience table for Soldiers

`(C) fighter` - experience table for Fighters

`(D) priest` - experience table for Priests

`(E) wizard` - experience table for Wizards

## Hearts

Monster hearts which grant the essence of the defeated monster
Note that description is for display purposes only.

`(A) name` - heart name

`(B) can_transform` - can this monster heart evolve into a stronger version?

`(C) transform.experience` - experience points required for a transformation

`(D) transform.name` - next level once this heart gains enough experience

`(E) description` - plain text version of the monster heart powers

`(F) maxHP` - bonus to the maxHP stat

`(G) maxMP` - bonus to the maxMP stat

`(H) strength` - bonus to the strength stat

`(I) agility` - bonus to the agility stat

`(J) critical` - bonus to the critical stat

`(K) dodge` - bonus to the dodge stat

`(L) saver.burn` - does this heart grant BURN saver?

`(M) saver.phys` - does this heart grant PHYS saver?

`(N) saver.ment` - does this heart grant MENT saver?

## Helmets

Items which can be equipped in a character's HELMET slot.

`(A) name` - helmet name

`(B) buy_price` - price of this item if bought from a shop

`(C) equip.ranger` - can this be equipped by Rangers?

`(D) equip.soldier` - can this be equipped by Soldiers?

`(E) equip.fighter` - can this be equipped by Fighters?

`(F) equip.priest` - can this be equipped by Priests?

`(G) equip.wizard` - can this be equipped by Wizards?

`(H) attack` - attack bonus

`(I) defense` - defense bonus

## Monsters

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

## Shields

Items which can be equipped in a character's SHIELD slot.

`(A) name` - shield name

`(B) buy_price` - price of this item if bought from a shop

`(C) equip.ranger` - can this be equipped by Rangers?

`(D) equip.soldier` - can this be equipped by Soldiers?

`(E) equip.fighter` - can this be equipped by Fighters?

`(F) equip.priest` - can this be equipped by Priests?

`(G) equip.wizard` - can this be equipped by Wizards?

`(H) attack` - attack bonus

`(I) defense` - defense bonus

## Weapons

Items which can be equipped in a character's WEAPON slot.

`(A) name` - weapon name

`(B) buy_price` - price of this item if bought from a shop

`(C) equip.ranger` - can this be equipped by Rangers?

`(D) equip.soldier` - can this be equipped by Soldiers?

`(E) equip.fighter` - can this be equipped by Fighters?

`(F) equip.priest` - can this be equipped by Priests?

`(G) equip.wizard` - can this be equipped by Wizards?

`(H) attack` - attack bonus

`(I) defense` - defense bonus
