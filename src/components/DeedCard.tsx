import { BOARD_SPACES, COLOR_GROUP_HEX } from '../game/boardData';
import { getUnmortgageCost } from '../game/engine';
import type { PropertyState } from '../game/types';

interface DeedCardProps {
  spaceIndex: number;
  propertyState?: PropertyState;
  ownerName?: string | null;
  compact?: boolean;
}

/**
 * Authentic classic Monopoly Title Deed card rendered in ivory card stock with
 * bold color header, complete rent schedule, house/hotel cost, and mortgage values.
 */
export function DeedCard({
  spaceIndex,
  propertyState,
  ownerName,
  compact = false,
}: DeedCardProps) {
  const space = BOARD_SPACES[spaceIndex];
  if (!space) return null;

  const headerColor = space.colorGroup ? COLOR_GROUP_HEX[space.colorGroup] : '#1E293B';
  const isLightHeader = space.colorGroup === 'yellow' || space.colorGroup === 'lightBlue';
  const isMortgaged = propertyState?.mortgaged ?? false;

  return (
    <div
      className={`relative bg-[#FAF6EC] text-stone-900 rounded-[4px] border-2 border-stone-900 shadow-[0_12px_28px_rgba(0,0,0,0.45)] overflow-hidden ${
        compact ? 'w-[228px] p-2.5' : 'w-[280px] p-3'
      }`}
    >
      {/* Inner classic double frame */}
      <div className="border border-stone-900 p-2.5 flex flex-col">
        {/* Color Header Banner */}
        <div
          className="border-2 border-stone-900 px-2 py-2.5 text-center mb-2.5"
          style={{
            backgroundColor: headerColor,
            color: isLightHeader ? '#141414' : '#FFFFFF',
          }}
        >
          <div className="font-board text-[10px] tracking-[0.2em] uppercase opacity-90">
            Title Deed
          </div>
          <div className="font-board text-lg font-bold tracking-wide uppercase leading-tight mt-0.5">
            {space.name}
          </div>
        </div>

        {/* Property Rent Schedule */}
        {space.type === 'property' && space.rent && (
          <div className="space-y-1 text-[12px] font-medium">
            <div className="flex justify-between border-b border-stone-300 pb-1 font-bold">
              <span>Rent</span>
              <span className="font-mono-num">${space.rent[0]}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>With Full Color Set</span>
              <span className="font-mono-num font-semibold">${space.rent[0] * 2}</span>
            </div>
            <div className="flex justify-between">
              <span>With 1 House</span>
              <span className="font-mono-num font-semibold">${space.rent[1]}</span>
            </div>
            <div className="flex justify-between">
              <span>With 2 Houses</span>
              <span className="font-mono-num font-semibold">${space.rent[2]}</span>
            </div>
            <div className="flex justify-between">
              <span>With 3 Houses</span>
              <span className="font-mono-num font-semibold">${space.rent[3]}</span>
            </div>
            <div className="flex justify-between">
              <span>With 4 Houses</span>
              <span className="font-mono-num font-semibold">${space.rent[4]}</span>
            </div>
            <div className="flex justify-between border-t border-stone-300 pt-1 font-bold text-rose-800">
              <span>With HOTEL</span>
              <span className="font-mono-num">${space.rent[5]}</span>
            </div>
          </div>
        )}

        {/* Railroad Rent Schedule */}
        {space.type === 'railroad' && (
          <div className="space-y-1.5 text-[12px] font-medium py-1">
            <div className="flex justify-between">
              <span>Rent (1 Railroad)</span>
              <span className="font-mono-num font-bold">$25</span>
            </div>
            <div className="flex justify-between">
              <span>If 2 Railroads owned</span>
              <span className="font-mono-num font-bold">$50</span>
            </div>
            <div className="flex justify-between">
              <span>If 3 Railroads owned</span>
              <span className="font-mono-num font-bold">$100</span>
            </div>
            <div className="flex justify-between border-t border-stone-300 pt-1">
              <span>If 4 Railroads owned</span>
              <span className="font-mono-num font-bold">$200</span>
            </div>
          </div>
        )}

        {/* Utility Rent Rules */}
        {space.type === 'utility' && (
          <div className="space-y-2 text-[12px] leading-snug text-stone-800 py-1.5">
            <p>
              If one Utility is owned, rent is <strong>4 times</strong> amount shown on dice.
            </p>
            <p>
              If both Utilities are owned, rent is <strong>10 times</strong> amount shown on dice.
            </p>
          </div>
        )}

        {/* Price / Mortgage / House Cost Footer */}
        <div className="mt-3 pt-2 border-t-2 border-stone-800 space-y-1 text-[11px]">
          {space.price && (
            <div className="flex justify-between">
              <span className="text-stone-600">Purchase Price</span>
              <span className="font-mono-num font-bold">${space.price}</span>
            </div>
          )}
          {space.houseCost && (
            <div className="flex justify-between">
              <span className="text-stone-600">Houses / Hotel Cost</span>
              <span className="font-mono-num font-bold">${space.houseCost} each</span>
            </div>
          )}
          {space.mortgage && (
            <div className="flex justify-between">
              <span className="text-stone-600">Mortgage Value</span>
              <span className="font-mono-num font-bold">
                ${space.mortgage} (Lift: ${getUnmortgageCost(space.index)})
              </span>
            </div>
          )}
        </div>

        {/* Owner Strip */}
        <div className="mt-2.5 pt-2 border-t border-stone-300 flex items-center justify-between text-[11px]">
          <span className="text-stone-500">Current Owner</span>
          <span className="font-semibold text-stone-900">
            {ownerName ?? 'Unowned (Bank)'}
          </span>
        </div>
      </div>

      {/* Mortgaged Diagonal Stamp */}
      {isMortgaged && (
        <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-red-700 bg-red-50/90 px-4 py-1 -rotate-12 font-board text-xl font-bold tracking-[0.2em] text-red-700 uppercase shadow">
            Mortgaged
          </div>
        </div>
      )}
    </div>
  );
}
