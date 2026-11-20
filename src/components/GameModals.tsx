import { useState } from 'react';
import {
  BOARD_SPACES,
  COLOR_GROUP_HEX,
  COLOR_GROUP_LABEL,
} from '../game/boardData';
import {
  canBuildHouse,
  canExecuteTrade,
  canMortgage,
  canSellHouse,
  canUnmortgage,
  getActivePlayer,
  getPlayerById,
  getPlayerNetWorth,
  getPlayerProperties,
  getUnmortgageCost,
  ownsFullColorGroup,
} from '../game/engine';
import type { GameState, TradeOffer } from '../game/types';
import { DeedCard } from './DeedCard';
import { SilverTokenIcon } from './SilverTokens';

/* ==========================================================================
   1. BUY OR AUCTION MODAL (Unowned Property Landing)
   ========================================================================== */
export function BuyPropertyModal({
  state,
  onBuy,
  onAuction,
}: {
  state: GameState;
  onBuy: () => void;
  onAuction: () => void;
}) {
  const player = getActivePlayer(state);
  const space = BOARD_SPACES[player.position];
  const price = space.price ?? 0;
  const canAfford = player.cash >= price;

  return (
    <div
      role="dialog"
      aria-label={`Purchase ${space.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        className="animate-card-pop flex flex-col md:flex-row items-center gap-6 rounded-lg p-6 max-w-2xl w-full"
        style={{
          backgroundColor: '#1B130F',
          border: '2px solid #C49E54',
          boxShadow: '0 24px 64px rgba(0,0,0,0.78)',
        }}
      >
        <div className="shrink-0">
          <DeedCard spaceIndex={space.index} ownerName={null} />
        </div>

        <div className="flex-1 flex flex-col justify-between text-left space-y-4">
          <div>
            <div className="text-xs tracking-[0.18em] uppercase text-amber-300/80 font-semibold">
              Unowned Property
            </div>
            <h2 className="font-display text-2xl font-bold text-amber-50 mt-1">
              {space.name}
            </h2>
            <p className="mt-2 text-sm text-amber-100/75 leading-relaxed">
              {player.name} may purchase this Title Deed directly from the Bank for{' '}
              <strong className="font-mono-num text-amber-200">${price}</strong>, or send it to a
              table-wide Auction where all players can bid.
            </p>
          </div>

          <div className="rounded bg-stone-950/70 border border-amber-500/25 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-amber-100/70">Your Cash Balance</span>
            <span
              className={`font-mono-num text-lg font-bold ${
                canAfford ? 'text-emerald-300' : 'text-rose-400'
              }`}
            >
              ${player.cash.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={onBuy}
              disabled={!canAfford}
              className="flex-1 px-5 py-3 rounded font-semibold text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/50"
            >
              Buy for ${price}
            </button>
            <button
              type="button"
              onClick={onAuction}
              className="flex-1 px-5 py-3 rounded font-semibold text-sm transition-colors cursor-pointer bg-amber-800/80 hover:bg-amber-700 text-amber-50 border border-amber-400/50"
            >
              Send to Auction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. LIVE AUCTION MODAL
   ========================================================================== */
export function AuctionModal({
  state,
  onBid,
  onPass,
}: {
  state: GameState;
  onBid: (playerId: string, amount: number) => void;
  onPass: (playerId: string) => void;
}) {
  if (!state.auction) return null;
  const { auction } = state;
  const space = BOARD_SPACES[auction.spaceIndex];
  const currentBidderId = auction.activeBidderIds[auction.currentTurnBidderIndex];
  const currentBidder = getPlayerById(state, currentBidderId);
  const highestBidder = auction.highestBidderId
    ? getPlayerById(state, auction.highestBidderId)
    : null;
  const minNextBid = auction.currentBid === 0 ? 10 : auction.currentBid + 10;

  return (
    <div
      role="dialog"
      aria-label={`Auction for ${space.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        className="animate-card-pop flex flex-col md:flex-row items-center gap-6 rounded-lg p-6 max-w-2xl w-full"
        style={{
          backgroundColor: '#1B130F',
          border: '2px solid #D97706',
          boxShadow: '0 24px 64px rgba(0,0,0,0.82)',
        }}
      >
        <div className="shrink-0">
          <DeedCard spaceIndex={space.index} compact />
        </div>

        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-amber-400 font-semibold">
              Live Bank Auction
            </div>
            <h2 className="font-display text-2xl font-bold text-amber-50 mt-0.5">
              {space.name}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded bg-stone-950/75 border border-amber-500/30 p-3">
              <div className="text-[11px] text-amber-100/65">Current High Bid</div>
              <div className="font-mono-num text-2xl font-bold text-amber-300 mt-0.5">
                ${auction.currentBid}
              </div>
              <div className="text-xs text-amber-100/75 mt-0.5">
                {highestBidder ? `Held by ${highestBidder.name}` : 'Opening bid: $10'}
              </div>
            </div>
            <div className="rounded bg-stone-950/75 border border-amber-500/30 p-3">
              <div className="text-[11px] text-amber-100/65">Active Bidder</div>
              <div className="flex items-center gap-2 mt-1">
                {currentBidder && <SilverTokenIcon token={currentBidder.token} size={26} />}
                <span className="font-semibold text-amber-50 truncate">
                  {currentBidder?.name}
                </span>
              </div>
              <div className="font-mono-num text-xs text-emerald-300 mt-1">
                Cash: ${currentBidder?.cash.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Active Bidders Strip */}
          <div className="text-xs text-amber-100/70">
            Remaining bidders:{' '}
            {auction.activeBidderIds
              .map((id) => getPlayerById(state, id)?.name)
              .filter(Boolean)
              .join(' · ')}
          </div>

          {currentBidder && !currentBidder.isAI ? (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-2">
                {[0, 20, 50].map((extra) => {
                  const amount = minNextBid + extra;
                  const affordable = currentBidder.cash >= amount;
                  return (
                    <button
                      key={extra}
                      type="button"
                      disabled={!affordable}
                      onClick={() => onBid(currentBidder.id, amount)}
                      className="px-3 py-2.5 rounded font-mono-num text-sm font-bold cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/50 disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      Bid ${amount}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onPass(currentBidder.id)}
                className="w-full px-4 py-2.5 rounded text-sm font-semibold cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-stone-600"
              >
                Pass / Drop Out
              </button>
            </div>
          ) : (
            <div className="rounded bg-amber-950/50 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
              {currentBidder?.name} is considering a bid...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. CHANCE & COMMUNITY CHEST CARD REVEAL MODAL
   ========================================================================== */
export function CardRevealModal({
  state,
  onContinue,
}: {
  state: GameState;
  onContinue: () => void;
}) {
  if (!state.drawnCard) return null;
  const { card, playerId } = state.drawnCard;
  const player = getPlayerById(state, playerId);
  const isChance = card.deck === 'chance';

  return (
    <div
      role="dialog"
      aria-label={`${isChance ? 'Chance' : 'Community Chest'} card`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        className="animate-card-pop w-full max-w-md rounded-lg p-6 text-stone-950 shadow-[0_28px_64px_rgba(0,0,0,0.8)]"
        style={{
          backgroundColor: isChance ? '#FDBA74' : '#BAE6FD',
          border: `4px solid ${isChance ? '#9A3412' : '#0369A1'}`,
        }}
      >
        <div
          className="border-2 border-dashed p-5 rounded flex flex-col items-center text-center"
          style={{ borderColor: isChance ? '#7C2D12' : '#0C4A6E' }}
        >
          <div className="font-board text-xs font-bold tracking-[0.26em] uppercase opacity-80">
            {isChance ? 'Chance Card' : 'Community Chest'}
          </div>
          <div
            className="mt-2 font-display text-2xl font-extrabold leading-tight"
            style={{ color: isChance ? '#7C2D12' : '#0C4A6E' }}
          >
            {card.title}
          </div>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-stone-900">
            {card.text}
          </p>
          <div className="mt-4 text-xs font-semibold text-stone-800/80">
            Drawn by {player?.name}
          </div>

          {!player?.isAI && (
            <button
              type="button"
              onClick={onContinue}
              className="mt-5 w-full px-5 py-3 rounded font-semibold text-sm cursor-pointer transition-colors text-white shadow"
              style={{
                backgroundColor: isChance ? '#9A3412' : '#0369A1',
              }}
            >
              Accept &amp; Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. PROPERTY MANAGER MODAL (Build / Sell Houses & Hotels, Mortgage / Unmortgage)
   ========================================================================== */
export function PropertyManagerModal({
  state,
  playerId,
  onBuild,
  onSell,
  onMortgage,
  onUnmortgage,
  onClose,
}: {
  state: GameState;
  playerId: string;
  onBuild: (spaceIndex: number) => void;
  onSell: (spaceIndex: number) => void;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onClose: () => void;
}) {
  const player = getPlayerById(state, playerId);
  if (!player) return null;
  const owned = getPlayerProperties(state, playerId);

  return (
    <div
      role="dialog"
      aria-label="Manage Properties"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
    >
      <div
        className="w-full max-w-3xl max-h-[84vh] flex flex-col rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#1A120E',
          border: '2px solid #C49E54',
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-100">
              {player.name}&apos;s Portfolio
            </h2>
            <div className="text-xs text-amber-100/70 mt-0.5">
              Cash: <span className="font-mono-num text-emerald-300 font-bold">${player.cash}</span>{' '}
              · Bank Supply:{' '}
              <span className="font-mono-num text-amber-200">
                {state.bankHouses} Houses / {state.bankHotels} Hotels
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-semibold cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-amber-500/40"
          >
            Done
          </button>
        </div>

        {/* Property List */}
        <div className="overflow-y-auto p-5 space-y-2.5">
          {owned.length === 0 ? (
            <div className="py-12 text-center text-sm text-amber-100/60">
              You do not own any Title Deeds yet. Land on unowned spaces or win auctions to build
              your empire.
            </div>
          ) : (
            owned.map((idx) => {
              const space = BOARD_SPACES[idx];
              const prop = state.properties[idx];
              const colorHex = space.colorGroup ? COLOR_GROUP_HEX[space.colorGroup] : '#475569';
              const hasSet = space.colorGroup
                ? ownsFullColorGroup(state, playerId, space.colorGroup)
                : false;
              const buildCheck = canBuildHouse(state, playerId, idx);
              const sellCheck = canSellHouse(state, playerId, idx);
              const mortCheck = canMortgage(state, playerId, idx);
              const unmortCheck = canUnmortgage(state, playerId, idx);

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded px-4 py-3 bg-stone-950/70 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-4 h-10 rounded-sm shrink-0 border border-stone-900"
                      style={{ backgroundColor: colorHex }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-amber-50 truncate">
                          {space.name}
                        </span>
                        {hasSet && space.type === 'property' && (
                          <span className="text-[11px] font-semibold text-amber-300">
                            · Full Set
                          </span>
                        )}
                        {prop.mortgaged && (
                          <span className="text-[11px] font-bold text-rose-400">· Mortgaged</span>
                        )}
                      </div>
                      <div className="text-xs text-amber-100/65 mt-0.5">
                        {space.colorGroup ? COLOR_GROUP_LABEL[space.colorGroup] : ''}
                        {space.type === 'property' && (
                          <>
                            {' '}
                            ·{' '}
                            {prop.houses === 5
                              ? '1 Hotel'
                              : `${prop.houses} ${prop.houses === 1 ? 'House' : 'Houses'}`}
                            {' '}
                            · Build: ${space.houseCost}
                          </>
                        )}
                        {' '}
                        · Mortgage: ${space.mortgage}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {space.type === 'property' && (
                      <>
                        <button
                          type="button"
                          disabled={!buildCheck.allowed}
                          title={buildCheck.reason ?? `Build for $${space.houseCost}`}
                          onClick={() => onBuild(idx)}
                          className="px-3 py-1.5 rounded text-xs font-semibold cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {prop.houses === 4 ? '+ Hotel' : '+ House'} (${space.houseCost})
                        </button>
                        <button
                          type="button"
                          disabled={!sellCheck.allowed}
                          title={sellCheck.reason ?? 'Sell building for 50%'}
                          onClick={() => onSell(idx)}
                          className="px-3 py-1.5 rounded text-xs font-semibold cursor-pointer bg-amber-800 hover:bg-amber-700 text-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Sell (+${Math.floor((space.houseCost ?? 0) / 2)})
                        </button>
                      </>
                    )}

                    {!prop.mortgaged ? (
                      <button
                        type="button"
                        disabled={!mortCheck.allowed}
                        title={mortCheck.reason ?? `Mortgage for $${space.mortgage}`}
                        onClick={() => onMortgage(idx)}
                        className="px-3 py-1.5 rounded text-xs font-semibold cursor-pointer bg-stone-700 hover:bg-stone-600 text-amber-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Mortgage (+${space.mortgage})
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!unmortCheck.allowed}
                        title={unmortCheck.reason ?? `Unmortgage for $${getUnmortgageCost(idx)}`}
                        onClick={() => onUnmortgage(idx)}
                        className="px-3 py-1.5 rounded text-xs font-semibold cursor-pointer bg-sky-700 hover:bg-sky-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Unmortgage (-${getUnmortgageCost(idx)})
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. PLAYER-TO-PLAYER TRADE BUILDER MODAL
   ========================================================================== */
export function TradeModal({
  state,
  fromPlayerId,
  onSubmitTrade,
  onClose,
}: {
  state: GameState;
  fromPlayerId: string;
  onSubmitTrade: (offer: TradeOffer) => { accepted: boolean; message: string };
  onClose: () => void;
}) {
  const fromPlayer = getPlayerById(state, fromPlayerId)!;
  const partners = state.players.filter((p) => !p.bankrupt && p.id !== fromPlayerId);
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [offerCash, setOfferCash] = useState(0);
  const [requestCash, setRequestCash] = useState(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);
  const [offerJail, setOfferJail] = useState(0);
  const [requestJail, setRequestJail] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const partner = getPlayerById(state, partnerId);
  const myOwned = getPlayerProperties(state, fromPlayerId);
  const partnerOwned = partner ? getPlayerProperties(state, partner.id) : [];

  const toggleItem = (list: number[], idx: number, setter: (v: number[]) => void) => {
    setter(list.includes(idx) ? list.filter((i) => i !== idx) : [...list, idx]);
  };

  const offer: TradeOffer = {
    fromPlayerId,
    toPlayerId: partnerId,
    offerCash,
    requestCash,
    offerProperties: offerProps,
    requestProperties: requestProps,
    offerJailCards: offerJail,
    requestJailCards: requestJail,
  };

  const validation = canExecuteTrade(state, offer);

  const handlePropose = () => {
    const res = onSubmitTrade(offer);
    setFeedback(res.message);
    if (res.accepted) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Trade Builder"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
    >
      <div
        className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#1A120E',
          border: '2px solid #C49E54',
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-100">Propose Table Trade</h2>
            <div className="text-xs text-amber-100/65">
              Exchange cash, unimproved properties, and Get Out of Jail Free cards.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-semibold cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-amber-500/40"
          >
            Cancel
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Partner Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="trade-partner-select" className="text-sm font-semibold text-amber-100">
              Trade With:
            </label>
            <select
              id="trade-partner-select"
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value);
                setRequestProps([]);
                setRequestCash(0);
                setRequestJail(0);
                setFeedback(null);
              }}
              className="rounded bg-stone-900 border border-amber-500/40 px-3 py-2 text-sm text-amber-50"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.cash}){p.isAI ? ' · CPU' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Two Columns: You Offer / You Request */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: From Player */}
            <div className="rounded bg-stone-950/75 border border-amber-500/25 p-4 space-y-3">
              <div className="font-display text-sm font-bold text-amber-200">
                {fromPlayer.name} Offers
              </div>
              <div>
                <label className="text-xs text-amber-100/70 block mb-1">
                  Cash (max ${fromPlayer.cash})
                </label>
                <input
                  type="number"
                  min={0}
                  max={fromPlayer.cash}
                  step={10}
                  value={offerCash}
                  onChange={(e) => setOfferCash(Math.max(0, Math.min(fromPlayer.cash, Number(e.target.value) || 0)))}
                  className="w-full rounded bg-stone-900 border border-amber-500/30 px-3 py-1.5 font-mono-num text-sm text-amber-50"
                />
              </div>
              {fromPlayer.getOutOfJailCards.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-amber-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerJail > 0}
                    onChange={(e) => setOfferJail(e.target.checked ? 1 : 0)}
                  />
                  Include Get Out of Jail Free Card
                </label>
              )}
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {myOwned.length === 0 ? (
                  <div className="text-xs text-amber-100/45">No properties owned</div>
                ) : (
                  myOwned.map((idx) => {
                    const space = BOARD_SPACES[idx];
                    const checked = offerProps.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleItem(offerProps, idx, setOfferProps)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer border ${
                          checked
                            ? 'bg-emerald-900/60 border-emerald-400 text-emerald-100'
                            : 'bg-stone-900/70 border-stone-700 text-amber-100/80'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor: space.colorGroup
                                ? COLOR_GROUP_HEX[space.colorGroup]
                                : '#64748B',
                            }}
                          />
                          {space.shortName}
                        </span>
                        <span className="font-mono-num">${space.price}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Partner */}
            <div className="rounded bg-stone-950/75 border border-amber-500/25 p-4 space-y-3">
              <div className="font-display text-sm font-bold text-amber-200">
                {partner?.name ?? 'Partner'} Gives
              </div>
              <div>
                <label className="text-xs text-amber-100/70 block mb-1">
                  Cash (max ${partner?.cash ?? 0})
                </label>
                <input
                  type="number"
                  min={0}
                  max={partner?.cash ?? 0}
                  step={10}
                  value={requestCash}
                  onChange={(e) =>
                    setRequestCash(
                      Math.max(0, Math.min(partner?.cash ?? 0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-full rounded bg-stone-900 border border-amber-500/30 px-3 py-1.5 font-mono-num text-sm text-amber-50"
                />
              </div>
              {partner && partner.getOutOfJailCards.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-amber-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestJail > 0}
                    onChange={(e) => setRequestJail(e.target.checked ? 1 : 0)}
                  />
                  Request Get Out of Jail Free Card
                </label>
              )}
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {partnerOwned.length === 0 ? (
                  <div className="text-xs text-amber-100/45">No properties owned</div>
                ) : (
                  partnerOwned.map((idx) => {
                    const space = BOARD_SPACES[idx];
                    const checked = requestProps.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleItem(requestProps, idx, setRequestProps)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer border ${
                          checked
                            ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                            : 'bg-stone-900/70 border-stone-700 text-amber-100/80'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor: space.colorGroup
                                ? COLOR_GROUP_HEX[space.colorGroup]
                                : '#64748B',
                            }}
                          />
                          {space.shortName}
                        </span>
                        <span className="font-mono-num">${space.price}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div className="rounded bg-rose-950/70 border border-rose-500/40 px-4 py-2.5 text-sm text-rose-200">
              {feedback}
            </div>
          )}

          {!validation.valid && validation.reason && (
            <div className="text-xs text-amber-300/80">{validation.reason}</div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              disabled={!validation.valid}
              onClick={handlePropose}
              className="px-6 py-2.5 rounded font-semibold text-sm cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/50 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {partner?.isAI ? 'Propose Deal to CPU' : 'Confirm Trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   6. DEED INSPECTOR POPOVER MODAL
   ========================================================================== */
export function DeedInspectorModal({
  state,
  spaceIndex,
  onClose,
}: {
  state: GameState;
  spaceIndex: number;
  onClose: () => void;
}) {
  const prop = state.properties[spaceIndex];
  const owner = prop?.ownerId ? getPlayerById(state, prop.ownerId) : null;

  return (
    <div
      role="dialog"
      aria-label={`Title Deed for ${BOARD_SPACES[spaceIndex]?.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="animate-card-pop flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <DeedCard
          spaceIndex={spaceIndex}
          propertyState={prop}
          ownerName={owner?.name ?? null}
        />
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 rounded font-semibold text-sm cursor-pointer bg-[#1E140F] hover:bg-stone-800 text-amber-100 border border-amber-500/50 shadow-lg"
        >
          Close Deed
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   7. PAUSE MODAL
   ========================================================================== */
export function PauseModal({
  state,
  onResume,
  onRestart,
  onReturnTitle,
}: {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}) {
  const active = getActivePlayer(state);
  const ownedCount = Object.values(state.properties).filter((p) => p.ownerId !== null).length;

  return (
    <div
      role="dialog"
      aria-label="Game Paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        className="w-full max-w-md rounded-lg p-6 text-center space-y-5"
        style={{
          backgroundColor: '#1B130F',
          border: '2px solid #C49E54',
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
        }}
      >
        <div>
          <div className="text-xs tracking-[0.22em] uppercase text-amber-300/80">Game Paused</div>
          <h2 className="font-display text-3xl font-bold text-amber-50 mt-1">Tabletop Ledger</h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded bg-stone-950/75 border border-amber-500/25 p-3">
            <div className="text-[11px] text-amber-100/60">Turn</div>
            <div className="font-mono-num text-xl font-bold text-amber-200">{state.turnNumber}</div>
          </div>
          <div className="rounded bg-stone-950/75 border border-amber-500/25 p-3">
            <div className="text-[11px] text-amber-100/60">Deeds Sold</div>
            <div className="font-mono-num text-xl font-bold text-amber-200">{ownedCount}/28</div>
          </div>
          <div className="rounded bg-stone-950/75 border border-amber-500/25 p-3">
            <div className="text-[11px] text-amber-100/60">Active</div>
            <div className="text-sm font-bold text-amber-100 truncate mt-1">{active?.name}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 rounded font-semibold text-sm cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/50"
          >
            Resume Game
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded font-semibold text-sm cursor-pointer bg-amber-900/70 hover:bg-amber-800 text-amber-100 border border-amber-500/40"
          >
            Restart Match
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2.5 rounded font-semibold text-sm cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100/85 border border-stone-600"
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   8. VICTORY / GAME OVER MODAL
   ========================================================================== */
export function VictoryModal({
  state,
  onPlayAgain,
  onReturnTitle,
}: {
  state: GameState;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}) {
  const winner = state.winnerId ? getPlayerById(state, state.winnerId) : state.players[0];
  if (!winner) return null;
  const netWorth = getPlayerNetWorth(state, winner.id);
  const deedCount = getPlayerProperties(state, winner.id).length;

  return (
    <div
      role="dialog"
      aria-label="Victory"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div
        className="w-full max-w-lg rounded-lg p-7 text-center space-y-5"
        style={{
          backgroundColor: '#1B130F',
          border: '2px solid #EAB308',
          boxShadow: '0 28px 80px rgba(0,0,0,0.9)',
        }}
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-950/90 border-2 border-amber-400 flex items-center justify-center shadow-lg">
            <SilverTokenIcon token={winner.token} size={58} />
          </div>
          <div className="mt-3 text-xs tracking-[0.25em] uppercase text-amber-300 font-semibold">
            Grand Monopoly Achieved
          </div>
          <h2 className="font-display text-3xl font-extrabold text-amber-50 mt-1">
            {winner.name} Wins!
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded bg-stone-950/80 border border-amber-500/30 p-3">
            <div className="text-[11px] text-amber-100/60">Final Net Worth</div>
            <div className="font-mono-num text-xl font-bold text-emerald-300">
              ${netWorth.toLocaleString()}
            </div>
          </div>
          <div className="rounded bg-stone-950/80 border border-amber-500/30 p-3">
            <div className="text-[11px] text-amber-100/60">Title Deeds</div>
            <div className="font-mono-num text-xl font-bold text-amber-200">{deedCount}</div>
          </div>
          <div className="rounded bg-stone-950/80 border border-amber-500/30 p-3">
            <div className="text-[11px] text-amber-100/60">Turns Played</div>
            <div className="font-mono-num text-xl font-bold text-amber-200">{state.turnNumber}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded font-semibold text-sm cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/50"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="flex-1 py-3 rounded font-semibold text-sm cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-amber-500/40"
          >
            Setup New Table
          </button>
        </div>
      </div>
    </div>
  );
}
