'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Group } from 'react-konva';
import { Loader2 } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Token {
  id: string;
  name: string;
  position: Position;
  color: string;
  size: number;
  isPlayer: boolean;
  hp?: number;
  maxHp?: number;
}

interface BattleMapProps {
  width?: number;
  height?: number;
  gridSize?: number;
  showGrid?: boolean;
  tokens: Token[];
  onTokenMove?: (tokenId: string, newPosition: Position) => void;
  backgroundImage?: string;
}

export default function BattleMap({
  width = 800,
  height = 600,
  gridSize = 40,
  showGrid = true,
  tokens,
  onTokenMove,
  backgroundImage
}: BattleMapProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<any>(null);

  const gridColumns = Math.ceil(width / gridSize);
  const gridRows = Math.ceil(height / gridSize);

  // Snap position to grid
  const snapToGrid = (pos: Position): Position => {
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  };

  // Calculate grid lines
  const gridLines: any[] = [];
  
  if (showGrid) {
    // Vertical lines
    for (let i = 0; i <= gridColumns; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#333"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridRows; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#333"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
  }

  // Handle token drag
  const handleTokenDragStart = (tokenId: string) => {
    setSelectedToken(tokenId);
    setIsDragging(true);
  };

  const handleTokenDragEnd = (tokenId: string, e: any) => {
    setIsDragging(false);
    
    const stage = e.target.getStage();
    const position = e.target.position();
    const snappedPosition = snapToGrid(position);
    
    // Update token position
    e.target.position(snappedPosition);
    
    // Notify parent
    if (onTokenMove) {
      onTokenMove(tokenId, snappedPosition);
    }
  };

  return (
    <div className="relative border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        className="bg-gray-900"
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#1a1a1a"
          />
          
          {/* Grid */}
          {gridLines}
          
          {/* Tokens */}
          {tokens.map((token) => (
            <Group
              key={token.id}
              x={token.position.x}
              y={token.position.y}
              draggable
              onDragStart={() => handleTokenDragStart(token.id)}
              onDragEnd={(e) => handleTokenDragEnd(token.id, e)}
              onClick={() => setSelectedToken(token.id)}
            >
              {/* Token circle */}
              <Circle
                radius={token.size / 2}
                fill={token.color}
                stroke={selectedToken === token.id ? '#fbbf24' : '#fff'}
                strokeWidth={selectedToken === token.id ? 3 : 2}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.5}
                opacity={0.9}
              />
              
              {/* Token name */}
              <Text
                text={token.name}
                fontSize={12}
                fill="white"
                align="center"
                verticalAlign="middle"
                x={-token.size / 2}
                y={token.size / 2 + 5}
                width={token.size}
                fontStyle="bold"
                shadowColor="black"
                shadowBlur={3}
                shadowOpacity={0.8}
              />
              
              {/* HP bar (if available) */}
              {token.hp !== undefined && token.maxHp !== undefined && (
                <Group y={-token.size / 2 - 10}>
                  {/* Background bar */}
                  <Rect
                    x={-token.size / 2}
                    y={0}
                    width={token.size}
                    height={6}
                    fill="#333"
                    cornerRadius={3}
                  />
                  
                  {/* HP bar */}
                  <Rect
                    x={-token.size / 2}
                    y={0}
                    width={token.size * (token.hp / token.maxHp)}
                    height={6}
                    fill={token.hp > token.maxHp * 0.5 ? '#10b981' : token.hp > token.maxHp * 0.25 ? '#f59e0b' : '#ef4444'}
                    cornerRadius={3}
                  />
                </Group>
              )}
            </Group>
          ))}
        </Layer>
      </Stage>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">Players</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Enemies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Allies</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Click and drag tokens to move • {gridSize}ft grid squares
        </div>
      </div>
    </div>
  );
}
