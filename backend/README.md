# RollScape Backend

The backend API for RollScape, built with FastAPI and Python.

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis
- pip

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
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

5. Run database migrations:
```bash
alembic upgrade head
```

### Running the Server

Development mode with auto-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── agents/          # AI agent implementations
│   ├── dm_agent.py
│   ├── player_agent.py
│   ├── assistant_agent.py
│   └── generator_agent.py
├── api/             # API endpoints
│   ├── auth.py
│   ├── campaigns.py
│   ├── characters.py
│   └── gameplay.py
├── models/          # Database models
│   ├── user.py
│   ├── campaign.py
│   └── character.py
├── services/        # Business logic
│   ├── game_logic.py
│   ├── dice.py
│   └── combat.py
├── utils/           # Utilities
│   ├── embeddings.py
│   └── storage.py
└── main.py          # FastAPI app
```

## Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=. --cov-report=html
```

## Environment Variables

See `.env.example` for required environment variables.
