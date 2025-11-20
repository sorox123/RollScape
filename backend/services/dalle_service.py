"""
DALL-E Image Generation Service

Handles AI image generation for maps, characters, and tokens.
Supports both production (DALL-E) and mock modes.
"""

import os
import base64
import json
from datetime import datetime
from typing import Optional, Dict, Any, Literal
from pathlib import Path

from services.service_config import openai_config, ServiceMode

ImageType = Literal["map_topdown", "map_scenic", "character", "token", "npc"]


class MockDALLEClient:
    """Mock DALL-E client for development"""
    
    def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "standard"
    ) -> Dict[str, Any]:
        """Return mock image data"""
        return {
            "created": int(datetime.now().timestamp()),
            "data": [{
                "url": f"https://via.placeholder.com/{size}/1a1a1a/ffffff?text=Mock+Image",
                "revised_prompt": f"[MOCK] {prompt}"
            }]
        }


class DALLEService:
    """DALL-E image generation service with rate limiting and cost tracking"""
    
    # Cost per image (DALL-E 3 pricing as of 2024)
    PRICING = {
        "1024x1024": {"standard": 0.040, "hd": 0.080},
        "1024x1792": {"standard": 0.080, "hd": 0.120},
        "1792x1024": {"standard": 0.080, "hd": 0.120},
    }
    
    def __init__(self):
        self.config = openai_config
        self.client = None
        
        if self.config.mode == ServiceMode.MOCK:
            self.client = MockDALLEClient()
        else:
            self._init_production_client()
    
    def _init_production_client(self):
        """Initialize production OpenAI client"""
        try:
            from openai import OpenAI
            
            self.client = OpenAI(api_key=self.config.api_key)
        except ImportError:
            raise ImportError("openai required: pip install openai")
    
    def calculate_cost(self, size: str, quality: str) -> float:
        """Calculate cost for image generation"""
        pricing = self.PRICING.get(size, self.PRICING["1024x1024"])
        return pricing.get(quality, pricing["standard"])
    
    async def generate_image(
        self,
        prompt: str,
        image_type: ImageType,
        size: str = "1024x1024",
        quality: str = "standard",
        style: str = "vivid",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an image using DALL-E 3
        
        Args:
            prompt: The image generation prompt
            image_type: Type of image (map_topdown, map_scenic, character, token, npc)
            size: Image size (1024x1024, 1024x1792, 1792x1024)
            quality: Image quality (standard, hd)
            style: Image style (vivid, natural)
            user_id: User ID for quota tracking
        
        Returns:
            Dictionary with image URL, revised prompt, and metadata
        """
        
        # Enhance prompt based on image type
        enhanced_prompt = self._enhance_prompt(prompt, image_type)
        
        # Calculate cost
        cost = self.calculate_cost(size, quality)
        
        # Generate image
        if self.config.mode == ServiceMode.MOCK:
            response = self.client.generate_image(enhanced_prompt, size, quality)
        else:
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=enhanced_prompt,
                size=size,
                quality=quality,
                style=style,
                n=1
            )
            response = response.model_dump()
        
        # Extract image data
        image_data = response["data"][0]
        
        return {
            "url": image_data.get("url"),
            "b64_json": image_data.get("b64_json"),
            "revised_prompt": image_data.get("revised_prompt", enhanced_prompt),
            "original_prompt": prompt,
            "image_type": image_type,
            "size": size,
            "quality": quality,
            "style": style,
            "cost": cost,
            "created_at": datetime.now().isoformat(),
            "user_id": user_id,
            "is_mock": self.config.mode == ServiceMode.MOCK
        }
    
    def _enhance_prompt(self, prompt: str, image_type: ImageType) -> str:
        """Enhance prompt with type-specific instructions"""
        
        enhancements = {
            "map_topdown": (
                "Top-down battle map view, dungeons and dragons style, "
                "grid-ready, clear pathways and rooms, strategic layout. "
            ),
            "map_scenic": (
                "Cinematic landscape view, epic fantasy scene, "
                "dramatic lighting, immersive environment, detailed scenery. "
            ),
            "character": (
                "Dungeons and Dragons character portrait, fantasy art style, "
                "detailed face and clothing, heroic pose, professional quality. "
            ),
            "token": (
                "Dungeons and Dragons token, circular frame, top-down view, "
                "clear silhouette, game piece style, simple background. "
            ),
            "npc": (
                "Dungeons and Dragons NPC portrait, fantasy art style, "
                "detailed features, expressive character, medieval fantasy setting. "
            )
        }
        
        enhancement = enhancements.get(image_type, "")
        return f"{enhancement}{prompt}"
    
    def build_character_prompt(
        self,
        character_name: str,
        race: str,
        char_class: str,
        appearance: Optional[str] = None,
        background: Optional[str] = None,
        alignment: Optional[str] = None,
        additional_details: Optional[str] = None
    ) -> str:
        """
        Build a character prompt from character sheet data
        
        Args:
            character_name: Character name
            race: Character race (e.g., "Elf", "Dwarf")
            char_class: Character class (e.g., "Wizard", "Fighter")
            appearance: Physical appearance description
            background: Character background story
            alignment: Character alignment (e.g., "Chaotic Good")
            additional_details: Any extra details
        
        Returns:
            Enhanced prompt for character generation
        """
        
        prompt_parts = [f"{race} {char_class} named {character_name}"]
        
        if appearance:
            prompt_parts.append(appearance)
        
        if alignment:
            prompt_parts.append(f"with {alignment} alignment")
        
        if background:
            # Extract key details from background (first sentence or key phrases)
            bg_summary = background[:200] if len(background) > 200 else background
            prompt_parts.append(bg_summary)
        
        if additional_details:
            prompt_parts.append(additional_details)
        
        return ", ".join(prompt_parts)
    
    def build_map_prompt(
        self,
        environment: str,
        style: str,
        mood: Optional[str] = None,
        features: Optional[list] = None,
        additional_details: Optional[str] = None
    ) -> str:
        """
        Build a map prompt from parameters
        
        Args:
            environment: Environment type (dungeon, forest, tavern, etc.)
            style: Map style (top-down, scenic, isometric)
            mood: Atmosphere (dark, mysterious, bright, etc.)
            features: List of features to include (altar, traps, treasure, etc.)
            additional_details: Any extra details
        
        Returns:
            Enhanced prompt for map generation
        """
        
        prompt_parts = [f"{environment}"]
        
        if mood:
            prompt_parts.append(f"{mood} atmosphere")
        
        if features:
            prompt_parts.append(f"containing {', '.join(features)}")
        
        if additional_details:
            prompt_parts.append(additional_details)
        
        return ", ".join(prompt_parts)


# Singleton instance
dalle_service = DALLEService()
