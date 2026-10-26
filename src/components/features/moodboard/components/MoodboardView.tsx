"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import type { MoodboardZone } from "@/types";
import type { MoodboardPageView } from "../hooks/useMoodboardPage";
import { useMoodboardActions } from "../hooks/useMoodboardActions";
import { zoneForKind } from "../model/zones";
import { BoardSwitcher } from "./BoardSwitcher";
import { BoardToolbar } from "./BoardToolbar";
import { Canvas } from "./Canvas";
import { MoodboardFootnote } from "./MoodboardFootnote";
import { MoodboardIntro } from "./MoodboardIntro";
import { TemplatePicker } from "./TemplatePicker";
import { Zone } from "./Zone";

/**
 * Exploration, kept separate from the brand.
 *
 * Everything added here becomes an asset with EXPLORATION status, which keeps
 * it out of the published guideline, exports and share links — a moodboard is
 * mostly other people's photographs, and none of it is the studio's to hand
 * over.
 *
 * The board is **zones**, not a wall of pictures: typed bands with an
 * instruction card each, so the board teaches its own use, and because a zone
 * is typed it can turn its cards into a proposal. A palette zone knows its
 * cards are colours, so it can offer them to Visual Identity as a Draft.
 */
export function MoodboardView({ ws, isAr, board, view, compact, immersive, picking, onPicking, onActive, fullscreen, onFullscreen }: MoodboardPageView) {
  const {
    patchMoodboardZone,
    updateMoodboardItem,
    moveMoodboardItem,
    voteMoodboardItem,
    placeMoodboardItem,
    placeMoodboardZone,
    connectMoodboardItems,
    removeMoodboardEdge,
    setMoodboardView,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const actions = useMoodboardActions({ ws, board, isAr, onActive, onPicking, fileRef });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  /** The cards the canvas has selected, for nudging, deleting and connecting. */
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const assets = new Map(ws.assets.map((a) => [a.id, a]));
  const zones = board ? [...board.zones].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0)) : [];
  /** The shortlist: only what somebody spoke up for. */
  const visibleZones: MoodboardZone[] = shortlistOnly ? zones.map((z) => ({ ...z, items: z.items.filter((i) => i.votes.length > 0) })) : zones;

  return (
    // The canvas is its own scroll surface — it pans. Letting the page scroll
    // underneath it as well would mean two things moving under one gesture.
    <div
      className={`flex min-h-0 flex-1 flex-col ${
        immersive ? "gap-0 overflow-hidden p-0" : compact ? "gap-3 overflow-hidden px-7 py-4" : "gap-5 overflow-auto px-7 py-6.5"
      }`}
    >
      <MoodboardIntro isAr={isAr} compact={compact} hidden={immersive} />
      <BoardSwitcher
        boards={ws.moodboards}
        activeId={board?.id}
        isAr={isAr}
        picking={picking}
        hidden={immersive}
        onActive={onActive}
        onTogglePicking={() => onPicking(!picking)}
      />

      {/* Outside the board on purpose: uploading with no board yet creates
          one, so the input has to exist before the first board does. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) actions.upload(e.target.files);
          e.target.value = "";
        }}
      />

      {(picking || !board) && <TemplatePicker isAr={isAr} onPick={actions.makeBoard} onUpload={() => fileRef.current?.click()} hasBoard={!!board} />}

      {board && !picking && (
        <>
          <BoardToolbar
            board={board}
            view={view}
            isAr={isAr}
            hidden={immersive}
            shortlistOnly={shortlistOnly}
            onView={(v) => setMoodboardView(ws.id, board.id, v)}
            onShortlistOnly={setShortlistOnly}
            onRename={actions.renameBoard}
            onAddZone={actions.addZone}
            onDelete={actions.deleteBoard}
          />

          {view === "canvas" ? (
            <Canvas
              board={board}
              assets={assets}
              isAr={isAr}
              me={actions.me}
              selected={selectedCards}
              onSelect={setSelectedCards}
              onPlaceItem={(itemId, at, toZoneId) => placeMoodboardItem(ws.id, board.id, itemId, at, toZoneId)}
              onPlaceZone={(zoneId, at) => placeMoodboardZone(ws.id, board.id, zoneId, at)}
              onConnect={(from, to) => connectMoodboardItems(ws.id, board.id, from, to)}
              onRemoveEdge={(edgeId) => removeMoodboardEdge(ws.id, board.id, edgeId)}
              onLabelEdge={actions.labelEdge}
              onVote={(itemId) => voteMoodboardItem(ws.id, board.id, itemId)}
              onRemoveItem={actions.removeItems}
              onEditItem={(itemId, patch) => updateMoodboardItem(ws.id, board.id, itemId, patch)}
              onAddCard={(zone, kind) => actions.addCard(zone.id, kind)}
              onAddAt={(kind, zoneId, at) =>
                // No frame under the pointer means the open board. The card
                // still has to belong somewhere, and the tray is the zone whose
                // whole job is "not filed yet".
                actions.addCard(zoneId ?? zoneForKind(board.zones, "unsorted")?.id ?? board.zones[0]?.id ?? "", kind, at)
              }
              onTidy={actions.tidy}
              fullscreen={fullscreen}
              onFullscreen={onFullscreen}
              onRenameZone={actions.renameZone}
              onRemoveZone={actions.removeZone}
              onSampleColor={actions.sampleOne}
              onDropFiles={(files, zoneId) => actions.upload(files, zoneId)}
              zoneAction={actions.actionFor}
            />
          ) : (
            visibleZones.map((zone) => (
              <Zone
                key={zone.id}
                zone={zone}
                templateKey={board.templateKey}
                assets={assets}
                isAr={isAr}
                me={actions.me}
                action={actions.actionFor(zone)}
                draggingId={draggingId}
                onDragItem={setDraggingId}
                onDropInZone={(zoneId, beforeId) => {
                  if (!draggingId) return;
                  moveMoodboardItem(ws.id, board.id, draggingId, zoneId, beforeId);
                  setDraggingId(null);
                }}
                onVote={(itemId) => voteMoodboardItem(ws.id, board.id, itemId)}
                // The list view deletes one card at a time — it has no
                // selection — so it hands the same undo path a list of one.
                onRemoveItem={(itemId) => actions.removeItems([itemId])}
                onEditItem={(itemId, patch) => updateMoodboardItem(ws.id, board.id, itemId, patch)}
                onAdd={(z, kind) => actions.addCard(z.id, kind)}
                onDismissInstructions={() => patchMoodboardZone(ws.id, board.id, zone.id, { instructionsDismissed: true })}
                onRename={() => actions.renameZone(zone)}
                onRemoveZone={() => actions.removeZone(zone)}
                onSampleColor={actions.sampleOne}
              />
            ))
          )}

          <MoodboardFootnote slug={ws.slug} isAr={isAr} hidden={immersive} />
        </>
      )}
    </div>
  );
}
