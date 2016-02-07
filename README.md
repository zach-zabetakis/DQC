Dragon Quest Cosmos
===

*The stern-looking guard whispered a quiet warning as he led the travelers down the hall leading to the throne room. "Ye are about to enter the presence of our much-respected and beloved King Lorik XVI. Pay him your respect, and no shenanigans!" He shot a threatening glance to each of them in turn before opening the large wooden door and ushering them inside.*

*"Welcome! Welcome to our fine castle of Tantegel!" bellowed the King jovially. However, his demeanor became immediately more serious; this was no time for chit-chat. "Ye have come claiming to be heirs of the great Erdrick, have ye not?" The adventurers all gave affirmative responses, varying from an energetic salute and a "Yes, Sire!" to a simple nod of the head. The King continued, "Then listen now to my words.*

*"Long ago, a renowned warrior known to us as Erdrick fought against evil using an artifact called the Ball of Light. That Ball was kept here in this castle...but then came the Dragonlord, who stole the precious globe and took it with him into the darkness of the Devil's Isle. I hereby command ye, as descendants of Erdrick, to retake the Ball of Light and restore peace to this land of Alefgard. The Dragonlord must be defeated, by any means necessary." King Lorik's face took on a steely look of defiance as he spoke those words--defiance of his mortal enemy, and defiance of the pain and suffering which he had caused. Nay, more than that--defiance of the fates themselves, who seemed to have set an indomitable foe upon him. With Erdrick's aid.... "I shall give each of ye gold pieces numbering six score with which to buy supplies for your journey. Use it wisely, and may the light shine upon ye."*

*As the warriors filed out of the throne room, Lorik leaned toward his chancellor, whispering, "Surely we will succeed! I had only expected one person to answer the call--this is wonderful!" A festive smile flashed over his face as he ribbed the chancellor, "I suppose 'tis true what they say: There's one born every minute!"*

*The stern guard who had first escorted the travelers stopped them after sealing the door to the chamber. "Ye did well for ones who look so vulgar. I am impressed! However, our great King did not tell ye of his secret sorrow.... It has been half a year since the King's own daughter, the beautiful Princess Gwaelin, was kidnapped from this very castle. He never speaks of it--for the sake of his people, he will not show any sign of weakness. However, it breaks his heart that she is not by his side. Please, if she still lives, find her and return her home!"*

## Introduction

Dragon Quest Cosmos (DQC) is a board-based game drawing from the original Dragon Quest/Dragon Warrior, with added elements from DW2 and DW3 (and maybe even more...?) for greater variety in gameplay options. Each player controls a single "Descendant of Erdrick" attempting to slay the Dragonlord and prove his/her heritage. You can interact with other players by forming parties, challenging to duels, competing for possession of rare items, etc. Could you be the true Descendant of Erdrick?

### Abbreviated Rules

##### Gameplay

* Gameplay is pretty straightforward: A round of gameplay consists of each player choosing an appropriate action, followed by an update of the game's status. Each update cycle will take place over the course of 2-3 days in order to give players time to interact and coordinate with each other. Updates may occur sooner if all players get their commands in early.

* Role-playing is welcomed and encouraged, but not expected. Quiet players are players too! ^_^

* If you miss your command, teammates can cover for you in the short term, but if you appear to have abandoned your character, s/he will run back to the nearest town and rest until you return. If you know you will be absent for several updates, feel free to grant temporary control of your character to another member of your party, or any other player willing to accept control!

##### General

* Generally, each player will control a single character. You are free to form parties, go on quests, fight amongst yourselves, etc.

* Along with the addition of player parties, there will also be monster parties. Beware of Starwyvern hordes!

* XP and GP rewards are identical to true Dragon Quest, but are adjusted by a multiplier based on the number of live characters in the current party. This multiplier is equal to 4 / x , where x is the number of characters.

* Stat builds for each character are determined, as in the original game, by the character's name. However, DQC uses a custom algorithm, so consulting with the game will not give the results you expect.

* Mechanics and stat growth will be similar to true Dragon Warrior. However, as the game progresses, unforeseen areas of imbalance are bound to occur, and they will (hopefully) be fixed when they do. (Note that this whole system is a work in progress, so player input on mechanics will be vital to its success!)

* Character inventories have a maximum size of 6, excluding equipped weapons, armor, shields, and helmets. Accessories still take up inventory slots, as do unequipped weapons/armor/etc.. Herbs and Keys are counted individually.  Certain quests may reward the player with additional inventory slots.

* New quests, monsters, jobs, spells, and items will be introduced. More on those later!

##### Death

* If your character dies, and your party is unable to immediately revive you, you have the option either:
  1. to remain dead, incurring the XP penalty only, until the party can return to town and pay a priest (fee will increase linearly with the player's level), or
  2. to respawn immediately at Tantegel, incurring the XP and GP penalties. Full-party defeat automatically incurs both penalties, since there is no recourse but to respawn.

* The XP penalty for death is 10% of the total amount needed for the next level. Ex: Say you have 1500 XP, (LV9), when you are killed in battle. If LV9 occurs at 1300 XP, and LV10 occurs at 2000 XP, you would lose 70: 10% of 700. You will not lose a level if this puts you under the threshold for your current level. This penalty will not occur if your party is able to revive you during or immediately following a battle. You will incur an additional penalty if you die again before paying back what you originally lost but the sum of XP penalties will never cause you to lose a level.

* The GP penalty for a death is 50% of GP. This penalty also will not occur if your party is able to revive you during or immediately following a battle. However, it is cumulative, meaning that if your character dies again, your GP will again be halved.

##### Jobs

* All players begin in a default class that mimics the hero from the original Dragon Warrior.  This class will learn the HEAL and HURT (now named Blaze) spells at their standard levels, which are retained upon class change.

* Upon reaching LV5, the player is eligible to immediately declare one of five job classes:
  * Ranger: Identical to original Dragon Warrior hero, but with half MP.
  * Soldier: Loses mid- to high-level magic, gaining more weapon and armor choices. HP/STR+, MP/AGI-
  * Fighter: Loses almost all magic, weapon, and armor. Critical/Dodge bonus based on level. STR/AGI+, MP-
  * Priest: Loses high-end weapons and armor in exchange for high-level healing and support magic. MP+, HP/STR-
  * Wizard: Loses high-end weapons and armor in exchange for high-level attack magic. MP+, HP/STR-

* Originally the Templar quest in Tantegel Castle was required for class change, but this quest is now optional. It is however still strongly recommended as it provides the opportunity for additional stat growth.

## How to Run DQC

Once all players have put in one or more commands for the upcoming turn, these commands will need to be recorded in the appropriate commands file, which is stored with the rest of the game data files. Commands will be differentiated between in-battle and out-of-battle actions. The sim will run all of these commands in the proper order and once finished will save the game state and output the results. These results constitute the game update and will be shared with all players, which initiates the next turn of gameplay.

##### In-Battle Commands

There are 13 different commands that can be input during a battle. Only one command per player can be accepted. See the README for an explanation of the commands file.

* ATTACK: Perform a physical attack with the equipped weapon against a target.
  * Required: `member.type`, `member.name`, `type`, `target.type`, `target.name`
  * Optional: `flavor.prefix`, `flavor.suffix`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | ATTACK | | | turns | enemies | SlimeA | into goo

* CHARGE: Move in front of another member in the group ordering. Coupled with PARRY command.
  * Required: `member.type`, `member.name`, `type`, `target.type`, `target.name`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | CHARGE | | | | characters | Anduin | 

* DISMISS: Send away an allied monster recruit from battle.
  * Required: `member.type`, `member.name`, `type`, `target.type`, `target.name`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | DISMISS | | | | allies | Healie | 

* HEART: Use an ability imbued by a monster heart.
  * Required: `member.type`, `member.name`, `type`, `name`, `target.type`, `target.name`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | HEART | Eau de Slime | | | enemies | SlimeA | 

* ITEM: Use an inventory item. Note that most items require a target.
  * Required: `member.type`, `member.name`, `type`, `name`
  * Optional: `target.type`, `target.name`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | Item | Herb | | | characters | Zephyr | 

* NONE: Do nothing
  * Required: `member.type`, `member.name`, `type`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | NONE | | | | | | 

* PARRY: Assume a defensive stance, halving incoming damage for the turn.
  * Required: `member.type`, `member.name`, `type`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | PARRY | | | | | | 

* RECALL: Summon a monster recruit into battle. Incoming recruit will PARRY for the turn.
  * Required: `member.type`, `member.name`, `type`, `name`, `target.type`, `target.name`
  * Optional: `extra`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | RECALL | Slib | after | | allies | Healie | 

* RETREAT: Move behind another member in the group ordering. Coupled with PARRY command.
  * Required: `member.type`, `member.name`, `type`, `target.type`, `target.name`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | RETREAT | | | | characters | Anduin | 

* RUN: Attempt to flee from the battle.
  * Required: `member.type`, `member.name`, `type`
  * Optional: none
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | RUN | | | | | | 

* SHIFT: Switch between two different groups in battle, or form a new group.
  * Required: `member.type`, `member.name`, `type`, `name`
  * Optional: `extra`, `target.type`, `target.name`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | SHIFT | new | North Front | | | | 

* SKILL: Use a skill. Note that most skills require a target.
  * Required: `member.type`, `member.name`, `type`, `name`
  * Optional: `target.type`, `target.name`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | SKILL | Fire Breath | | | enemies | SlimeA | 

* SPELL: Cast a spell.  Note that most spells require a target.
  * Required: `member.type`, `member.name`, `type`, `name`
  * Optional: `target.type`, `target.name`
  * Example:

member.type | member.name | type | name | extra | flavor.prefix | target.type | target.name | flavor.suffix
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------
characters | Zephyr | SPELL | Heal | | | characters | Anduin | 
