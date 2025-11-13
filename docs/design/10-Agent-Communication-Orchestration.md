# Inter-Agent Communication & Orchestration

## Communication Architecture

### Message Queue System

All agents communicate through a centralized message bus using a standardized message format.

**Message Format:**
```json
{
  "messageId": "uuid",
  "timestamp": "2025-11-12T14:30:00Z",
  "fromAgent": "dm|player|assistant|generator|system",
  "toAgent": "dm|player|assistant|generator|system",
  "priority": "high|normal|low",
  "messageType": "request|response|event|update",
  "correlationId": "uuid", // Links requests to responses
  "sessionId": "uuid",
  "payload": {
    // Agent-specific data
  },
  "metadata": {
    "retryCount": 0,
    "timeout": 30000
  }
}
```

### Message Types

#### Request
```json
{
  "messageType": "request",
  "fromAgent": "dm",
  "toAgent": "generator",
  "payload": {
    "action": "generate_map",
    "parameters": {
      "type": "battle",
      "dimensions": "30x40",
      "terrain": ["forest", "ruins"]
    }
  }
}
```

#### Response
```json
{
  "messageType": "response",
  "fromAgent": "generator",
  "toAgent": "dm",
  "correlationId": "original-request-id",
  "payload": {
    "success": true,
    "data": {
      "mapId": "uuid",
      "imageUrl": "https://...",
      "metadata": {}
    }
  }
}
```

#### Event
```json
{
  "messageType": "event",
  "fromAgent": "dm",
  "toAgent": "system",
  "payload": {
    "eventType": "turn_end",
    "data": {
      "characterId": "uuid",
      "turnNumber": 5
    }
  }
}
```

## Orchestration Patterns

### Pattern 1: Game Session Flow (Main Workflow)

```
Human Player Action
        ↓
    [Frontend]
        ↓
   [Backend API]
        ↓
    [DM Agent] ─────→ Query Rules DB (if needed)
        │
        ├──→ [Creative Generator] (if new location/NPC)
        │           ↓
        │    Generate Assets
        │           ↓
        │    Return Assets
        │           ↓
        ↓
   Process Action
        ↓
   Update Game State
        ↓
   AI Players Turn?
        ↓
   [Player Agent(s)]
        ↓
    [DM Agent] (process AI actions)
        ↓
   [Backend API]
        ↓
    [Frontend]
        ↓
   Display Updates
```

**Implementation:**

```python
class GameSessionOrchestrator:
    def __init__(self, session_id):
        self.session_id = session_id
        self.dm_agent = DMAgent(session_id)
        self.player_agents = {}
        self.message_bus = MessageBus()
        
    async def process_player_action(self, player_id, action):
        # 1. Validate action
        if not self.validate_action(action):
            return {"error": "Invalid action"}
        
        # 2. Send to DM Agent
        dm_result = await self.dm_agent.process_action(
            player_id=player_id,
            action=action,
            game_state=self.get_game_state()
        )
        
        # 3. Handle content generation if needed
        if dm_result.get('requiresContentGeneration'):
            content = await self.request_content_generation(
                dm_result['requiresContentGeneration']
            )
            dm_result['generatedContent'] = content
        
        # 4. Update game state
        await self.update_game_state(dm_result['stateUpdates'])
        
        # 5. Check if AI players need to act
        if self.is_ai_player_turn():
            ai_actions = await self.process_ai_player_turns()
            dm_result['aiPlayerActions'] = ai_actions
        
        # 6. Return combined result
        return dm_result
    
    async def process_ai_player_turns(self):
        ai_actions = []
        
        for character_id in self.get_ai_characters_in_turn_order():
            # Get Player Agent for this character
            agent = self.get_or_create_player_agent(character_id)
            
            # Get action from AI player
            action = await agent.decide_action(
                situation=self.get_current_situation(),
                character=self.get_character(character_id)
            )
            
            # Process through DM
            result = await self.dm_agent.process_action(
                player_id=character_id,
                action=action,
                game_state=self.get_game_state()
            )
            
            ai_actions.append(result)
        
        return ai_actions
```

### Pattern 2: Campaign Creation Flow

```
User Starts Campaign Creation
        ↓
  [Campaign Assistant Agent]
        ↓
   Multi-turn Conversation
        │
        ├──→ Generate Villain Portrait
        │    [Creative Generator Agent]
        │           ↓
        │    Return Image
        │           ↓
        ├──→ Generate World Map
        │    [Creative Generator Agent]
        │           ↓
        │    Return Map
        │           ↓
        ↓
   Campaign Complete
        ↓
   Save to Database
        ↓
   Campaign Ready for Play
```

**Implementation:**

```python
class CampaignCreationOrchestrator:
    def __init__(self, user_id):
        self.user_id = user_id
        self.assistant_agent = CampaignAssistantAgent()
        self.generator_agent = CreativeGeneratorAgent()
        self.conversation_state = {}
        
    async def process_user_input(self, user_input):
        # Send to Campaign Assistant
        assistant_response = await self.assistant_agent.process_input(
            user_input=user_input,
            conversation_state=self.conversation_state
        )
        
        # Check if visuals needed
        if assistant_response.get('requestVisuals'):
            visuals = await self.generator_agent.generate(
                request_type=assistant_response['requestVisuals']['type'],
                prompt=assistant_response['requestVisuals']['description'],
                context=self.conversation_state.get('campaignDraft', {})
            )
            assistant_response['generatedVisuals'] = visuals
        
        # Update conversation state
        self.conversation_state.update(
            assistant_response.get('campaignUpdate', {})
        )
        
        # Check if campaign is complete
        if assistant_response.get('completionStatus', {}).get('readyToGenerate'):
            campaign_id = await self.save_campaign()
            assistant_response['campaignId'] = campaign_id
        
        return assistant_response
```

### Pattern 3: PDF Import Flow

```
User Uploads PDF
        ↓
   [Backend Service]
        ↓
   Extract Text
        ↓
   [Campaign Assistant Agent]
        ↓
   Analyze Structure (LLM)
        ↓
   Parse Content (LLM)
        ↓
   Create Embeddings
        ↓
   Store in Vector DB
        ↓
   User Selects Components
        ↓
   Generate Rule Module
        ↓
   Save to Database
        ↓
   Rule System Ready
```

**Implementation:**

```python
class PDFImportOrchestrator:
    def __init__(self):
        self.assistant_agent = CampaignAssistantAgent()
        self.llm = LLMClient()
        self.vector_db = VectorDatabase()
        
    async def import_pdf(self, pdf_file, user_id):
        # 1. Extract text
        text = await self.extract_text(pdf_file)
        
        # 2. Analyze with LLM
        structure = await self.llm.analyze_structure(text)
        
        # 3. Guide user through import
        import_session = ImportSession(
            pdf_text=text,
            structure=structure,
            user_id=user_id
        )
        
        # 4. Interactive selection
        selected_components = await self.assistant_agent.guide_pdf_import(
            import_session
        )
        
        # 5. Parse selected sections
        parsed_data = await self.parse_sections(
            text,
            structure,
            selected_components
        )
        
        # 6. Create embeddings
        embeddings_id = await self.vector_db.create_embeddings(
            text,
            metadata={
                'user_id': user_id,
                'type': 'rulebook',
                'sections': structure['sections']
            }
        )
        
        # 7. Generate rule module
        rule_module = self.create_rule_module(
            parsed_data,
            embeddings_id
        )
        
        # 8. Save
        rule_system_id = await self.save_rule_system(rule_module)
        
        return rule_system_id
```

## Message Bus Implementation Options

### Option 1: Redis Pub/Sub

```python
import redis
import json

class MessageBus:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379)
        self.pubsub = self.redis.pubsub()
        
    async def publish(self, message):
        channel = f"agent:{message['toAgent']}"
        self.redis.publish(
            channel,
            json.dumps(message)
        )
    
    async def subscribe(self, agent_name, handler):
        channel = f"agent:{agent_name}"
        self.pubsub.subscribe(channel)
        
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                await handler(data)
```

### Option 2: RabbitMQ

```python
import aio_pika
import json

class MessageBus:
    def __init__(self):
        self.connection = None
        self.channel = None
        
    async def connect(self):
        self.connection = await aio_pika.connect_robust(
            "amqp://guest:guest@localhost/"
        )
        self.channel = await self.connection.channel()
        
    async def publish(self, message):
        exchange = await self.channel.declare_exchange(
            'agents',
            aio_pika.ExchangeType.TOPIC
        )
        
        routing_key = f"agent.{message['toAgent']}"
        
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode()
            ),
            routing_key=routing_key
        )
    
    async def subscribe(self, agent_name, handler):
        exchange = await self.channel.declare_exchange(
            'agents',
            aio_pika.ExchangeType.TOPIC
        )
        
        queue = await self.channel.declare_queue(
            f'queue_{agent_name}',
            durable=True
        )
        
        await queue.bind(exchange, f"agent.{agent_name}")
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    data = json.loads(message.body)
                    await handler(data)
```

### Option 3: In-Process Event Bus (Simple)

```python
from typing import Callable, Dict, List
import asyncio

class MessageBus:
    def __init__(self):
        self.handlers: Dict[str, List[Callable]] = {}
        
    def subscribe(self, agent_name: str, handler: Callable):
        if agent_name not in self.handlers:
            self.handlers[agent_name] = []
        self.handlers[agent_name].append(handler)
    
    async def publish(self, message: dict):
        to_agent = message['toAgent']
        
        if to_agent in self.handlers:
            tasks = [
                handler(message)
                for handler in self.handlers[to_agent]
            ]
            await asyncio.gather(*tasks)
```

## Agent Coordination Examples

### Example 1: DM Requests Map from Generator

```python
async def dm_enters_new_location(self, location_description):
    # DM Agent decides a map is needed
    request = {
        "messageId": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "fromAgent": "dm",
        "toAgent": "generator",
        "messageType": "request",
        "correlationId": str(uuid.uuid4()),
        "sessionId": self.session_id,
        "payload": {
            "action": "generate_map",
            "parameters": {
                "type": "battle",
                "description": location_description,
                "gridType": "square",
                "dimensions": "30x40",
                "style": "forest ruins"
            }
        }
    }
    
    # Publish request
    await self.message_bus.publish(request)
    
    # Wait for response (with timeout)
    response = await self.wait_for_response(
        correlation_id=request['correlationId'],
        timeout=60  # 60 seconds
    )
    
    return response['payload']['data']
```

### Example 2: Multiple AI Players Coordinate

```python
async def coordinate_ai_players(self, situation):
    """
    AI players can share information to make coordinated decisions
    """
    # Get all AI player agents
    ai_agents = [
        self.player_agents[char_id]
        for char_id in self.get_ai_character_ids()
    ]
    
    # Share party context
    party_context = {
        "threats": situation['threats'],
        "party_hp": self.get_party_hp_status(),
        "available_abilities": self.get_party_abilities()
    }
    
    # Each agent decides, but with party awareness
    actions = await asyncio.gather(*[
        agent.decide_action(situation, party_context)
        for agent in ai_agents
    ])
    
    return actions
```

### Example 3: Error Handling & Retries

```python
class ResilientMessageBus(MessageBus):
    async def publish_with_retry(self, message, max_retries=3):
        for attempt in range(max_retries):
            try:
                await self.publish(message)
                return True
            except Exception as e:
                if attempt == max_retries - 1:
                    # Log failure
                    logger.error(f"Failed to publish message after {max_retries} attempts: {e}")
                    # Store in dead letter queue
                    await self.dead_letter_queue.add(message)
                    return False
                
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
```

## Monitoring & Debugging

### Message Tracing

```python
class TracedMessageBus(MessageBus):
    def __init__(self):
        super().__init__()
        self.trace_log = []
        
    async def publish(self, message):
        # Add trace
        trace = {
            "timestamp": datetime.now().isoformat(),
            "messageId": message['messageId'],
            "from": message['fromAgent'],
            "to": message['toAgent'],
            "type": message['messageType'],
            "correlationId": message.get('correlationId')
        }
        self.trace_log.append(trace)
        
        # Publish
        await super().publish(message)
        
    def get_message_chain(self, correlation_id):
        """Get all messages in a conversation"""
        return [
            msg for msg in self.trace_log
            if msg['correlationId'] == correlation_id
        ]
```

### Performance Monitoring

```python
class MonitoredAgent:
    def __init__(self, agent_name):
        self.agent_name = agent_name
        self.metrics = {
            "messages_processed": 0,
            "avg_processing_time_ms": 0,
            "errors": 0
        }
    
    async def process_message(self, message):
        start_time = time.time()
        
        try:
            result = await self._process(message)
            
            # Update metrics
            processing_time = (time.time() - start_time) * 1000
            self.metrics["messages_processed"] += 1
            self.metrics["avg_processing_time_ms"] = (
                (self.metrics["avg_processing_time_ms"] * 
                 (self.metrics["messages_processed"] - 1) +
                 processing_time) / 
                self.metrics["messages_processed"]
            )
            
            return result
            
        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Error processing message: {e}")
            raise
```

## State Management

### Session State Store

```python
class SessionStateManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        
    async def get_state(self, session_id):
        data = await self.redis.get(f"session:{session_id}")
        return json.loads(data) if data else {}
    
    async def update_state(self, session_id, updates):
        state = await self.get_state(session_id)
        state.update(updates)
        
        await self.redis.setex(
            f"session:{session_id}",
            3600,  # 1 hour TTL
            json.dumps(state)
        )
    
    async def lock_state(self, session_id, timeout=5):
        """Distributed lock for concurrent updates"""
        lock_key = f"lock:session:{session_id}"
        
        # Try to acquire lock
        acquired = await self.redis.set(
            lock_key,
            "locked",
            nx=True,  # Only set if doesn't exist
            ex=timeout  # Expire after timeout
        )
        
        return acquired
```

## Complete Orchestration Example

```python
class CompleteGameOrchestrator:
    def __init__(self, session_id):
        self.session_id = session_id
        self.message_bus = MessageBus()
        self.state_manager = SessionStateManager()
        
        # Initialize agents
        self.dm_agent = DMAgent(session_id)
        self.player_agents = {}
        self.generator_agent = CreativeGeneratorAgent()
        
    async def start_session(self):
        """Initialize and start game session"""
        # Load campaign and characters
        campaign = await self.load_campaign()
        characters = await self.load_characters()
        
        # Initialize AI player agents
        for char in characters:
            if char['is_ai_controlled']:
                self.player_agents[char['id']] = PlayerAgent(char)
        
        # Set initial state
        await self.state_manager.update_state(self.session_id, {
            "status": "active",
            "turn": 1,
            "characters": characters
        })
        
        # Opening narrative from DM
        opening = await self.dm_agent.generate_opening_scene()
        
        return opening
    
    async def process_turn(self, character_id, action):
        """Process a single character's turn"""
        # Lock state for update
        if not await self.state_manager.lock_state(self.session_id):
            raise Exception("Could not acquire state lock")
        
        try:
            # Process action through DM
            result = await self.dm_agent.process_action(
                character_id=character_id,
                action=action,
                game_state=await self.state_manager.get_state(self.session_id)
            )
            
            # Handle any content generation
            if result.get('requiresContentGeneration'):
                content = await self.generator_agent.generate(
                    result['requiresContentGeneration']
                )
                result['generatedContent'] = content
            
            # Update state
            await self.state_manager.update_state(
                self.session_id,
                result['stateUpdates']
            )
            
            # Save to session log
            await self.save_to_log(character_id, action, result)
            
            # Advance turn
            next_character = await self.advance_turn()
            
            # If next is AI player, process their turn
            if next_character['is_ai_controlled']:
                ai_result = await self.process_ai_turn(next_character['id'])
                result['nextTurn'] = ai_result
            
            return result
            
        finally:
            # Release lock
            await self.redis.delete(f"lock:session:{self.session_id}")
```

This orchestration architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable message-based communication
- ✅ Error handling and resilience
- ✅ State consistency
- ✅ Performance monitoring
- ✅ Debugging capabilities
