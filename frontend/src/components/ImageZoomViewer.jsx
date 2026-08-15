import { useState, useRef, useCallback, useEffect } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_THRESHOLD = 60; // px, horizontal drag distance to count as a page swipe
const TAP_MAX_MOVEMENT = 10; // px, below this a pointer down/up counts as a tap not a drag
const DOUBLE_TAP_WINDOW = 300; // ms

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Fullscreen image viewer: pinch/wheel/double-tap to zoom, drag to pan while zoomed,
 * swipe or tap the left/right edges to change page while at 1x.
 *
 * Closing only happens via the explicit ✕ button — center taps at 1x are a no-op,
 * since a close-on-center-tap zone was found confusing (taps anywhere in the middle
 * column, including near the bottom of the screen, used to close the viewer).
 *
 * onPageChange(index) fires whenever the visible page changes (including the
 * initial mount), so callers can e.g. trigger an ad every N pages.
 * onPastEnd() / onPastStart() fire when the user swipes or taps past the last /
 * first page, so callers can advance to the next/previous chapter instead of
 * the viewer just no-op'ing at the edges.
 */
export default function ImageZoomViewer({
  urls,
  initialIndex = 0,
  onClose,
  onPageChange,
  onPastEnd,
  onPastStart,
  title,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map()); // pointerId -> {x, y}
  const pinchStart = useRef(null); // { dist, scale, mid }
  const dragStart = useRef(null); // { x, y, translateX, translateY, moved }
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetTransform();
    // New page is loading — hide the stale frame from the previous page until
    // the new image actually finishes decoding, so users never see a "stuck"
    // old page while the next one loads on a slow connection.
    setImgLoaded(false);
    onPageChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, resetTransform]);

  const clampTranslate = useCallback((tx, ty, s) => {
    const el = containerRef.current;
    if (!el) return { x: tx, y: ty };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, tx)),
      y: Math.min(maxY, Math.max(-maxY, ty)),
    };
  }, []);

  function goTo(newIndex) {
    if (newIndex < 0) {
      onPastStart?.();
      return;
    }
    if (newIndex >= urls.length) {
      onPastEnd?.();
      return;
    }
    setIndex(newIndex);
  }

  function handlePointerDown(e) {
    containerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      pinchStart.current = {
        dist: distance(p1, p2),
        scale,
        mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
      };
      dragStart.current = null;
    } else if (pointers.current.size === 1) {
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        translateX: translate.x,
        translateY: translate.y,
        moved: false,
      };
    }
  }

  function handlePointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [p1, p2] = [...pointers.current.values()];
      const newDist = distance(p1, p2);
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current.scale * (newDist / pinchStart.current.dist)));
      setScale(nextScale);
      setTranslate((t) => clampTranslate(t.x, t.y, nextScale));
      return;
    }

    if (pointers.current.size === 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > TAP_MAX_MOVEMENT || Math.abs(dy) > TAP_MAX_MOVEMENT) {
        dragStart.current.moved = true;
      }

      if (scale > 1) {
        // Pan around the zoomed image
        const next = clampTranslate(dragStart.current.translateX + dx, dragStart.current.translateY + dy, scale);
        setTranslate(next);
      } else {
        // At 1x: drag the image slightly to preview the swipe (visual feedback only)
        setTranslate({ x: dx * 0.4, y: 0 });
      }
    }
  }

  function handlePointerUp(e) {
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);

    if (pointers.current.size < 2) pinchStart.current = null;

    if (wasSingle && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;

      if (!dragStart.current.moved) {
        // It was a tap, not a drag — check for double-tap first, then left/right edge zones.
        // Center taps at 1x are intentionally a no-op: closing only happens via the ✕ button.
        const now = Date.now();
        const isDoubleTap =
          now - lastTap.current.time < DOUBLE_TAP_WINDOW &&
          Math.abs(e.clientX - lastTap.current.x) < 30 &&
          Math.abs(e.clientY - lastTap.current.y) < 30;
        lastTap.current = { time: now, x: e.clientX, y: e.clientY };

        if (isDoubleTap) {
          if (scale > 1) {
            resetTransform();
          } else {
            setScale(DOUBLE_TAP_SCALE);
          }
        } else if (scale === 1) {
          const rect = containerRef.current.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width;
          if (relX < 0.3) {
            goTo(index - 1);
          } else if (relX > 0.7) {
            goTo(index + 1);
          }
          // center tap: no-op
        }
      } else if (scale === 1) {
        // It was a drag at 1x — decide if it was a big enough swipe to change page
        if (dx > SWIPE_THRESHOLD) {
          goTo(index - 1);
        } else if (dx < -SWIPE_THRESHOLD) {
          goTo(index + 1);
        } else {
          setTranslate({ x: 0, y: 0 });
        }
      }
    }

    dragStart.current = null;
  }

  function handleWheel(e) {
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    setScale(nextScale);
    setTranslate((t) => clampTranslate(t.x, t.y, nextScale));
  }

  return (
    <div className="zoom-overlay">
      <div className="zoom-topbar">
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <span className="zoom-counter">
          {index + 1} / {urls.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="icon-btn" onClick={() => goTo(index - 1)} aria-label="Previous page">
            ‹
          </button>
          <button className="icon-btn" onClick={() => goTo(index + 1)} aria-label="Next page">
            ›
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              const s = Math.max(MIN_SCALE, scale - 0.5);
              setScale(s);
              setTranslate((t) => clampTranslate(t.x, t.y, s));
            }}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              const s = Math.min(MAX_SCALE, scale + 0.5);
              setScale(s);
              setTranslate((t) => clampTranslate(t.x, t.y, s));
            }}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="zoom-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {!imgLoaded && <div className="zoom-page-spinner" />}
        <img
          ref={imgRef}
          src={urls[index]}
          alt={`Page ${index + 1}`}
          className="zoom-image"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          style={{
            opacity: imgLoaded ? 1 : 0,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: dragStart.current ? "none" : "opacity 0.15s ease-out, transform 0.15s ease-out",
          }}
        />
      </div>
    </div>
  );
}