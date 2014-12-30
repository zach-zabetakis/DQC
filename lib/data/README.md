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

## Experience

The experience required to advance to level N is found in row N-1 of the array.

`(A) ranger` - experience table for Rangers
`(B) soldier` - experience table for Soldiers
`(C) fighter` - experience table for Fighters
`(D) priest` - experience table for Priests
`(E) wizard` - experience table for Wizards

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
