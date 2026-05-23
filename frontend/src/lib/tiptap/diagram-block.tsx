"use client";

/**
 * diagram-block.tsx
 * Tiptap Node Extension — Diagram Block powered by diagrams.net (draw.io).
 *
 * Embeds draw.io via a sandboxed iframe using the official embed protocol:
 *   https://www.drawio.com/doc/faq/embed-mode
 *
 * Communication flow:
 *   1. iframe fires `{ event: 'init' }`       → host responds with `{ action: 'load', xml }`
 *   2. iframe fires `{ event: 'autosave', xml }` → host persists XML to Tiptap node attrs
 *   3. iframe fires `{ event: 'save', xml }`   → host persists and optionally acks
 *   4. iframe fires `{ event: 'exit' }`        → (no-op, embedded – cannot close)
 *
 * Data is stored as an XML string inside `node.attrs.data`.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  NodeViewWrapper,
  NodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";

// ─── draw.io embed URL configuration ──────────────────────────────────────────

const DRAWIO_BASE = "https://embed.diagrams.net";

/**
 * Build the embed URL with query parameters matching the target UI:
 * - White / Kennedy theme (professional docked panels)
 * - Grid enabled
 * - Libraries panel visible on the left
 * - JSON messaging protocol
 * - Autosave enabled
 */
function buildEmbedUrl(): string {
  const params = new URLSearchParams({
    embed: "1",
    proto: "json",
    spin: "1",
    libraries: "1",
    // Kennedy = the classic white docked-panel layout from the reference image
    ui: "kennedy",
    // Start with a white, gridded background
    grid: "1",
    // Don't show the "Save" confirmation dialog – stream autosaves
    modified: "unsavedChanges",
    // Keep chrome (menus / panels) visible
    chrome: "1",
    noSaveBtn: "0",
    noExitBtn: "1",
  });
  return `${DRAWIO_BASE}/?${params.toString()}`;
}

// ─── Types for draw.io message protocol ───────────────────────────────────────

interface DrawioInitEvent {
  event: "init";
}

interface DrawioSaveEvent {
  event: "save" | "autosave";
  xml: string;
}

interface DrawioExitEvent {
  event: "exit";
}

interface DrawioConfigureEvent {
  event: "configure";
}

type DrawioInboundEvent =
  | DrawioInitEvent
  | DrawioSaveEvent
  | DrawioExitEvent
  | DrawioConfigureEvent;

interface DrawioLoadAction {
  action: "load";
  xml: string;
  autosave?: 1;
}

interface DrawioConfigureAction {
  action: "configure";
  config: Record<string, unknown>;
}

// ─── Default empty diagram XML ────────────────────────────────────────────────

const EMPTY_DIAGRAM_XML =
  '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';

// ─── Node View ────────────────────────────────────────────────────────────────

export const DiagramBlockView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, selected, editor } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  /**
   * Resolve the initial XML to load into draw.io.
   * Handles:  null | "" | raw-XML-string | legacy JSON (Excalidraw format)
   */
  const getInitialXml = useCallback((): string => {
    const raw = node.attrs.data;
    if (!raw) return EMPTY_DIAGRAM_XML;
    if (typeof raw === "string") {
      // If it already starts with `<`, treat as XML
      if (raw.trimStart().startsWith("<")) return raw;
      // Otherwise attempt JSON parse – could be legacy Excalidraw blob
      try {
        const parsed = JSON.parse(raw);
        // Legacy Excalidraw objects won't have mxGraphModel — return empty
        if (parsed && typeof parsed === "object" && !parsed.mxGraphModel) {
          return EMPTY_DIAGRAM_XML;
        }
      } catch {
        // Not JSON → treat the string as XML regardless
        return raw;
      }
    }
    // If data is a non-string object (legacy Excalidraw JSON), reset
    return EMPTY_DIAGRAM_XML;
  }, [node.attrs.data]);

  /**
   * Post a message to the draw.io iframe using the JSON protocol.
   */
  const postToDrawio = useCallback(
    (msg: DrawioLoadAction | DrawioConfigureAction) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify(msg), "*");
    },
    []
  );

  /**
   * Persist diagram XML back into the Tiptap node attribute.
   */
  const persistXml = useCallback(
    (xml: string) => {
      if (editor && !editor.isDestroyed) {
        updateAttributes({ data: xml });
      }
    },
    [editor, updateAttributes]
  );

  // ── Message handler ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Only accept messages from the draw.io origin
      if (!e.origin.includes("diagrams.net") && !e.origin.includes("draw.io")) {
        return;
      }

      let msg: DrawioInboundEvent;
      try {
        msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return; // not a JSON message we care about
      }

      switch (msg.event) {
        case "configure": {
          // Respond with our desired configuration
          const configAction: DrawioConfigureAction = {
            action: "configure",
            config: {
              defaultFonts: [
                "Inter",
                "Roboto",
                "Helvetica",
                "Arial",
                "monospace",
              ],
            },
          };
          postToDrawio(configAction);
          break;
        }

        case "init": {
          // iframe is ready — load our XML
          setReady(true);
          const loadAction: DrawioLoadAction = {
            action: "load",
            xml: getInitialXml(),
            autosave: 1,
          };
          postToDrawio(loadAction);
          break;
        }

        case "save":
        case "autosave": {
          const saveMsg = msg as DrawioSaveEvent;
          if (saveMsg.xml) {
            persistXml(saveMsg.xml);
          }
          break;
        }

        case "exit":
          // Embedded – nothing to close
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [getInitialXml, persistXml, postToDrawio]);

  // ── Propagation barriers (prevent Tiptap from stealing events) ──────────

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      className={`not-prose relative w-full border rounded-xl overflow-hidden shadow-sm my-6 transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
          : "border-gray-200"
      }`}
      style={{ background: "#ffffff" }}
    >
      {/* Loading overlay — shown until draw.io fires 'init' */}
      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400 font-medium">
              Loading diagram editor…
            </span>
          </div>
        </div>
      )}

      {/* draw.io iframe */}
      <div
        className="w-full relative z-10"
        style={{ height: "600px", minHeight: "600px" }}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchEnd={stopPropagation}
        onPointerDown={stopPropagation}
        onPointerUp={stopPropagation}
        onDragStart={stopPropagation}
        onDragOver={stopPropagation}
        onDragEnter={stopPropagation}
        onDrop={stopPropagation}
        onKeyDown={stopPropagation}
      >
        <iframe
          ref={iframeRef}
          src={buildEmbedUrl()}
          title="Diagram Editor"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          allow="clipboard-read; clipboard-write"
          style={{ display: "block" }}
        />
      </div>
    </NodeViewWrapper>
  );
};

// ─── Tiptap Node Definition ───────────────────────────────────────────────────

export const DiagramBlock = Node.create({
  name: "diagram",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-diagram");
          if (!raw) return null;
          // draw.io data is XML — store as-is, no JSON.parse needed
          return raw;
        },
        renderHTML: (attributes) => {
          if (!attributes.data) return {};
          // If data is a string (XML), store directly
          const serialized =
            typeof attributes.data === "string"
              ? attributes.data
              : JSON.stringify(attributes.data);
          return { "data-diagram": serialized };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="diagram"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "diagram" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramBlockView, {
      stopEvent: () => true,
    });
  },
});
