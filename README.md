# Pawmise

## **Product Requirement Document: Pawmise – The Guardian Realm**

### **1. Overview**

**Pawmise** is a gamified savings application that combines emotional engagement with financial literacy. Users are accompanied by a mystical guardian companion who protects their savings. As users save, their **Guardian Realm** flourishes with enchanting elements; as they spend, the realm gently regresses. The app leverages the capabilities of the **Sui blockchain**, utilizing **Sui Move** for smart contract development and the **GOAT SDK** for AI agent interactions.

---

### **2. Core Concept**

Users are assigned a **Guardian Companion**—a mystical creature (starting with a dog)—that safeguards their savings. Interactions with the guardian involve conversational prompts, decisions akin to gameplay, and visual progression within a personalized **Guardian Realm**.

The guardian encourages prudent financial behavior, questioning spending habits and rewarding saving. The **Guardian Realm** evolves based on the user's financial actions, providing a visual and emotional representation of their financial journey.

---

### **3. Key Features**

#### 3.1. **Guardian Companion (AI Agent)**

- **Default Character**: Mystical dog (future versions may include cats, owls, etc.)
- **Personality Traits**: Warm, curious, protective
- **Interactions**:
  - Queries spending decisions: “Do you truly need this, or is it a passing desire?”
  - Provides encouragement for saving
  - Adjusts demeanor based on user behavior

#### 3.2. **Saving Mechanics**

- **Manual Savings**: Users can deposit any amount into their savings
- **Treat Packs**: Predefined savings amounts presented as treats for the guardian
  - Small Treat: $5
  - Medium Treat: $20
  - Large Treat: $100

#### 3.3. **Spending Requests**

- **Guardian Interaction**: Upon withdrawal requests, the guardian engages the user in a dialogue to assess necessity
- **Approval Criteria**:
  - Amount requested relative to total savings
  - User's saving and spending history
- **Outcomes**:
  - Approved: Funds released, minor regression in realm
  - Delayed: Encourages user to reconsider
  - Denied: Suggests alternative actions

#### 3.4. **Emergency Withdrawal ("Kill Switch")**

- **Function**: Immediate access to all funds
- **Consequence**: Permanent loss of current guardian and realm progress
- **Restart**: User begins anew with a fresh guardian and realm

#### 3.5. **Guardian Realm (Visual Growth)**

- **Concept**: A mystical realm that evolves with the user's savings
- **Progression Tiers**:

| Tier | Savings Range   | Realm Features                           |
| ---- | --------------- | ---------------------------------------- |
| 1    | $0 - $99        | Sparkling Clearing                       |
| 2    | $100 - $499     | Moonlit Grove with flora                 |
| 3    | $500 - $999     | Emergent Shrine and fauna                |
| 4    | $1,000 - $4,999 | Spirit Tree and ambient elements         |
| 5    | $5,000+         | Crystalline Forest with magical entities |

- **Regression**: As savings decrease, realm elements gently fade or become dormant

#### 3.6. **Monthly Reflection**

- **Features**:
  - Visual snapshot of the realm
  - Guardian's message summarizing the month's financial behavior
  - Breakdown of savings and spending
  - Encouragement and tips for the upcoming month

---

### **4. Technical Architecture**

#### 4.1. **Blockchain Integration**

- **Platform**: Sui blockchain
- **Smart Contracts**: Developed using Sui Move
  - Utilizes Sui's object-centric model for managing user assets and realm elements
  - Employs capabilities for fine-grained access control

#### 4.2. **AI Agent Integration**

- **Toolkit**: GOAT SDK
  - Enables AI agents to manage financial transactions
  - Facilitates conversational interactions with users
  - Supports integration with various agent frameworks

#### 4.3. **Frontend Development**

- **Design Aesthetic**: Inspired by _Stardew Valley_ and _Studio Ghibli_
- **Technologies**: React Native or Flutter for cross-platform compatibility
- **Features**:
  - Interactive realm visualization
  - Chat interface for guardian interactions
  - Dashboard displaying financial statistics and realm status

---

### **5. Future Enhancements**

- **Additional Guardian Types**: Introduce new mystical creatures with unique personalities
- **Realm Customization**: Allow users to personalize their realm's appearance
- **Community Features**: Enable users to visit and interact with friends' realms
- **Seasonal Events**: Introduce limited-time events and challenges
- **Educational Content**: Provide financial literacy resources and mini-games

---

### **6. Goals & Impact**

- **Behavioral Change**: Encourage users to develop and maintain healthy saving habits
- **Emotional Engagement**: Foster a bond between users and their guardians to reinforce financial responsibility
- **Financial Literacy**: Educate users through interactive and immersive experiences
- **User Retention**: Utilize gamification and personalization to maintain user interest and commitment
