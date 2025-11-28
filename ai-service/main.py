import os
import re
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Trello-Cliq AI Microservice",
    description="AI-powered task analysis, summarization, and insights",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_API_KEY = os.getenv("AI_API_KEY")
USE_OPENAI = AI_API_KEY and AI_API_KEY.startswith("sk-")

if USE_OPENAI:
    from openai import OpenAI
    client = OpenAI(api_key=AI_API_KEY)

class SummarizeRequest(BaseModel):
    text: str

class ExtractTasksRequest(BaseModel):
    text: str

class PriorityRequest(BaseModel):
    card: Dict[str, Any]

class AnalyticsRequest(BaseModel):
    cards: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {
        "service": "Trello-Cliq AI Microservice",
        "version": "1.0.0",
        "status": "running",
        "ai_enabled": USE_OPENAI
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ai_provider": "openai" if USE_OPENAI else "rule-based"
    }

@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    """Generate a concise summary of the provided text"""
    try:
        if USE_OPENAI:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise summaries of tasks and cards. Keep summaries under 100 words."},
                    {"role": "user", "content": f"Summarize this task:\n\n{request.text}"}
                ],
                max_tokens=150,
                temperature=0.7
            )
            summary = response.choices[0].message.content.strip()
        else:
            summary = rule_based_summarize(request.text)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/extract_tasks")
async def extract_tasks(request: ExtractTasksRequest):
    """Extract actionable tasks from text"""
    try:
        if USE_OPENAI:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a task extraction assistant. Extract clear, actionable tasks from the provided text. Return a list of tasks, one per line."},
                    {"role": "user", "content": f"Extract tasks from this text:\n\n{request.text}"}
                ],
                max_tokens=300,
                temperature=0.5
            )
            tasks_text = response.choices[0].message.content.strip()
            tasks = [task.strip('- ').strip() for task in tasks_text.split('\n') if task.strip()]
        else:
            tasks = rule_based_extract_tasks(request.text)
        
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task extraction failed: {str(e)}")

@app.post("/priority")
async def analyze_priority(request: PriorityRequest):
    """Analyze and determine task priority"""
    try:
        card = request.card
        text = f"{card.get('name', '')} {card.get('description', '')}".lower()
        
        if USE_OPENAI:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a task priority analyzer. Analyze the task and respond with only one word: 'high', 'medium', or 'low'."},
                    {"role": "user", "content": f"Analyze priority for this task:\nTitle: {card.get('name')}\nDescription: {card.get('description')}\nDue Date: {card.get('dueDate')}"}
                ],
                max_tokens=10,
                temperature=0.3
            )
            priority = response.choices[0].message.content.strip().lower()
            if priority not in ['high', 'medium', 'low']:
                priority = 'medium'
        else:
            priority = rule_based_priority(card)
        
        return {
            "priority": priority,
            "confidence": 0.85 if USE_OPENAI else 0.7
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Priority analysis failed: {str(e)}")

@app.post("/analytics")
async def generate_analytics(request: AnalyticsRequest):
    """Generate productivity analytics from cards"""
    try:
        cards = request.cards
        
        total_cards = len(cards)
        completed = sum(1 for c in cards if c.get('closed', False))
        urgent = sum(1 for c in cards if 'urgent' in str(c.get('name', '')).lower())
        
        priority_distribution = {
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        for card in cards:
            text = str(card.get('name', '')).lower()
            if any(word in text for word in ['urgent', 'critical', 'asap', 'important']):
                priority_distribution['high'] += 1
            elif any(word in text for word in ['bug', 'error', 'issue', 'fix']):
                priority_distribution['medium'] += 1
            else:
                priority_distribution['low'] += 1
        
        completion_rate = (completed / total_cards * 100) if total_cards > 0 else 0
        
        analytics = {
            "total_cards": total_cards,
            "completed": completed,
            "in_progress": total_cards - completed,
            "urgent_tasks": urgent,
            "completion_rate": round(completion_rate, 2),
            "priority_distribution": priority_distribution,
            "productivity_score": round(min(completion_rate + (urgent / max(total_cards, 1) * 20), 100), 2)
        }
        
        return {"analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics generation failed: {str(e)}")

def rule_based_summarize(text: str) -> str:
    """Rule-based summarization fallback"""
    sentences = text.split('.')
    if len(sentences) > 2:
        return '. '.join(sentences[:2]) + '.'
    return text[:200] + ('...' if len(text) > 200 else '')

def rule_based_extract_tasks(text: str) -> List[str]:
    """Rule-based task extraction fallback"""
    tasks = []
    
    task_patterns = [
        r'(?:TODO|To do|Task):\s*(.+)',
        r'(?:Need to|Should|Must)\s+(.+)',
        r'[-•]\s*(.+)',
    ]
    
    for pattern in task_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        tasks.extend(matches)
    
    if not tasks:
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        tasks = sentences[:3]
    
    return tasks[:10]

def rule_based_priority(card: Dict[str, Any]) -> str:
    """Rule-based priority analysis fallback"""
    text = f"{card.get('name', '')} {card.get('description', '')}".lower()
    
    high_priority_keywords = ['urgent', 'critical', 'asap', 'important', 'emergency', 'blocker']
    medium_priority_keywords = ['bug', 'error', 'issue', 'fix', 'problem']
    
    if any(keyword in text for keyword in high_priority_keywords):
        return 'high'
    elif any(keyword in text for keyword in medium_priority_keywords):
        return 'medium'
    else:
        return 'low'

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
