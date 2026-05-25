import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Tag, 
  Heading1, 
  Type, 
  List, 
  CheckSquare, 
  FileText, 
  BookOpen, 
  DollarSign, 
  PlusCircle, 
  X,
  AlertCircle
} from "lucide-react";
import { NotionNote, NoteBlock, CustomTag } from "../types";

interface NotionNotesProps {
  notes: NotionNote[];
  setNotes: React.Dispatch<React.SetStateAction<NotionNote[]>>;
  tags: CustomTag[];
  currentSelectedNoteId: string | null;
  setCurrentSelectedNoteId: (id: string | null) => void;
}

export default function NotionNotes({
  notes,
  setNotes,
  tags,
  currentSelectedNoteId,
  setCurrentSelectedNoteId,
}: NotionNotesProps) {
  // Local interface states
  const [editingTitle, setEditingTitle] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");
  const [lastCreatedBlockId, setLastCreatedBlockId] = useState<string | null>(null);

  // Get active note
  const activeNote = notes.find((n) => n.id === currentSelectedNoteId) || null;

  // Split block content and insert a new block after it
  const splitAndInsertBlock = (blockId: string, currentType: NoteBlock["type"], currentContent: string, selectionStart: number) => {
    if (!currentSelectedNoteId) return;

    const leftText = currentContent.substring(0, selectionStart);
    const rightText = currentContent.substring(selectionStart);

    // determine next block's type
    const nextType: NoteBlock["type"] = (currentType === "bullet" || currentType === "todo" || currentType === "financial-note") ? currentType : "text";

    let defaultVal = rightText;
    if (nextType === "financial-note" && !rightText) {
      defaultVal = "Allow $0.00 for target expenditure";
    }

    const newBlock: NoteBlock = {
      id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type: nextType,
      content: defaultVal,
      completed: nextType === "todo" ? false : undefined,
    };

    setNotes((prev) => 
      prev.map((n) => {
        if (n.id === currentSelectedNoteId) {
          const blocks = n.blocks.map((b) => {
            if (b.id === blockId) {
              return { ...b, content: leftText };
            }
            return b;
          });
          const currentIndex = blocks.findIndex((b) => b.id === blockId);
          if (currentIndex !== -1) {
            blocks.splice(currentIndex + 1, 0, newBlock);
          } else {
            blocks.push(newBlock);
          }
          return { ...n, blocks, updatedAt: new Date().toISOString().split("T")[0] };
        }
        return n;
      })
    );

    setLastCreatedBlockId(newBlock.id);
  };

  const handleKeyDownOnBlock = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, 
    blockId: string, 
    currentType: NoteBlock["type"],
    currentContent: string
  ) => {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        e.preventDefault();
        const selectionStart = e.currentTarget.selectionStart ?? currentContent.length;
        splitAndInsertBlock(blockId, currentType, currentContent, selectionStart);
      }
    }
  };

  // Create a new note page
  const handleCreateNote = () => {
    const newNote: NotionNote = {
      id: "note_" + Date.now(),
      title: "Untitled Financial Note",
      blocks: [
        { id: "b_1_" + Date.now(), type: "heading", content: "New Strategy Outline" },
        { id: "b_2_" + Date.now(), type: "text", content: "Draft your financial plans, itemized receipts, or investment reviews here. Add interactive todo checkboxes or dollar budgets below." }
      ],
      tags: [],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setNotes((prev) => [newNote, ...prev]);
    setCurrentSelectedNoteId(newNote.id);
  };

  // Delete note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (currentSelectedNoteId === id) {
      setCurrentSelectedNoteId(null);
    }
  };

  // Title edit handler
  const handleUpdateTitle = (newTitle: string) => {
    if (!currentSelectedNoteId) return;
    setNotes((prev) => 
      prev.map((n) => 
        n.id === currentSelectedNoteId 
          ? { ...n, title: newTitle || "Untitled Note", updatedAt: new Date().toISOString().split("T")[0] } 
          : n
      )
    );
  };

  // Block handlers
  const handleAddBlock = (type: NoteBlock["type"]) => {
    if (!currentSelectedNoteId || !activeNote) return;

    let defaultVal = "New note section...";
    if (type === "todo") defaultVal = "Follow-up audit checkbox";
    if (type === "heading") defaultVal = "Subheading";
    if (type === "financial-note") defaultVal = "Allow $0.00 for target expenditure";

    const newBlock: NoteBlock = {
      id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type,
      content: defaultVal,
      completed: type === "todo" ? false : undefined,
    };

    setNotes((prev) => 
      prev.map((n) => 
        n.id === currentSelectedNoteId 
          ? { ...n, blocks: [...n.blocks, newBlock], updatedAt: new Date().toISOString().split("T")[0] } 
          : n
      )
    );
  };

  const handleUpdateBlockContent = (blockId: string, text: string) => {
    if (!currentSelectedNoteId) return;
    setNotes((prev) => 
      prev.map((n) => {
        if (n.id === currentSelectedNoteId) {
          const updatedBlocks = n.blocks.map((b) => 
            b.id === blockId ? { ...b, content: text } : b
          );
          return { ...n, blocks: updatedBlocks, updatedAt: new Date().toISOString().split("T")[0] };
        }
        return n;
      })
    );
  };

  const handleToggleBlockTodo = (blockId: string) => {
    if (!currentSelectedNoteId) return;
    setNotes((prev) => 
      prev.map((n) => {
        if (n.id === currentSelectedNoteId) {
          const updatedBlocks = n.blocks.map((b) => 
            b.id === blockId ? { ...b, completed: !b.completed } : b
          );
          return { ...n, blocks: updatedBlocks, updatedAt: new Date().toISOString().split("T")[0] };
        }
        return n;
      })
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!currentSelectedNoteId) return;
    setNotes((prev) => 
      prev.map((n) => {
        if (n.id === currentSelectedNoteId) {
          return {
            ...n,
            blocks: n.blocks.filter((b) => b.id !== blockId),
            updatedAt: new Date().toISOString().split("T")[0],
          };
        }
        return n;
      })
    );
  };

  // Tag Association
  const handleToggleTagOnNote = (tagName: string) => {
    if (!currentSelectedNoteId || !activeNote) return;
    const isTagPresent = activeNote.tags.includes(tagName);
    
    setNotes((prev) => 
      prev.map((n) => {
        if (n.id === currentSelectedNoteId) {
          const nextTags = isTagPresent 
            ? n.tags.filter((t) => t !== tagName)
            : [...n.tags, tagName];
          return { ...n, tags: nextTags, updatedAt: new Date().toISOString().split("T")[0] };
        }
        return n;
      })
    );
  };

  // Filters logic for sidebar notes list
  const filteredNotesList = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(searchNotes.toLowerCase()) ||
                        n.blocks.some((b) => b.content.toLowerCase().includes(searchNotes.toLowerCase()));
    const matchTag = selectedTagFilter === "all" || n.tags.includes(selectedTagFilter);
    return matchSearch && matchTag;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[580px] overflow-hidden" id="notion-workspace">
      
      {/* SIDEBAR LIST */}
      <div className="border-r border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-5 flex flex-col justify-between" id="notion-sidebar">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-md font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Financial Notes
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Digital private journal</p>
            </div>
            <button
              id="btn-create-notion-note"
              onClick={handleCreateNote}
              className="p-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all cursor-pointer"
              title="Create new workspace page"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <input 
              type="text" 
              value={searchNotes}
              onChange={(e) => setSearchNotes(e.target.value)}
              placeholder="Search documents & contents..."
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none modern-select"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Filter by Tag: All</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">#{t.name}</option>
              ))}
            </select>
          </div>

          {/* NOTES LIST */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1" id="notes-sidebar-scroll">
            {filteredNotesList.map((n) => {
              const isActive = n.id === currentSelectedNoteId;
              const previewText = n.blocks.length > 0 
                ? n.blocks[0].content.substring(0, 48) + "..." 
                : "No blocks in this page";

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    setCurrentSelectedNoteId(n.id);
                  }}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 border-indigo-100 dark:border-indigo-900/60 shadow-xs scale-[1.01]" 
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-semibold text-xs truncate max-w-[140px] block">
                      {n.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteNote(n.id, e)}
                      className="text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate leading-snug">
                    {previewText}
                  </p>

                  <div className="flex gap-1 flex-wrap mt-2">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{n.updatedAt}</span>
                    {n.tags.map((t) => (
                      <span key={t} className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 rounded-full font-mono font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredNotesList.length === 0 && (
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 text-center py-6">
                No draft notes match this category.
              </p>
            )}
          </div>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-900/30 mt-4 leading-normal text-[10px] text-indigo-800 dark:text-indigo-300">
          <span className="font-bold flex items-center gap-1 text-[11px] mb-1">
            <AlertCircle className="w-3.5 h-3.5" /> Block Architecture
          </span>
          Click any text block inside a chosen document to rewrite its configuration instantly. Try mixing tags & inline checkout reminders!
        </div>
      </div>

      {/* NOTION BLOCK EDITOR */}
      <div className="md:col-span-2 p-6 flex flex-col justify-between" id="notion-editor-panel">
        
        {activeNote ? (
          <div className="space-y-6" id="active-note-workspace">
            
            {/* Header / Meta / Tags config */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                className="w-full text-xl font-bold text-slate-900 dark:text-slate-100 border-none outline-none focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 pb-2 bg-transparent"
                placeholder="Page Title Header"
              />

              {/* Tag Association Toolbar inside Note */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Mapped Tags:
                </span>
                
                {tags.map((t) => {
                  const isChecked = activeNote.tags.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTagOnNote(t.name)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        isChecked 
                          ? `${t.color} border-indigo-200 dark:border-indigo-900/45 shadow-xs scale-102` 
                          : "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BLOCK STACK LIST */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1" id="notion-blocks-stack">
              {activeNote.blocks.map((block) => (
                <div 
                  key={block.id} 
                  className="group flex items-start gap-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/60 p-1.5 rounded-xl transition-all"
                >
                  
                  {/* Icon Block Type representation */}
                  <div className="mt-1 flex-shrink-0 text-slate-300 dark:text-slate-600">
                    {block.type === "heading" && <Heading1 className="w-3.5 h-3.5" />}
                    {block.type === "text" && <Type className="w-3.5 h-3.5" />}
                    {block.type === "bullet" && <List className="w-3.5 h-3.5" />}
                    {block.type === "todo" && <CheckSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
                    {block.type === "financial-note" && <DollarSign className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>

                  {/* Editable Input Blocks based on Type */}
                  <div className="flex-1">
                    {block.type === "heading" ? (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDownOnBlock(e, block.id, block.type, block.content)}
                        autoFocus={block.id === lastCreatedBlockId}
                        className="w-full font-bold text-slate-800 dark:text-slate-200 text-sm bg-transparent border-b border-transparent focus:border-indigo-200 outline-none pb-0.5"
                      />
                    ) : block.type === "todo" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!block.completed}
                          onChange={() => handleToggleBlockTodo(block.id)}
                          className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDownOnBlock(e, block.id, block.type, block.content)}
                          autoFocus={block.id === lastCreatedBlockId}
                          className={`w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent focus:border-indigo-200 outline-none ${
                            block.completed ? "line-through text-slate-400 dark:text-slate-550" : ""
                          }`}
                        />
                      </div>
                    ) : block.type === "financial-note" ? (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 border-l-2 border-emerald-400 dark:border-emerald-600 rounded-r-lg flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">BUDGET SNAP:</span>
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDownOnBlock(e, block.id, block.type, block.content)}
                          autoFocus={block.id === lastCreatedBlockId}
                          className="w-full text-xs text-emerald-900 dark:text-emerald-300 font-mono font-semibold bg-transparent border-none outline-none focus:ring-0 p-0"
                        />
                      </div>
                    ) : block.type === "bullet" ? (
                      <div className="flex gap-1.5 items-start">
                        <span className="text-slate-400 dark:text-slate-500 mt-0.5">•</span>
                        <textarea
                          rows={1}
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDownOnBlock(e, block.id, block.type, block.content)}
                          autoFocus={block.id === lastCreatedBlockId}
                          className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent py-0 border-b border-transparent focus:border-indigo-200 outline-none resize-none font-sans"
                        />
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        value={block.content}
                        onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDownOnBlock(e, block.id, block.type, block.content)}
                        autoFocus={block.id === lastCreatedBlockId}
                        className="w-full text-xs text-slate-600 dark:text-slate-400 bg-transparent py-0 border-b border-transparent focus:border-indigo-200 outline-none resize-none leading-relaxed font-sans"
                      />
                    )}
                  </div>

                  {/* Delete Block */}
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-opacity p-1 cursor-pointer"
                    title="Remove component block"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                </div>
              ))}
            </div>

            {/* BLOCK CREATION PALETTE ACCORDION */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 block" id="block-creation-bar">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2 tracking-wider">
                Insert Notebook Component Block:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <button
                  onClick={() => handleAddBlock("heading")}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 text-center shadow-2xs border border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <Heading1 className="w-3.5 h-3.5 text-indigo-500" /> Header Section
                </button>
                <button
                  onClick={() => handleAddBlock("text")}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 text-center shadow-2xs border border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5 text-sky-500" /> Plain Text
                </button>
                <button
                  onClick={() => handleAddBlock("bullet")}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 text-center shadow-2xs border border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <List className="w-3.5 h-3.5 text-amber-500" /> Bullet List
                </button>
                <button
                  onClick={() => handleAddBlock("todo")}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 text-center shadow-2xs border border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-rose-500" /> Check List
                </button>
                <button
                  onClick={() => handleAddBlock("financial-note")}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 text-center shadow-2xs border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" /> Finance Snippet
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 text-slate-400 dark:text-slate-500" id="blank-notion-slate">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Document Selected</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              Please choose a financial journal page from the sidebar workspace, or draft an entirely new planner note matching your spending goals.
            </p>
            <button
              id="btn-create-notion-centered"
              onClick={handleCreateNote}
              className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700 text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Start New Document
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
