"use client";

import { useSelf } from "@liveblocks/react/suspense";
import * as Y from "yjs";
import React, { useRef, useEffect } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs, locales } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// ─── Custom AI Prompt Block ──────────────────────────────────────────
const AIPromptBlock = createReactBlockSpec(
  {
    type: "ai-prompt",
    propSchema: {
      text: { default: "" },
      isLoading: { default: "false" },
      streamedText: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { text, isLoading, streamedText } = props.block.props;
      const inputRef = useRef<HTMLInputElement>(null);

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && text.trim() !== "") {
          e.preventDefault();
          props.editor.updateBlock(props.block, { props: { isLoading: "true" } });

          fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text }),
          })
            .then(async (res) => {
              if (!res.body) throw new Error("No response body");

              const reader = res.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let accumulatedText = "";

              // Immediately remove the loading blur
              if (props.editor.getBlock(props.block.id)) {
                props.editor.updateBlock(props.block.id, { props: { isLoading: "false" } });
              }

              let scheduledUpdate = false;
              const flushUpdate = () => {
                if (props.editor.getBlock(props.block.id)) {
                  props.editor.updateBlock(props.block.id, { props: { streamedText: accumulatedText } });
                }
                scheduledUpdate = false;
              };

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulatedText += decoder.decode(value, { stream: true });

                if (!scheduledUpdate) {
                  scheduledUpdate = true;
                  requestAnimationFrame(flushUpdate);
                }
              }

              // Finished streaming! Convert to native BlockNote blocks.
              if (props.editor.getBlock(props.block.id)) {
                let cleanMarkdown = accumulatedText.replace(/\r/g, "");
                let parsedBlocks = await props.editor.tryParseMarkdownToBlocks(cleanMarkdown);

                // Deeply flatten blocks to prevent BlockNote's diagonal nesting bug
                const flattenBlocks = (blocks: any[]): any[] => {
                  let flat: any[] = [];
                  for (const b of blocks) {
                    const { children, ...rest } = b;

                    // Fix empty list items that pushed their content into a child paragraph
                    if ((rest.type === "numberedListItem" || rest.type === "bulletListItem") &&
                      (!rest.content || rest.content.length === 0 || rest.content === "") &&
                      children && children.length > 0 && children[0].type === "paragraph") {
                      rest.content = children[0].content;
                      flat.push(rest);
                      if (children.length > 1) {
                        flat = flat.concat(flattenBlocks(children.slice(1)));
                      }
                    } else {
                      flat.push(rest);
                      if (children && children.length > 0) {
                        flat = flat.concat(flattenBlocks(children));
                      }
                    }
                  }
                  return flat;
                };

                const flatBlocks = flattenBlocks(parsedBlocks);
                props.editor.insertBlocks(flatBlocks.length > 0 ? flatBlocks : [{ type: "paragraph", content: "..." }], props.block.id, "after");
                props.editor.removeBlocks([props.block.id]);
              }
            })
            .catch((err) => {
              if (props.editor.getBlock(props.block.id)) {
                props.editor.updateBlock(props.block.id, { props: { isLoading: "false" } });
              }
              console.error(err);
            });
        }
      };

      return (
        <div
          className={`flex flex-col w-full min-w-0 overflow-hidden my-1 transition-all duration-300 ${isLoading === "true" ? "animate-pulse blur-[3px] opacity-70 pointer-events-none" : ""
            }`}
          style={{ outline: 'none', boxShadow: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0', width: '100%', minWidth: 0 }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 600,
              color: '#60a5fa',
              background: 'rgba(30, 64, 175, 0.3)',
              paddingLeft: '3px',
              paddingRight: '8px',
              paddingTop: '1px',
              paddingBottom: '1px',
              borderRadius: '8px',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '15px',
            }}>
              <img
                src="/images/Light.jpg"
                alt="Light"
                style={{
                  width: '18px',
                  height: '18px',
                  minWidth: '18px',
                  minHeight: '18px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              Light
            </span>
            {!streamedText && (
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent outline-none border-none text-[15px] placeholder-gray-400 dark:text-white"
                placeholder="Tell Me!"
                value={text}
                onChange={(e) => props.editor.updateBlock(props.block, { props: { text: e.target.value } })}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && text === "") {
                    e.preventDefault();
                    props.editor.updateBlock(props.block.id, { type: "paragraph" as any, props: {} as any });
                    setTimeout(() => {
                      props.editor.setTextCursorPosition(props.block.id, "end");
                    }, 50);
                    return;
                  }
                  e.stopPropagation(); // Prevents BlockNote from stealing arrow keys
                  handleKeyDown(e);
                }}
                onPointerDown={(e) => e.stopPropagation()} // Prevents BlockNote from stealing mouse clicks
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isLoading === "true"}
              />
            )}
          </div>

          {streamedText && (
            <div className="text-[15px] pl-3 pb-2 pr-2 opacity-90 whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed border-l-2 border-blue-500/30 ml-2 mt-1 min-w-0 overflow-hidden w-full">
              {streamedText}
            </div>
          )}
        </div>
      );
    },
  }
);

// Register the custom block
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    "ai-prompt": AIPromptBlock,
  },
});
// ──────────────────────────────────────────────────────────────────────

type EditorProps = {
  doc: Y.Doc;
  provider: any;
  darkMode: boolean;
};

import stringToColor from "../lib/stringToColor";

function BlockNote({ doc, provider, darkMode }: EditorProps) {
  const userInfo = useSelf((me) => me.info);

  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...locales.en,
      placeholders: {
        ...locales.en.placeholders,
        default: "@Light or type '/' for commands",
      },
    },
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: userInfo?.name || "Anonymous",
        color: stringToColor(userInfo?.email || "anonymous"),
      },
    },
  });

  return (
    <div className="relative w-full pb-40">
      <BlockNoteView
        editor={editor}
        theme={darkMode ? "dark" : "light"}
        className="min-h-[150px]"
      >
        <SuggestionMenuController
          triggerCharacter={"@"}
          getItems={async (query) => {
            // Safely capture the exact block while the user is still actively typing
            const currentPos = editor.getTextCursorPosition();
            const targetBlockId = currentPos ? currentPos.block.id : undefined;

            const items = [
              {
                title: "Light",
                subtext: "Ask AI for HELP!",
                onItemClick: () => {
                  if (targetBlockId) {
                    const newBlockId = crypto.randomUUID();

                    const newBlockProps = {
                      id: newBlockId,
                      type: "ai-prompt" as any,
                      props: {
                        text: "",
                        isLoading: "false",
                        streamedText: ""
                      }
                    };

                    // Always insert after and remove the old block.
                    // On mobile, the @Light text may still be in the block when the tap fires,
                    // so updateBlock is unreliable — a clean insert+remove always works.
                    editor.insertBlocks([newBlockProps], targetBlockId, "after");
                    editor.removeBlocks([targetBlockId]);

                    // Use longer timeout on mobile so the DOM has time to render the new block
                    setTimeout(() => {
                      const blockEl = document.querySelector(`[data-id="${newBlockId}"]`);
                      if (blockEl) {
                        const input = blockEl.querySelector('input');
                        input?.focus();
                      }
                    }, 200);
                  }
                },
                aliases: ["ai", "bot", "ask", "generate", "light"],
                group: "AI Tools",
                icon: <img src="/images/Light.jpg" alt="Light" className="w-8 h-8 rounded-full object-cover shadow-md" style={{ minWidth: '32px', minHeight: '32px' }} />,
              },
            ];
            return items.filter((item) =>
              item.title.toLowerCase().startsWith(query.toLowerCase())
            );
          }}
        />
      </BlockNoteView>
    </div>
  );
}

// Editor now receives doc and provider from parent (Document.tsx)
function Editor({ doc, provider, darkMode }: EditorProps) {
  if (!doc || !provider) {
    return null;
  }

  return (
    <div className="w-full">
      <BlockNote
        doc={doc}
        provider={provider}
        darkMode={darkMode}
      />
    </div>
  );
}

export default Editor;
