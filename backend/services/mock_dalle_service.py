"""
Mock DALL-E Service - Free image generation for development.

Provides placeholder images without calling DALL-E API.
"""

import random
from typing import Dict, Optional
from datetime import datetime
import base64


class MockDALLEService:
    """Mock implementation of DALL-E API for development"""
    
    def __init__(self):
        self.generation_count = 0
        self.generated_images = []
    
    async def generate_character_portrait(
        self,
        character_name: str,
        race: str,
        char_class: str,
        description: Optional[str] = None,
        style: str = "fantasy art"
    ) -> Dict:
        """Generate character portrait (mock)"""
        self.generation_count += 1
        
        # Use placeholder image service
        image_url = self._get_placeholder_image("character", character_name)
        
        result = {
            "image_url": image_url,
            "thumbnail_url": image_url,
            "prompt": f"{race} {char_class} named {character_name}, {style}",
            "style": style,
            "generation_id": f"mock_char_{self.generation_count}",
            "cost": 0.0,
            "timestamp": datetime.now().isoformat(),
            "mock_mode": True
        }
        
        self.generated_images.append(result)
        return result
    
    async def generate_battle_map(
        self,
        map_type: str,
        dimensions: str = "30x40",
        terrain: str = "dungeon",
        grid_type: str = "square",
        description: Optional[str] = None
    ) -> Dict:
        """Generate battle map (mock)"""
        self.generation_count += 1
        
        image_url = self._get_placeholder_image("map", f"{terrain}_{dimensions}")
        
        result = {
            "image_url": image_url,
            "thumbnail_url": image_url,
            "map_type": map_type,
            "dimensions": dimensions,
            "grid_type": grid_type,
            "terrain": terrain,
            "prompt": f"{map_type} map with {terrain} terrain, {dimensions} grid",
            "generation_id": f"mock_map_{self.generation_count}",
            "cost": 0.0,
            "timestamp": datetime.now().isoformat(),
            "mock_mode": True,
            "metadata": {
                "grid_size": self._parse_dimensions(dimensions),
                "features": ["walls", "doors", "obstacles"]
            }
        }
        
        self.generated_images.append(result)
        return result
    
    async def generate_npc_portrait(
        self,
        npc_name: str,
        npc_type: str,
        description: Optional[str] = None,
        mood: str = "neutral"
    ) -> Dict:
        """Generate NPC portrait (mock)"""
        self.generation_count += 1
        
        image_url = self._get_placeholder_image("npc", npc_name)
        
        result = {
            "image_url": image_url,
            "thumbnail_url": image_url,
            "prompt": f"{npc_type} named {npc_name}, {mood} expression",
            "npc_type": npc_type,
            "mood": mood,
            "generation_id": f"mock_npc_{self.generation_count}",
            "cost": 0.0,
            "timestamp": datetime.now().isoformat(),
            "mock_mode": True
        }
        
        self.generated_images.append(result)
        return result
    
    async def generate_item_image(
        self,
        item_name: str,
        item_type: str,
        rarity: str = "common",
        description: Optional[str] = None
    ) -> Dict:
        """Generate item/artifact image (mock)"""
        self.generation_count += 1
        
        image_url = self._get_placeholder_image("item", item_name)
        
        result = {
            "image_url": image_url,
            "thumbnail_url": image_url,
            "prompt": f"{rarity} {item_type} - {item_name}",
            "item_type": item_type,
            "rarity": rarity,
            "generation_id": f"mock_item_{self.generation_count}",
            "cost": 0.0,
            "timestamp": datetime.now().isoformat(),
            "mock_mode": True
        }
        
        self.generated_images.append(result)
        return result
    
    async def generate_scene(
        self,
        scene_type: str,
        description: str,
        mood: str = "neutral",
        lighting: str = "natural"
    ) -> Dict:
        """Generate scene/environment image (mock)"""
        self.generation_count += 1
        
        image_url = self._get_placeholder_image("scene", scene_type)
        
        result = {
            "image_url": image_url,
            "thumbnail_url": image_url,
            "prompt": f"{scene_type} scene: {description}, {mood} mood, {lighting} lighting",
            "scene_type": scene_type,
            "mood": mood,
            "lighting": lighting,
            "generation_id": f"mock_scene_{self.generation_count}",
            "cost": 0.0,
            "timestamp": datetime.now().isoformat(),
            "mock_mode": True
        }
        
        self.generated_images.append(result)
        return result
    
    def _get_placeholder_image(self, image_type: str, identifier: str) -> str:
        """
        Get placeholder image URL.
        Using picsum.photos for random placeholder images.
        In production, you might want to use your own placeholder images.
        """
        # Map types to dimensions
        dimensions = {
            "character": "400x600",
            "npc": "400x600",
            "map": "800x600",
            "item": "400x400",
            "scene": "800x600"
        }
        
        dim = dimensions.get(image_type, "400x400")
        width, height = dim.split("x")
        
        # Use a seed based on identifier for consistent images
        seed = abs(hash(identifier)) % 1000
        
        # Using picsum.photos (free placeholder image service)
        return f"https://picsum.photos/seed/{seed}/{width}/{height}"
    
    def _parse_dimensions(self, dimensions: str) -> Dict:
        """Parse dimension string like '30x40' into dict"""
        try:
            width, height = dimensions.lower().split("x")
            return {
                "width": int(width),
                "height": int(height),
                "total_squares": int(width) * int(height)
            }
        except:
            return {"width": 30, "height": 40, "total_squares": 1200}
    
    def get_generated_images(self, limit: int = 50) -> list:
        """Get recently generated images"""
        return self.generated_images[-limit:]
    
    def get_stats(self) -> Dict:
        """Get usage statistics"""
        return {
            "total_generations": self.generation_count,
            "images_stored": len(self.generated_images),
            "total_cost": 0.0,  # Always free!
            "mock_mode": True
        }
    
    def clear_history(self):
        """Clear generation history"""
        self.generated_images = []
        self.generation_count = 0


# Singleton instance
_mock_dalle_service = None

def get_mock_dalle_service() -> MockDALLEService:
    """Get or create mock DALL-E service singleton"""
    global _mock_dalle_service
    if _mock_dalle_service is None:
        _mock_dalle_service = MockDALLEService()
    return _mock_dalle_service
