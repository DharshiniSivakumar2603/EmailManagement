import { ReactElement, createElement, useState, useEffect, useRef, useCallback } from "react";
import { AttachmentInfo } from "./EmailDetail";
import { ToRecipientPopup } from "./ToRecipientPopup";
import { CcRecipientPopup, CcPopupListItem } from "./CcRecipientPopup";
import { PopupListItem } from "../EmailManager";

/** Format bytes to human-readable size */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${size} ${units[i]}`;
}

interface ComposeEditorProps {
    isReply: boolean;
    initialData?: {
        to?: string;
        cc?: string;
        subject?: string;
        body?: string;
    };
    /** Original email body to display in reply history */
    replyOriginalBody?: string;
    /** Original sender shown in reply history */
    replyOriginalSender?: string;
    onFieldChange: (field: "to" | "cc" | "subject" | "body", value: string) => void;
    onCancel: () => void;
    onSaveDraft: () => void;
    onSend: () => void;
    onAttachFile?: () => void;
    attachments?: AttachmentInfo[];
    onRemoveAttachment?: (attachment: AttachmentInfo) => void;
    // To Popup data
    partners?: PopupListItem[];
    partnerRecipients?: PopupListItem[];
    khdaRecipients?: PopupListItem[];
    selectedRecipients?: PopupListItem[];
    selectedPartnerIds?: Set<string>;
    selectedPartnerRecipientIds?: Set<string>;
    selectedKhdaIds?: Set<string>;
    onPartnerChange?: (item: PopupListItem) => void;
    onPartnerRecipientChange?: (item: PopupListItem) => void;
    onKhdaChange?: (item: PopupListItem) => void;
    onRemoveRecipient?: (item: PopupListItem) => void;
    onConfirmRecipients?: (externalEmails: string[]) => void;
    // Cc Popup data
    ccPartners?: PopupListItem[];
    ccPartnerRecipients?: CcPopupListItem[];
    ccSelectedPartnerIds?: Set<string>;
    ccSelectedPartnerRecipientIds?: Set<string>;
    ccSelectedRecipients?: PopupListItem[];
    onCcPartnerChange?: (item: PopupListItem) => void;
    onCcPartnerRecipientChange?: (item: PopupListItem) => void;
    onRemoveCcRecipient?: (item: PopupListItem) => void;
    onConfirmCcRecipients?: (externalEmails: string[]) => void;
    ccPartnershipEmailEnabled?: boolean;
    onCcPartnershipEmailToggle?: (enabled: boolean) => void;
}

/** Extract initials from a name or email address. */
function getInitials(nameOrEmail: string): string {
    const name = nameOrEmail.split("@")[0];
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function ComposeEditor({ isReply, initialData, replyOriginalBody, replyOriginalSender, onFieldChange, onCancel, onSaveDraft, onSend, onAttachFile, attachments, onRemoveAttachment, partners, partnerRecipients, khdaRecipients, selectedRecipients, selectedPartnerIds, selectedPartnerRecipientIds, selectedKhdaIds, onPartnerChange, onPartnerRecipientChange, onKhdaChange, onRemoveRecipient, onConfirmRecipients, ccPartners, ccPartnerRecipients, ccSelectedPartnerIds, ccSelectedPartnerRecipientIds, ccSelectedRecipients, onCcPartnerChange, onCcPartnerRecipientChange, onRemoveCcRecipient, onConfirmCcRecipients, ccPartnershipEmailEnabled, onCcPartnershipEmailToggle }: ComposeEditorProps): ReactElement {

    // Convert comma separated string to array for tokens
    const parseTokens = (str?: string) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];

    const [toTokens, setToTokens] = useState<string[]>(parseTokens(initialData?.to));
    const [ccTokens, setCcTokens] = useState<string[]>(parseTokens(initialData?.cc));
    const [subject, setSubject] = useState(initialData?.subject || "");
    const [toPopupOpen, setToPopupOpen] = useState(false);
    const [ccPopupOpen, setCcPopupOpen] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only update on reply toggle or deep reset
        if (isReply && initialData?.subject) {
            setSubject(initialData.subject);
        }
    }, [isReply, initialData?.subject]);

    // Initialize editor content
    useEffect(() => {
        if (editorRef.current && initialData?.body !== undefined) {
            // Only set innerHTML on mount or when switching modes
            if (editorRef.current.innerHTML !== initialData.body) {
                editorRef.current.innerHTML = initialData.body || "";
            }
        }
    }, []);

    const handleEditorInput = useCallback(() => {
        if (editorRef.current) {
            onFieldChange("body", editorRef.current.innerHTML);
        }
    }, [onFieldChange]);

    // Rich text formatting commands
    const execFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleEditorInput();
    };

    const handleRemoveToken = (field: "to" | "cc", index: number) => {
        if (field === "to") {
            const newTokens = toTokens.filter((_, i) => i !== index);
            setToTokens(newTokens);
            onFieldChange("to", newTokens.join(","));
        } else {
            const newTokens = ccTokens.filter((_, i) => i !== index);
            setCcTokens(newTokens);
            onFieldChange("cc", newTokens.join(","));
        }
    };

    return (
        <div className="compose-editor-container">
            {isReply ? (
                <div className="compose-header">
                    <button className="btn-icon back-btn" onClick={onCancel}>{"<"}</button>
                    <h2>{subject || "Reply"}</h2>
                    <span className="subtitle">{replyOriginalSender || ""}</span>
                </div>
            ) : (
                <div className="compose-header center">
                    <h2>Create New Email</h2>
                    <span className="subtitle">Create a new email to communicate with partners</span>
                </div>
            )}

            <div className="compose-form">
                <div className="form-group">
                    <label className="to-label-clickable" onClick={() => setToPopupOpen(true)}>To</label>
                    <div className="token-input" onClick={() => setToPopupOpen(true)}>
                        <div className="token-list">
                            {selectedRecipients && selectedRecipients.length > 0
                                ? selectedRecipients.map(item => (
                                    <span key={item.id} className="token">
                                        {item.caption}
                                        <button className="remove-token" onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveRecipient?.(item);
                                        }}>×</button>
                                    </span>
                                ))
                                : toTokens.map((rec, i) => (
                                    <span key={i} className="token">{rec} <button className="remove-token" onClick={(e) => { e.stopPropagation(); handleRemoveToken("to", i); }}>×</button></span>
                                ))
                            }
                        </div>
                        <span className="token-expand">&#x25BE;</span>
                    </div>
                    <ToRecipientPopup
                        isOpen={toPopupOpen}
                        onClose={() => setToPopupOpen(false)}
                        partners={partners || []}
                        partnerRecipients={partnerRecipients || []}
                        khdaRecipients={khdaRecipients || []}
                        selectedPartnerIds={selectedPartnerIds || new Set()}
                        selectedPartnerRecipientIds={selectedPartnerRecipientIds || new Set()}
                        selectedKhdaIds={selectedKhdaIds || new Set()}
                        onPartnerChange={onPartnerChange}
                        onPartnerRecipientChange={onPartnerRecipientChange}
                        onKhdaChange={onKhdaChange}
                        onConfirmRecipients={(externalEmails: string[]) => {
                            onConfirmRecipients?.(externalEmails);
                            setToPopupOpen(false);
                        }}
                    />
                </div>

                <div className="form-group">
                    <label className="cc-label-clickable" onClick={() => setCcPopupOpen(true)}>Cc</label>
                    <div className="token-input" onClick={() => setCcPopupOpen(true)}>
                        <div className="token-list">
                            {ccSelectedRecipients && ccSelectedRecipients.length > 0
                                ? ccSelectedRecipients.map(item => (
                                    <span key={item.id} className="token">
                                        {item.caption}
                                        <button className="remove-token" onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveCcRecipient?.(item);
                                        }}>×</button>
                                    </span>
                                ))
                                : ccTokens.map((rec, i) => (
                                    <span key={i} className="token">{rec} <button className="remove-token" onClick={(e) => { e.stopPropagation(); handleRemoveToken("cc", i); }}>×</button></span>
                                ))
                            }
                        </div>
                        <span className="token-expand">&#x25BE;</span>
                    </div>
                    <CcRecipientPopup
                        isOpen={ccPopupOpen}
                        onClose={() => setCcPopupOpen(false)}
                        partners={ccPartners || []}
                        partnerRecipients={ccPartnerRecipients || []}
                        selectedPartnerIds={ccSelectedPartnerIds || new Set()}
                        selectedPartnerRecipientIds={ccSelectedPartnerRecipientIds || new Set()}
                        onPartnerChange={onCcPartnerChange}
                        onPartnerRecipientChange={onCcPartnerRecipientChange}
                        partnershipEmailEnabled={ccPartnershipEmailEnabled}
                        onPartnershipEmailToggle={onCcPartnershipEmailToggle}
                        onConfirmRecipients={(externalEmails: string[]) => {
                            onConfirmCcRecipients?.(externalEmails);
                            setCcPopupOpen(false);
                        }}
                    />
                </div>

                {onAttachFile && (
                    <div className="form-group">
                        <label>Attachments</label>
                        <button className="btn-attach-file" onClick={onAttachFile}>
                            <span className="attach-icon">📎</span> Attach File
                        </button>
                        {attachments && attachments.length > 0 && (
                            <div className="compose-attachment-list">
                                {attachments.map(att => (
                                    <div key={att.id} className="compose-attachment-card">
                                        <div className="attachment-file-icon">
                                            <svg width="20" height="24" viewBox="0 0 24 28" fill="none">
                                                <path d="M14 0H3C1.34 0 0 1.34 0 3v22c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V10l-10-10z" fill="#FFE0E6" />
                                                <path d="M14 0v7c0 1.66 1.34 3 3 3h7L14 0z" fill="#F8B4C0" />
                                            </svg>
                                        </div>
                                        <div className="attachment-file-info">
                                            <span className="attachment-filename">{att.name}</span>
                                            <span className="attachment-filesize">{formatFileSize(att.size)}</span>
                                        </div>
                                        {onRemoveAttachment && (
                                            <button
                                                className="compose-attachment-remove"
                                                onClick={() => onRemoveAttachment(att)}
                                                title="Remove attachment"
                                            >×</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!isReply && (
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            className="subject-input"
                            value={subject}
                            onChange={e => {
                                setSubject(e.target.value);
                                onFieldChange("subject", e.target.value);
                            }}
                        />
                    </div>
                )}

                <div className="form-group editor-group">
                    <label>Body</label>
                    <div className="rich-text-editor">
                        <div className="editor-toolbar">
                            <button className="tool-btn" title="Bold" onMouseDown={e => { e.preventDefault(); execFormat("bold"); }}><strong>B</strong></button>
                            <button className="tool-btn" title="Italic" onMouseDown={e => { e.preventDefault(); execFormat("italic"); }}><em>I</em></button>
                            <button className="tool-btn" title="Underline" onMouseDown={e => { e.preventDefault(); execFormat("underline"); }}><span style={{ textDecoration: 'underline' }}>U</span></button>
                            <button className="tool-btn" title="Strikethrough" onMouseDown={e => { e.preventDefault(); execFormat("strikeThrough"); }}><span style={{ textDecoration: 'line-through' }}>S</span></button>
                            <span className="separator"></span>
                            <button className="tool-btn" title="Align left" onMouseDown={e => { e.preventDefault(); execFormat("justifyLeft"); }}>&#9776;</button>
                            <button className="tool-btn" title="Align center" onMouseDown={e => { e.preventDefault(); execFormat("justifyCenter"); }}>&#9776;</button>
                            <button className="tool-btn" title="Align right" onMouseDown={e => { e.preventDefault(); execFormat("justifyRight"); }}>&#9776;</button>
                            <button className="tool-btn" title="Justify" onMouseDown={e => { e.preventDefault(); execFormat("justifyFull"); }}>&#9776;</button>
                            <span className="separator"></span>
                            <button className="tool-btn" title="Ordered list" onMouseDown={e => { e.preventDefault(); execFormat("insertOrderedList"); }}>1.</button>
                            <button className="tool-btn" title="Unordered list" onMouseDown={e => { e.preventDefault(); execFormat("insertUnorderedList"); }}>•</button>
                            <button className="tool-btn" title="Insert link" onMouseDown={e => {
                                e.preventDefault();
                                const url = prompt("Enter URL:");
                                if (url) execFormat("createLink", url);
                            }}>&#128279;</button>
                            <div className="toolbar-spacer"></div>
                            <button className="tool-btn" title="Undo" onMouseDown={e => { e.preventDefault(); execFormat("undo"); }}>&#8617;</button>
                            <button className="tool-btn" title="Redo" onMouseDown={e => { e.preventDefault(); execFormat("redo"); }}>&#8618;</button>
                        </div>
                        <div
                            ref={editorRef}
                            className="editor-content"
                            contentEditable
                            onInput={handleEditorInput}
                            suppressContentEditableWarning={true}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="compose-actions">
                <button className="btn-text" onClick={onCancel}>Cancel</button>
                <div className="primary-actions">
                    <button className="btn-outline-primary" onClick={onSaveDraft}>Save As Draft</button>
                    <button className="btn-primary-split" onClick={onSend}>
                        Send <span className="send-divider"></span><span className="send-chevron">&#x25BE;</span>
                    </button>
                </div>
            </div>

            {isReply && replyOriginalBody && (
                <div className="reply-history">
                    <hr className="divider" />
                    <div className="participant-chip compact">
                        <span className="initials">{replyOriginalSender ? getInitials(replyOriginalSender) : "??"}</span>
                        <div className="info">
                            <strong>{replyOriginalSender || "Original Sender"}</strong>
                        </div>
                    </div>
                    <div className="history-body">
                        {replyOriginalBody.trim().startsWith("<") ? (
                            <div dangerouslySetInnerHTML={{ __html: replyOriginalBody }} />
                        ) : (
                            <p style={{ whiteSpace: "pre-wrap" }}>{replyOriginalBody}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
