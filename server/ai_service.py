"""
Multi-provider AI integration for document intelligence
Supports: OpenAI, Perplexity (Sonar Pro), OpenRouter, LaoZhang
"""
import os
import json
import requests
from openai import OpenAI
from typing import List, Dict, Optional
import tiktoken
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize clients for different providers
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
LAOZHANG_API_KEY = os.getenv("LAOZHANG_API_KEY")

# Default provider (can be overridden)
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()

# Initialize OpenAI client if key is available
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def get_available_providers() -> List[str]:
    """Get list of available AI providers"""
    providers = []
    if OPENAI_API_KEY:
        providers.append("openai")
    if PERPLEXITY_API_KEY:
        providers.append("perplexity")
    if OPENROUTER_API_KEY:
        providers.append("openrouter")
    if LAOZHANG_API_KEY:
        providers.append("laozhang")
    return providers

def get_active_provider() -> str:
    """Get the active AI provider"""
    available = get_available_providers()
    if AI_PROVIDER in available:
        return AI_PROVIDER
    return available[0] if available else "none"

def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens in text"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except:
        # Fallback estimation: ~4 chars per token
        return len(text) // 4

# ============================================================================
# PROVIDER-SPECIFIC IMPLEMENTATIONS
# ============================================================================

def _call_openai(messages: List[Dict], model: str = "gpt-4o-mini", 
                 max_tokens: int = 500, response_format: Optional[Dict] = None) -> Dict:
    """Call OpenAI API"""
    if not openai_client:
        return {"success": False, "error": "OpenAI API key not configured"}
    
    try:
        kwargs = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3,
        }
        if response_format:
            kwargs["response_format"] = response_format
            
        response = openai_client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        
        return {
            "success": True,
            "content": content,
            "tokens_used": response.usage.total_tokens if response.usage else 0,
            "provider": "openai"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "openai"}

def _call_perplexity(messages: List[Dict], model: str = "sonar-pro") -> Dict:
    """Call Perplexity API (Sonar Pro)"""
    if not PERPLEXITY_API_KEY:
        return {"success": False, "error": "Perplexity API key not configured"}
    
    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.3,
            },
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "content": data["choices"][0]["message"]["content"],
            "tokens_used": data.get("usage", {}).get("total_tokens", 0),
            "provider": "perplexity"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "perplexity"}

def _call_openrouter(messages: List[Dict], model: str = "openrouter/auto") -> Dict:
    """Call OpenRouter API (supports GPT-4o-mini and many others)"""
    if not OPENROUTER_API_KEY:
        return {"success": False, "error": "OpenRouter API key not configured"}
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://legal-ai-suite.local",
                "X-Title": "Legal AI Suite"
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.3,
            },
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "content": data["choices"][0]["message"]["content"],
            "tokens_used": data.get("usage", {}).get("total_tokens", 0),
            "provider": "openrouter"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "openrouter"}

def _call_laozhang(messages: List[Dict]) -> Dict:
    """Call LaoZhang API"""
    if not LAOZHANG_API_KEY:
        return {"success": False, "error": "LaoZhang API key not configured"}
    
    try:
        # LaoZhang API endpoint - adjust if different
        response = requests.post(
            "https://api.laozhang.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {LAOZHANG_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.3,
            },
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "content": data["choices"][0]["message"]["content"],
            "tokens_used": data.get("usage", {}).get("total_tokens", 0),
            "provider": "laozhang"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "laozhang"}

def _call_ai_provider(messages: List[Dict], provider: Optional[str] = None,
                     response_format: Optional[Dict] = None, max_tokens: int = 500) -> Dict:
    """Route to appropriate AI provider"""
    active_provider = provider or get_active_provider()
    
    # Only OpenAI and OpenRouter support response_format
    supports_json_mode = active_provider in ["openai", "openrouter"]
    
    if active_provider == "openai":
        return _call_openai(messages, max_tokens=max_tokens, response_format=response_format)
    elif active_provider == "perplexity":
        # Perplexity doesn't support response_format, but we can request JSON in the prompt
        if response_format:
            # Add explicit JSON instruction to the last message
            last_msg = messages[-1]
            last_msg["content"] += "\n\nIMPORTANT: Return your response as valid JSON only, with no additional text or markdown."
        return _call_perplexity(messages)
    elif active_provider == "openrouter":
        return _call_openrouter(messages)
    elif active_provider == "laozhang":
        return _call_laozhang(messages)
    else:
        return {"success": False, "error": "No AI provider configured"}

def _parse_json_response(content: str) -> Dict:
    """Parse JSON from response, handling markdown wrapping"""
    try:
        # Handle markdown-wrapped JSON (```json ... ```)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        return {"success": True, "data": json.loads(content)}
    except (json.JSONDecodeError, IndexError) as e:
        return {"success": False, "error": str(e), "raw": content[:200]}




def generate_summary(text: str, max_tokens: int = 500, provider: Optional[str] = None) -> Dict:
    """Generate document summary using selected AI provider"""
    prompt = f"""You are a legal document analyst. Provide a concise summary of the following legal document.

Focus on:
- Main purpose and type of document
- Key parties involved
- Critical dates and deadlines
- Important obligations or rights
- Risk factors or notable clauses

Document text:
{text[:8000]}  

Provide the summary in the following JSON format:
{{
  "document_type": "type of document",
  "summary": "2-3 sentence overview",
  "key_parties": ["party1", "party2"],
  "critical_dates": ["date1", "date2"],
  "key_obligations": ["obligation1", "obligation2"],
  "risk_level": "low/medium/high"
}}"""

    messages = [{"role": "user", "content": prompt}]
    response = _call_ai_provider(messages, provider=provider, 
                                response_format={"type": "json_object"}, 
                                max_tokens=max_tokens)
    
    if response.get("success"):
        parsed = _parse_json_response(response["content"])
        if parsed["success"]:
            return {
                "success": True,
                "summary": parsed["data"],
                "tokens_used": response.get("tokens_used", 0),
                "provider": response.get("provider")
            }
        else:
            return {
                "success": False,
                "error": f"Invalid JSON: {parsed.get('error', 'Unknown')}",
                "summary": None,
                "provider": response.get("provider"),
                "raw_content": parsed.get("raw", "")
            }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "summary": None,
            "provider": response.get("provider")
        }

def extract_clauses(text: str, provider: Optional[str] = None) -> Dict:
    """Extract and categorize clauses from document"""
    prompt = f"""You are a legal document analyst. Extract and categorize important clauses from this legal document.

Focus on identifying:
- Liability clauses
- Indemnification clauses
- Termination clauses
- Payment/Financial clauses
- Confidentiality clauses
- Dispute resolution clauses
- Force majeure clauses
- Any unusual or high-risk clauses

Document text:
{text[:8000]}

Provide the response in JSON format:
{{
  "clauses": [
    {{
      "type": "clause type",
      "text": "actual clause text",
      "page_ref": "page number if mentioned",
      "risk_level": "low/medium/high",
      "explanation": "brief explanation of significance"
    }}
  ]
}}"""

    messages = [{"role": "user", "content": prompt}]
    response = _call_ai_provider(messages, provider=provider,
                                response_format={"type": "json_object"},
                                max_tokens=1500)
    
    if response.get("success"):
        try:
            result = json.loads(response["content"])
            return {
                "success": True,
                "clauses": result.get("clauses", []),
                "tokens_used": response.get("tokens_used", 0),
                "provider": response.get("provider")
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Invalid JSON response",
                "clauses": [],
                "provider": response.get("provider")
            }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "clauses": [],
            "provider": response.get("provider")
        }

def assess_risk(text: str, provider: Optional[str] = None) -> Dict:
    """Assess document risk level"""
    prompt = f"""You are a legal risk analyst. Analyze this document for potential risks and concerns.

Document text:
{text[:8000]}

Provide risk assessment in JSON format:
{{
  "overall_risk": "low/medium/high",
  "risk_factors": [
    {{
      "factor": "risk description",
      "severity": "low/medium/high",
      "mitigation": "suggested mitigation"
    }}
  ],
  "red_flags": ["flag1", "flag2"],
  "recommendations": ["recommendation1", "recommendation2"]
}}"""

    messages = [{"role": "user", "content": prompt}]
    response = _call_ai_provider(messages, provider=provider,
                                response_format={"type": "json_object"},
                                max_tokens=800)
    
    if response.get("success"):
        parsed = _parse_json_response(response["content"])
        if parsed["success"]:
            return {
                "success": True,
                "risk_assessment": parsed["data"],
                "tokens_used": response.get("tokens_used", 0),
                "provider": response.get("provider")
            }
        else:
            return {
                "success": False,
                "error": f"Invalid JSON: {parsed.get('error', '')}",
                "risk_assessment": None,
                "provider": response.get("provider")
            }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "risk_assessment": None,
            "provider": response.get("provider")
        }

def extract_facts(text: str, provider: Optional[str] = None) -> Dict:
    """Extract key facts from document"""
    prompt = f"""Extract key factual information from this legal document.

Document text:
{text[:8000]}

Provide facts in JSON format:
{{
  "parties": [
    {{
      "name": "party name",
      "role": "role in document",
      "contact": "contact info if available"
    }}
  ],
  "dates": [
    {{
      "date": "date value",
      "description": "what this date represents"
    }}
  ],
  "amounts": [
    {{
      "amount": "monetary amount",
      "description": "what this amount is for"
    }}
  ],
  "key_terms": [
    {{
      "term": "term name",
      "definition": "definition or explanation"
    }}
  ]
}}"""

    messages = [{"role": "user", "content": prompt}]
    response = _call_ai_provider(messages, provider=provider,
                                response_format={"type": "json_object"},
                                max_tokens=1000)
    
    if response.get("success"):
        parsed = _parse_json_response(response["content"])
        if parsed["success"]:
            return {
                "success": True,
                "facts": parsed["data"],
                "tokens_used": response.get("tokens_used", 0),
                "provider": response.get("provider")
            }
        else:
            return {
                "success": False,
                "error": f"Invalid JSON: {parsed.get('error', '')}",
                "facts": None,
                "provider": response.get("provider")
            }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "facts": None,
            "provider": response.get("provider")
        }

def generate_embeddings(text: str, provider: Optional[str] = None) -> List[float]:
    """Generate embeddings for text using selected provider"""
    active_provider = provider or get_active_provider()
    
    # Embeddings endpoint available in OpenAI and OpenRouter
    if active_provider == "openai" and openai_client:
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embeddings with OpenAI: {e}")
            return []
    
    elif active_provider == "openrouter" and OPENROUTER_API_KEY:
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "openai/text-embedding-3-small",
                    "input": text[:8000]
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["embedding"]
        except Exception as e:
            print(f"Error generating embeddings with OpenRouter: {e}")
            return []
    
    else:
        # Fallback: return zeros (embeddings not available for this provider)
        print(f"Embeddings not available for provider: {active_provider}")
        return [0.0] * 1536  # Return dummy embeddings

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Chunk text with overlap for embeddings"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
        
        if i + chunk_size >= len(words):
            break
    
    return chunks

def chat_with_context(question: str, context: str, conversation_history: List[Dict] = None, 
                     provider: Optional[str] = None) -> Dict:
    """Answer question based on document context using selected provider"""
    system_prompt = """You are a helpful legal AI assistant. Answer questions based ONLY on the provided document context. 

Rules:
1. If the answer is not in the context, say "I don't have enough information in this document to answer that question."
2. Always cite specific parts of the document when answering
3. Be precise and concise
4. Never make up information"""

    messages = [{"role": "system", "content": system_prompt}]
    
    if conversation_history:
        messages.extend(conversation_history[-6:])  # Keep last 6 messages
    
    messages.append({
        "role": "user",
        "content": f"Context from document:\n{context}\n\nQuestion: {question}"
    })
    
    response = _call_ai_provider(messages, provider=provider, max_tokens=500)
    
    if response.get("success"):
        return {
            "success": True,
            "answer": response["content"],
            "tokens_used": response.get("tokens_used", 0),
            "provider": response.get("provider")
        }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "answer": "Sorry, I encountered an error processing your question.",
            "provider": response.get("provider")
        }
