/**
 * BattleMap - Tactical grid-based map for D&D combat
 * Features: Grid overlay, token placement, fog of war, measurement tools
 */

'use client';

import { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';

interface Token {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  width: number; // width in grid squares (horizontal)
  height: number; // depth in grid squares (vertical)
  elevation?: number; // height off ground in feet (for flying, etc.)
  type: 'player' | 'enemy' | 'npc';
  hp?: number;
  maxHp?: number;
  conditions?: string[];
}

interface BattleMapProps {
  width?: number;
  height?: number;
  gridSize?: number;
  backgroundImage?: string;
  tokens?: Token[];
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  onTokenSelect?: (tokenId: string | null) => void;
  isDM?: boolean;
}

export function BattleMap({
  width = 1200,
  height = 800,
  gridSize = 50,
  backgroundImage,
  tokens = [],
  onTokenMove,
  onTokenSelect,
  isDM = false,
}: BattleMapProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<'select' | 'measure' | 'fog'>('select');
  const [fogPoints, setFogPoints] = useState<{ x: number; y: number }[]>([]);
  const stageRef = useRef<any>(null);

  const gridCols = Math.ceil(width / gridSize) + 1;
  const gridRows = Math.ceil(height / gridSize) + 1;

  const snapToGrid = (value: number) => {
    return Math.round(value / gridSize) * gridSize + gridSize / 2;
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.5, Math.min(3, newScale));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const handleStageMouseDown = (e: any) => {
    if (tool === 'measure') {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const x = (pointer.x - position.x) / scale;
      const y = (pointer.y - position.y) / scale;
      
      setMeasureStart({ x: snapToGrid(x), y: snapToGrid(y) });
      setMeasuring(true);
    } else if (tool === 'fog') {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const x = (pointer.x - position.x) / scale;
      const y = (pointer.y - position.y) / scale;
      
      setFogPoints([...fogPoints, { x, y }]);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (measuring && measureStart) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const x = (pointer.x - position.x) / scale;
      const y = (pointer.y - position.y) / scale;
      
      setMeasureEnd({ x: snapToGrid(x), y: snapToGrid(y) });
    }
  };

  const handleStageMouseUp = () => {
    if (measuring) {
      setMeasuring(false);
      // Keep the measurement visible for a moment
      setTimeout(() => {
        setMeasureStart(null);
        setMeasureEnd(null);
      }, 2000);
    }
  };

  const calculateDistance = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = Math.abs(end.x - start.x) / gridSize;
    const dy = Math.abs(end.y - start.y) / gridSize;
    // D&D 5e diagonal movement: every other diagonal counts as 10ft
    return Math.max(dx, dy) * 5; // Each square is 5 feet
  };

  const TokenComponent = ({ token }: { token: Token }) => {
    const [isDragging, setIsDragging] = useState(false);
    const tokenWidth = token.width * gridSize;
    const tokenHeight = token.height * gridSize;

    return (
      <>
        {/* Token ellipse/oval */}
        <Circle
          x={token.x}
          y={token.y}
          scaleX={token.width}
          scaleY={token.height}
          radius={gridSize / 2}
          fill={token.color}
          stroke={selectedToken === token.id ? '#fbbf24' : '#000'}
          strokeWidth={selectedToken === token.id ? 4 : 2}
          opacity={isDragging ? 0.7 : 1}
          draggable={tool === 'select'}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e) => {
            setIsDragging(false);
            const newX = snapToGrid(e.target.x());
            const newY = snapToGrid(e.target.y());
            e.target.position({ x: newX, y: newY });
            onTokenMove?.(token.id, newX, newY);
          }}
          onClick={() => {
            if (tool === 'select') {
              setSelectedToken(token.id);
              onTokenSelect?.(token.id);
            }
          }}
          shadowBlur={isDragging ? 10 : 5}
          shadowOpacity={0.6}
        />
        
        {/* Elevation indicator (dashed outline if elevated) */}
        {token.elevation && token.elevation > 0 && (
          <Circle
            x={token.x}
            y={token.y}
            scaleX={token.width}
            scaleY={token.height}
            radius={gridSize / 2}
            stroke="#fbbf24"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* Token label */}
        <Text
          x={token.x - tokenWidth / 2}
          y={token.y - tokenHeight / 2 - 20}
          text={token.name}
          fontSize={14}
          fontStyle="bold"
          fill="#fff"
          stroke="#000"
          strokeWidth={2}
          align="center"
          width={tokenWidth}
        />
        
        {/* Elevation label */}
        {token.elevation && token.elevation > 0 && (
          <Text
            x={token.x - tokenWidth / 2}
            y={token.y - tokenHeight / 2 - 38}
            text={`${token.elevation}ft`}
            fontSize={12}
            fontStyle="bold"
            fill="#fbbf24"
            stroke="#000"
            strokeWidth={2}
            align="center"
            width={tokenWidth}
          />
        )}

        {/* HP bar if available */}
        {token.hp !== undefined && token.maxHp !== undefined && (
          <>
            <Rect
              x={token.x - tokenWidth / 2}
              y={token.y + tokenHeight / 2 + 5}
              width={tokenWidth}
              height={8}
              fill="#1f2937"
              cornerRadius={4}
            />
            <Rect
              x={token.x - tokenWidth / 2}
              y={token.y + tokenHeight / 2 + 5}
              width={(token.hp / token.maxHp) * tokenWidth}
              height={8}
              fill={token.hp > token.maxHp * 0.5 ? '#10b981' : token.hp > 0 ? '#f59e0b' : '#ef4444'}
              cornerRadius={4}
            />
          </>
        )}

        {/* Conditions */}
        {token.conditions && token.conditions.length > 0 && (
          <Circle
            x={token.x + tokenWidth / 2 - 10}
            y={token.y - tokenHeight / 2 + 10}
            radius={8}
            fill="#ef4444"
          />
        )}
      </>
    );
  };

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setTool('select')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tool === 'select'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          👆 Select
        </button>
        <button
          onClick={() => setTool('measure')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tool === 'measure'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          📏 Measure
        </button>
        {isDM && (
          <button
            onClick={() => setTool('fog')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tool === 'fog'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            🌫️ Fog
          </button>
        )}
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 font-medium"
        >
          🔄 Reset View
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 z-10 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
        Zoom: {Math.round(scale * 100)}%
      </div>

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        draggable={tool === 'select'}
      >
        <Layer>
          {/* Background */}
          <Rect x={0} y={0} width={width} height={height} fill="#374151" />

          {/* Grid */}
          {Array.from({ length: gridRows }).map((_, i) => (
            <Line
              key={`h-${i}`}
              points={[0, i * gridSize, width, i * gridSize]}
              stroke="#4b5563"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: gridCols }).map((_, i) => (
            <Line
              key={`v-${i}`}
              points={[i * gridSize, 0, i * gridSize, height]}
              stroke="#4b5563"
              strokeWidth={1}
            />
          ))}

          {/* Tokens */}
          {tokens.map((token) => (
            <TokenComponent key={token.id} token={token} />
          ))}

          {/* Measurement line */}
          {measureStart && measureEnd && (
            <>
              <Line
                points={[measureStart.x, measureStart.y, measureEnd.x, measureEnd.y]}
                stroke="#fbbf24"
                strokeWidth={3}
                dash={[10, 5]}
              />
              <Circle x={measureStart.x} y={measureStart.y} radius={5} fill="#fbbf24" />
              <Circle x={measureEnd.x} y={measureEnd.y} radius={5} fill="#fbbf24" />
              <Text
                x={(measureStart.x + measureEnd.x) / 2 - 30}
                y={(measureStart.y + measureEnd.y) / 2 - 30}
                text={`${calculateDistance(measureStart, measureEnd)} ft`}
                fontSize={18}
                fontStyle="bold"
                fill="#fbbf24"
                stroke="#000"
                strokeWidth={2}
              />
            </>
          )}
        </Layer>
      </Stage>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 text-white px-4 py-3 rounded-lg text-sm max-w-md">
        <div className="font-bold mb-1">Controls:</div>
        <div className="space-y-1 text-xs">
          <div>• <strong>Scroll:</strong> Zoom in/out</div>
          <div>• <strong>Drag canvas:</strong> Pan the map</div>
          <div>• <strong>Drag tokens:</strong> Move characters (snaps to grid)</div>
          <div>• <strong>Measure:</strong> Click start → drag → click end to measure distance</div>
        </div>
      </div>
    </div>
  );
}
