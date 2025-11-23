"""
PDF Character Sheet Import

Parse PDF character sheets and extract character data.
Supports D&D 5e official character sheets.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import PyPDF2
import re
import io

router = APIRouter(prefix="/api/pdf", tags=["PDF Import"])


class CharacterData(BaseModel):
    """Extracted character data"""
    name: Optional[str] = None
    race: Optional[str] = None
    char_class: Optional[str] = None
    level: Optional[int] = None
    background: Optional[str] = None
    alignment: Optional[str] = None
    
    # Ability Scores
    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None
    
    # Combat Stats
    armor_class: Optional[int] = None
    max_hp: Optional[int] = None
    current_hp: Optional[int] = None
    speed: Optional[int] = None
    
    # Proficiencies
    proficiency_bonus: Optional[int] = None
    proficiencies: Optional[str] = None
    languages: Optional[str] = None
    
    # Features
    features: Optional[str] = None
    traits: Optional[str] = None
    equipment: Optional[str] = None
    
    # Metadata
    raw_text: Optional[str] = None
    confidence: float = 0.0


def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {str(e)}")


def parse_character_sheet(text: str) -> CharacterData:
    """
    Parse character data from PDF text.
    Uses pattern matching to extract common D&D 5e character sheet fields.
    """
    
    data = CharacterData(raw_text=text)
    confidence_score = 0.0
    max_fields = 15  # Number of fields we try to extract
    
    # Character Name
    name_match = re.search(r"Character\s*Name[:\s]+([A-Za-z\s]+)", text, re.IGNORECASE)
    if name_match:
        data.name = name_match.group(1).strip()
        confidence_score += 1
    
    # Class & Level
    class_match = re.search(r"Class[:\s]+([A-Za-z]+)", text, re.IGNORECASE)
    if class_match:
        data.char_class = class_match.group(1).strip()
        confidence_score += 1
    
    level_match = re.search(r"Level[:\s]+(\d+)", text, re.IGNORECASE)
    if level_match:
        data.level = int(level_match.group(1))
        confidence_score += 1
    
    # Race
    race_match = re.search(r"Race[:\s]+([A-Za-z\s]+)", text, re.IGNORECASE)
    if race_match:
        data.race = race_match.group(1).strip()
        confidence_score += 1
    
    # Background
    bg_match = re.search(r"Background[:\s]+([A-Za-z\s]+)", text, re.IGNORECASE)
    if bg_match:
        data.background = bg_match.group(1).strip()
        confidence_score += 1
    
    # Alignment
    alignment_match = re.search(r"Alignment[:\s]+([A-Za-z\s]+)", text, re.IGNORECASE)
    if alignment_match:
        data.alignment = alignment_match.group(1).strip()
        confidence_score += 1
    
    # Ability Scores
    str_match = re.search(r"(?:STR|Strength)[:\s]+(\d+)", text, re.IGNORECASE)
    if str_match:
        data.strength = int(str_match.group(1))
        confidence_score += 1
    
    dex_match = re.search(r"(?:DEX|Dexterity)[:\s]+(\d+)", text, re.IGNORECASE)
    if dex_match:
        data.dexterity = int(dex_match.group(1))
        confidence_score += 1
    
    con_match = re.search(r"(?:CON|Constitution)[:\s]+(\d+)", text, re.IGNORECASE)
    if con_match:
        data.constitution = int(con_match.group(1))
        confidence_score += 1
    
    int_match = re.search(r"(?:INT|Intelligence)[:\s]+(\d+)", text, re.IGNORECASE)
    if int_match:
        data.intelligence = int(int_match.group(1))
        confidence_score += 1
    
    wis_match = re.search(r"(?:WIS|Wisdom)[:\s]+(\d+)", text, re.IGNORECASE)
    if wis_match:
        data.wisdom = int(wis_match.group(1))
        confidence_score += 1
    
    cha_match = re.search(r"(?:CHA|Charisma)[:\s]+(\d+)", text, re.IGNORECASE)
    if cha_match:
        data.charisma = int(cha_match.group(1))
        confidence_score += 1
    
    # Combat Stats
    ac_match = re.search(r"(?:AC|Armor Class)[:\s]+(\d+)", text, re.IGNORECASE)
    if ac_match:
        data.armor_class = int(ac_match.group(1))
        confidence_score += 1
    
    hp_match = re.search(r"(?:HP|Hit Points)[:\s]+(\d+)", text, re.IGNORECASE)
    if hp_match:
        data.max_hp = int(hp_match.group(1))
        data.current_hp = data.max_hp
        confidence_score += 1
    
    speed_match = re.search(r"Speed[:\s]+(\d+)", text, re.IGNORECASE)
    if speed_match:
        data.speed = int(speed_match.group(1))
        confidence_score += 1
    
    # Calculate confidence
    data.confidence = confidence_score / max_fields
    
    return data


@router.post("/import-character", response_model=CharacterData)
async def import_character_sheet(file: UploadFile = File(...)):
    """
    Import character from PDF.
    
    Accepts D&D 5e character sheets in PDF format.
    Extracts character data using pattern matching.
    
    Returns character data with confidence score.
    Higher confidence = more fields successfully extracted.
    """
    
    # Validate file type
    if not file.filename or not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Read file
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Extract text
    try:
        text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
    # Parse character data
    try:
        character_data = parse_character_sheet(text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse character data: {str(e)}"
        )
    
    # Check if we got meaningful data
    if character_data.confidence < 0.2:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "low_confidence",
                "message": "Could not extract enough data from PDF. Make sure it's a standard D&D 5e character sheet.",
                "confidence": character_data.confidence,
                "extracted_data": character_data.model_dump(exclude={'raw_text'})
            }
        )
    
    return character_data


@router.get("/supported-formats")
async def get_supported_formats():
    """Get information about supported PDF formats"""
    
    return {
        "supported_formats": [
            {
                "name": "D&D 5e Official Character Sheet",
                "description": "Official Wizards of the Coast character sheet",
                "confidence": "High",
                "fields": ["name", "race", "class", "level", "abilities", "hp", "ac"]
            },
            {
                "name": "D&D 5e Form-Fillable PDF",
                "description": "Common form-fillable character sheets",
                "confidence": "Medium",
                "fields": ["name", "class", "level", "abilities"]
            }
        ],
        "tips": [
            "Ensure PDF text is selectable (not scanned images)",
            "Use standard field labels (Character Name, Class, Level, etc.)",
            "Higher quality PDFs yield better extraction",
            "Confidence score indicates extraction success rate"
        ],
        "limitations": [
            "Cannot extract from image-only PDFs",
            "Custom or heavily modified sheets may not parse correctly",
            "Handwritten PDFs are not supported"
        ]
    }


@router.post("/preview-text")
async def preview_pdf_text(file: UploadFile = File(...)):
    """
    Preview extracted text from PDF.
    Useful for debugging parsing issues.
    """
    
    if not file.filename or not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    try:
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        
        return {
            "filename": file.filename,
            "text_length": len(text),
            "preview": text[:1000],  # First 1000 characters
            "full_text": text
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text: {str(e)}"
        )
