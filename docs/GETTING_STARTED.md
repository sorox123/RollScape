# Getting Started with RollScape

Welcome to RollScape! This guide will walk you through setting up your account, creating your first character, and starting your first adventure.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Creating Your Account](#creating-your-account)
3. [Understanding Subscription Tiers](#understanding-subscription-tiers)
4. [Creating Your First Character](#creating-your-first-character)
5. [Importing a Character from PDF](#importing-a-character-from-pdf)
6. [Joining a Campaign](#joining-a-campaign)
7. [Starting a Solo AI DM Campaign](#starting-a-solo-ai-dm-campaign)
8. [Playing Your First Session](#playing-your-first-session)
9. [Using the Dice Roller](#using-the-dice-roller)
10. [Generating AI Art](#generating-ai-art)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### For Players (Using Hosted Version)

Simply navigate to **https://rollscape.app** (coming soon) in your browser. No installation required!

**Supported Browsers**:
- Chrome/Edge (recommended)
- Firefox
- Safari

### For Developers (Local Setup)

#### Prerequisites
- **Node.js** 18+
- **Python** 3.11+
- **PostgreSQL** 15+
- **Redis**

#### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/sorox123/RollScape.git
cd RollScape/backend
```

2. Create virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/rollscape
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-openai-key
JWT_SECRET=your-secret-key
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

4. Start the development server:
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Creating Your Account

### Step 1: Navigate to Register Page

Visit the homepage and click **"Sign Up"** or navigate to `/register`.

### Step 2: Fill in Registration Form

- **Email**: Valid email address (used for login)
- **Username**: Display name (shown to other players)
- **Password**: Minimum 8 characters, must include:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

### Step 3: Verify Email (Coming Soon)

Check your email for verification link (currently auto-verified in development).

### Step 4: Log In

Use your email and password to log in.

---

## Understanding Subscription Tiers

RollScape offers three tiers to fit different play styles:

### 🆓 Free Tier - "Adventurer"
**Cost**: $0/month

**Perfect for**: Trying out the platform, casual players

**Limits**:
- 1 campaign as a player
- 1 solo AI DM campaign
- 2 AI players
- 10 AI images per month
- Campaigns archived after 30 days of inactivity

**Best for**: Solo players or those joining one campaign

---

### 💎 Creator Tier - $7.99/month
**Cost**: $7.99/month or $76.70/year (save 20%)

**Perfect for**: Active players, campaign creators

**Includes**:
- **Unlimited campaigns** (as player or DM)
- **5 AI players** (per campaign)
- **50 AI images per month**
- **3 PDF rulebook imports**
- **AI-generated session recaps**
- **Character import** (from D&D Beyond, Roll20)
- **Never auto-archived**

**Best for**: Players who run or join multiple campaigns

---

### 👑 Master Tier - $14.99/month
**Cost**: $14.99/month or $143.88/year (save 20%)

**Perfect for**: Power users, professional DMs

**Includes**:
- **Everything from Creator tier**
- **Unlimited AI players**
- **Unlimited AI images**
- **Unlimited PDF imports**
- **Voice synthesis** for NPCs
- **API access** for custom tools
- **Beta feature access**
- **Priority support**

**Best for**: DMs running large campaigns or multiple groups

---

### Upgrading Your Tier

1. Go to **Dashboard** → **Subscription**
2. Click **"Upgrade"** on desired tier
3. Enter payment information
4. Confirm upgrade

**Pro tip**: Choose annual billing to save 20%!

---

## Creating Your First Character

### Step 1: Navigate to Characters Page

From the dashboard, click **"Characters"** in the navigation menu.

### Step 2: Click "Create New Character"

This opens the character creation form.

### Step 3: Fill in Basic Information

**Required Fields**:
- **Name**: Character's name (e.g., "Thorin Ironbeard")
- **Race**: Select from dropdown (Human, Elf, Dwarf, etc.)
- **Class**: Select character class (Fighter, Wizard, Rogue, etc.)
- **Level**: Starting level (typically 1-3 for new characters)
- **Background**: Character's background (Soldier, Noble, Criminal, etc.)

### Step 4: Set Ability Scores

Enter your six ability scores:
- **Strength** (STR)
- **Dexterity** (DEX)
- **Constitution** (CON)
- **Intelligence** (INT)
- **Wisdom** (WIS)
- **Charisma** (CHA)

**Methods for determining scores**:
1. **Standard Array**: 15, 14, 13, 12, 10, 8
2. **Point Buy**: Use 27 points to purchase scores
3. **Roll**: Roll 4d6, drop lowest (if your DM allows)

### Step 5: Calculate Combat Stats

- **Hit Points**: Based on class and CON modifier
  - Level 1: Class max HP + CON modifier
  - Example: Fighter with CON 16 (+3) = 10 + 3 = 13 HP
- **Armor Class**: Based on armor and DEX modifier
  - No armor: 10 + DEX modifier
  - Leather: 11 + DEX modifier
  - Chain mail: 16 (no DEX bonus)
- **Proficiency Bonus**: Based on level
  - Levels 1-4: +2
  - Levels 5-8: +3
  - Levels 9-12: +4
- **Speed**: Based on race (typically 30 ft)

### Step 6: Add Personality & Backstory

**Optional but recommended**:
- **Personality Traits**: 2-3 defining characteristics
- **Ideals**: What drives your character
- **Bonds**: Connections to people, places, or things
- **Flaws**: Weaknesses or vices
- **Backstory**: Character's history and motivations

**Example**:
```
Personality: Gruff exterior but loyal to friends
Ideals: Honor above all
Bonds: My old military unit is my family
Flaws: I hold grudges for years
Backstory: Veteran soldier seeking redemption after a failed mission...
```

### Step 7: Save Character

Click **"Create Character"** to save.

Your character is now ready to join campaigns!

---

## Importing a Character from PDF

Save time by importing your existing D&D character sheet.

### Step 1: Navigate to Import Page

From the Characters page, click **"Import from PDF"**.

### Step 2: Prepare Your PDF

**Supported formats**:
- Official D&D 5e character sheet (WotC)
- D&D Beyond character sheet export
- Most fillable PDF character sheets

**Requirements**:
- PDF must be text-based (not a scanned image)
- Maximum file size: 10 MB
- Text must be selectable

### Step 3: Upload Your PDF

**Option A: Drag & Drop**
- Drag your PDF file onto the upload area

**Option B: Click to Browse**
- Click the upload area
- Select your PDF from file browser

### Step 4: Review Extraction Results

The system will analyze your PDF and display:

**Confidence Score**: Indicates extraction quality
- 🟢 80-100%: Excellent (minimal review needed)
- 🟡 60-79%: Good (some manual review)
- 🟠 40-59%: Partial (significant manual entry)
- 🔴 < 40%: Poor (mostly manual entry)

**Extracted Data**:
- Basic info (name, race, class, level)
- Ability scores (STR, DEX, CON, INT, WIS, CHA)
- Combat stats (AC, HP, speed)
- Proficiencies

### Step 5: Review & Edit

Check the extracted data for accuracy. Common issues:
- Ability scores may need adjustment
- Custom backgrounds might not be recognized
- Equipment lists often require manual entry

### Step 6: Create Character

Click **"Create Character with this Data"** to save.

You can always edit the character later if needed.

**Troubleshooting PDF Import**:
- Low confidence? Ensure PDF text is selectable
- Missing fields? Manually enter after creation
- Completely failed? Create character manually

---

## Joining a Campaign

### Finding Campaigns

#### Option 1: Browse Public Campaigns

1. Go to **Dashboard** → **"Find Campaigns"**
2. Browse available campaigns
3. Use filters:
   - **Has Openings**: Only show campaigns with slots
   - **AI DM**: Filter AI-run vs human-DM campaigns
   - **System**: D&D 5e, Pathfinder, etc.

#### Option 2: Friend Invite

Friends can send you direct campaign invites via the Friends system.

#### Option 3: Search by Code

If a DM gave you a campaign code:
1. Click **"Join by Code"**
2. Enter the campaign code
3. Click **"Join"**

### Joining a Campaign

1. Click on a campaign to view details:
   - Campaign description
   - DM name
   - Current players
   - System/edition
   - Session schedule
2. Click **"Join Campaign"**
3. Select your character from dropdown
4. Confirm join

**Notes**:
- You can join multiple campaigns (tier-dependent)
- Each campaign requires a character
- Can't join full campaigns
- Private campaigns require invite

---

## Starting a Solo AI DM Campaign

Want to play solo? Let the AI be your Dungeon Master!

### Step 1: Create New Campaign

From the dashboard, click **"Create Campaign"**.

### Step 2: Enable AI DM

Toggle **"Use AI Dungeon Master"** to ON.

### Step 3: Configure Campaign

**Campaign Settings**:
- **Title**: Give your campaign a name
- **Description**: Brief description of your adventure
- **Setting**: Choose from presets:
  - Forgotten Realms (classic D&D)
  - Eberron (magic-industrial)
  - Dark Fantasy
  - Homebrew (custom setting)
- **Difficulty**: Easy, Normal, Hard, Deadly
- **Tone**: Serious, Balanced, Humorous

**AI DM Personality**:
- **Narrative Style**: Descriptive, Concise, Dramatic
- **Combat Focus**: Tactical, Narrative, Balanced
- **Roleplaying**: Heavy RP, Moderate, Action-focused

### Step 4: Add Your Character

Select the character you'll be playing.

### Step 5: Optional: Add AI Players

Add AI-controlled party members:
- Click **"Add AI Player"**
- Choose class/race
- Set personality (cautious, brave, greedy, etc.)
- AI players will act autonomously

**Free tier**: 2 AI players max  
**Creator tier**: 5 AI players max  
**Master tier**: Unlimited

### Step 6: Start Session

Click **"Start First Session"**.

The AI DM will introduce the adventure!

---

## Playing Your First Session

### The Session Interface

#### Chat Panel (Left)
- View all narration, dialogue, and actions
- Scroll to see history
- Messages color-coded by type:
  - 🎭 DM Narration (blue)
  - 💬 Player Speech (green)
  - ⚔️ Combat Actions (red)
  - 🎲 Dice Rolls (purple)

#### Action Input (Bottom)
Type what you want to do in natural language.

**Examples**:
- "I investigate the chest for traps"
- "I try to persuade the guard to let us through"
- "I attack the goblin with my longsword"
- "I cast Magic Missile at the wizard"

#### Quick Actions (Right)
Common actions with one click:
- **Attack**: Select target and weapon
- **Cast Spell**: Choose spell and target
- **Use Item**: Select item from inventory
- **Skill Check**: Choose skill to roll

#### Character Panel (Top Right)
- Current HP/Max HP
- AC (Armor Class)
- Conditions (poisoned, stunned, etc.)
- Active effects

### How to Play

#### 1. Read DM Narration

The AI DM will describe scenes:
```
You enter a dimly lit tavern. A hooded figure sits in the corner, 
watching you intently. The bartender gestures you over.
```

#### 2. Decide Your Action

Think about what you want to do:
- Talk to the hooded figure?
- Approach the bartender?
- Search for other patrons?
- Order a drink?

#### 3. Type Your Action

Be descriptive but natural:
```
"I approach the bartender and ask if he knows anything about 
the missing merchant"
```

Or use quick actions for common tasks.

#### 4. Roll When Prompted

The DM may ask for a check:
```
DM: "Make a Persuasion check."
```

Click **"Roll Persuasion"** or type: `/roll persuasion`

#### 5. React to Results

The DM interprets your roll:
```
[Persuasion: 18]
DM: "The bartender leans in and whispers, 'I might know something, 
but information isn't free around here...'"
```

Continue the conversation based on the outcome.

### Combat

When combat starts, the DM will announce it:
```
🎲 ROLL FOR INITIATIVE!
```

**Initiative Order**:
System automatically rolls initiative and displays turn order.

**Your Turn**:
1. **Move** (if needed): "I move 20 feet toward the orc"
2. **Action**: Attack, cast spell, use item, or special action
3. **Bonus Action** (if available): Off-hand attack, special ability
4. **Reaction** (when triggered): Attack of opportunity

**Example Combat Turn**:
```
Your turn: Thorin Ironbeard

You type: "I attack the orc with my warhammer"
System: "Roll to hit!"
[You roll: 17 + 5 = 22]
DM: "Your warhammer crashes into the orc's shield. Roll damage!"
[You roll: 1d8+3 = 7]
DM: "You deal 7 damage! The orc staggers back."
```

**End Turn**: Type "end turn" or click "End Turn" button.

### Using AI Players

If you added AI players, they'll act autonomously:
- AI players take their turns automatically
- You can suggest actions: "@Lyra, investigate the door"
- AI players react to your decisions
- They'll vote on party decisions when needed

---

## Using the Dice Roller

### Quick Roll

Click the **dice icon** in the top navigation to open the dice roller.

### Roll Types

#### Standard Roll
```
1d20        → Roll 1 twenty-sided die
3d6         → Roll 3 six-sided dice
1d12+5      → Roll 1d12 and add 5
```

#### Advantage/Disadvantage
```
2d20kh1     → Roll 2d20, keep highest (advantage)
2d20kl1     → Roll 2d20, keep lowest (disadvantage)
```

#### Drop Lowest (Ability Score Generation)
```
4d6dl1      → Roll 4d6, drop the lowest
```

#### Multiple Dice
```
2d20+1d8+5  → Roll 2d20, 1d8, and add 5
```

#### Exploding Dice
```
1d6!        → Reroll on 6 (exploding)
```

### Rolling in Chat

You can also roll directly in the chat:

```
/roll 1d20+5            → Strength check
/roll 2d20kh1+3         → Attack with advantage
/roll 8d6               → Fireball damage
```

### Dice History

View your recent rolls in the Dice History panel:
- Last 20 rolls shown
- Filter by session or character
- Click to see full roll details

---

## Generating AI Art

### Character Art

Generate portraits for your characters!

#### Step 1: Navigate to AI Art Generator

Dashboard → **"AI Images"** → **"Character Art"**

#### Step 2: Select Style

Choose an art style:
- **Fantasy Portrait**: Classic D&D character art
- **Anime**: Anime-style character
- **Realistic**: Photo-realistic portrait
- **Cartoon**: Stylized cartoon character
- **Oil Painting**: Classic painted portrait

#### Step 3: Enter Character Details

**Required**:
- Character name
- Race
- Class
- Brief description

**Optional** (improves results):
- Age and gender
- Hair and eye color
- Clothing description
- Weapons/equipment
- Facial features
- Personality traits

**Example**:
```
Name: Thorin Ironbeard
Race: Mountain Dwarf
Class: Fighter
Description: Grizzled veteran with a long braided beard, 
weathered chainmail armor, and a massive warhammer. 
Battle scars on face. Determined expression.
```

#### Step 4: Generate

Click **"Generate Character Art"**.

Generation takes 10-20 seconds.

#### Step 5: Save or Regenerate

**Options**:
- **Use as Character Portrait**: Set as character's profile image
- **Save to Gallery**: Keep in your AI art collection
- **Regenerate**: Try again with different style or description
- **Download**: Save to your computer

### Map Generation

Generate battle maps, dungeons, and world maps!

#### Map Types

1. **Battle Map**: Tactical combat map (30x30 ft grid)
2. **Dungeon**: Multi-room dungeon layout
3. **Town**: Settlement map
4. **World Map**: Regional or world geography

#### Environment Presets

- Forest Clearing
- Cave/Cavern
- Throne Room
- Tavern Interior
- City Street
- Mountain Pass
- Swamp
- Desert Oasis
- Ancient Ruins
- Ship Deck

#### Custom Map

Enter a custom description:
```
"A large circular chamber with a pool of glowing water 
in the center. Four stone pillars surround the pool. 
Ancient runes carved into the walls. Mist on the floor."
```

#### Options

- **Grid**: Show/hide grid overlay
- **Size**: Small (20x20), Medium (30x30), Large (40x40)
- **Style**: Top-down, Isometric, Hand-drawn

### Token Generation

Generate tokens for characters, NPCs, and monsters!

**Use Cases**:
- Player character tokens for battle maps
- NPC portraits
- Monster tokens
- Custom creatures

**Settings**:
- Circular frame (fits standard VTT tokens)
- Transparent or solid background
- Border color options

### Quota Management

Track your AI image usage:

**Check Remaining Images**:
Dashboard → Subscription → "AI Images: 34/50"

**Reset Date**: Quota resets on the 1st of each month

**Upgrade**: Need more? Upgrade to a higher tier:
- Free: 10/month
- Creator: 50/month
- Master: Unlimited

---

## Tips & Best Practices

### For Players

1. **Be Descriptive**: Don't just say "I attack." Say "I charge at the orc, roaring as I swing my axe at his chest."

2. **Engage with the World**: Ask questions about your surroundings. The AI DM responds well to curiosity.

3. **Work with AI Players**: Coordinate with AI party members. They respond to your leadership.

4. **Use Skill Checks Strategically**: Don't roll for everything. Save checks for important moments.

5. **Manage Resources**: Track spell slots, HP, and consumables carefully.

6. **Save Often**: The system auto-saves, but manually save after important events.

### For DMs

1. **Set Clear Expectations**: Tell players about campaign tone, difficulty, and house rules upfront.

2. **Prep Between Sessions**: Review AI-generated recaps and prepare notes for next session.

3. **Balance AI Players**: Don't let AI players overshadow human players. Limit their participation when needed.

4. **Use AI Art Wisely**: Pre-generate important NPC portraits and maps before sessions.

5. **Encourage Player Agency**: Let players drive the story. Use AI suggestions as inspiration, not mandates.

### For Solo Players

1. **Play Multiple Characters**: Control 2-3 characters for a fuller party experience.

2. **Set Scene Expectations**: Tell the AI DM what kind of adventure you want: "I want a mystery with intrigue."

3. **Accept Surprises**: Let the AI DM surprise you. Don't try to control everything.

4. **Take Breaks**: Solo play can be intense. Take breaks to prevent burnout.

5. **Experiment**: Try different settings, difficulty levels, and AI personalities to find your preference.

---

## Troubleshooting

### Common Issues

#### Can't Log In
- **Check email/password**: Ensure correct credentials
- **Reset password**: Use "Forgot Password" link
- **Clear browser cache**: Cookies may be corrupted
- **Try different browser**: Rule out browser-specific issues

#### Character Not Appearing
- **Refresh page**: Sometimes state doesn't update
- **Check ownership**: Ensure character belongs to your account
- **Verify creation**: Did the creation complete successfully?

#### Dice Roller Not Working
- **Check session**: Must be in an active session to roll
- **Verify syntax**: Ensure dice notation is valid (e.g., `1d20`, not `d20`)
- **Browser console**: Open developer tools (F12) to check for errors

#### AI Images Not Generating
- **Check quota**: Verify you have images remaining
- **Wait full duration**: Generation takes 10-20 seconds
- **Simplify description**: Very complex prompts may fail
- **Upgrade tier**: Free tier has limited quota

#### Session Not Loading
- **Network connection**: Ensure stable internet
- **Server status**: Check status page for outages
- **Clear cache**: Browser cache may have stale data
- **Try incognito mode**: Rule out extension conflicts

#### AI DM Not Responding
- **Check active session**: Ensure session is active, not paused
- **Message format**: Use natural language, not code
- **Wait for response**: AI can take 5-10 seconds to respond
- **Refresh if stuck**: If truly frozen, refresh the page

### Getting Help

#### 1. Check Documentation
- **API Reference**: Technical details
- **User Guide**: Step-by-step tutorials
- **FAQ**: Common questions

#### 2. Community Support
- **Discord** (coming soon): Ask other players
- **GitHub Issues**: Report bugs or request features

#### 3. Contact Support
- **Email**: support@rollscape.app (coming soon)
- **In-app**: Use "Help" button in settings

### Known Limitations

#### Free Tier
- Limited to 1 player campaign + 1 AI DM campaign
- Campaigns auto-archive after 30 days inactivity
- Only 10 AI images per month

#### AI DM
- May occasionally misinterpret complex actions
- Best with D&D 5e rules (other systems less accurate)
- Cannot generate visual battle maps in real-time (use pre-generated maps)

#### PDF Import
- Works best with official WotC character sheets
- Scanned PDFs (images) not supported
- Complex homebrew may not be recognized

#### Browser Compatibility
- Best on Chrome/Edge (recommended)
- Firefox: Minor CSS issues
- Safari: WebSocket reconnection can be slow
- Mobile: Limited support (coming soon)

---

## Next Steps

Now that you're set up, here's what to do next:

1. ✅ **Create your first character**
2. ✅ **Try a solo AI DM session** to learn the interface
3. ✅ **Join a public campaign** to experience multiplayer
4. ✅ **Generate some AI art** for your character
5. ✅ **Invite friends** and start your own campaign!

**Enjoy your adventures!** 🎲

---

## Additional Resources

- **Full API Documentation**: `/docs/api/API_REFERENCE.md`
- **Campaign Guide**: `/docs/CAMPAIGN_GUIDE.md` (coming soon)
- **DM Guide**: `/docs/DM_GUIDE.md` (coming soon)
- **Agent Architecture**: `/docs/design/` (for developers)

---

**Welcome to RollScape - The DM that never cancels!** 🎲✨

If you have questions or feedback, we'd love to hear from you!

**Last Updated**: January 2024  
**Guide Version**: 1.0.0
