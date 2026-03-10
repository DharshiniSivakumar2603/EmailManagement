import { ReactElement, createElement } from "react";
import { EmailInfo } from "./Sidebar";

export interface AttachmentInfo {
    id: string;
    originalItem?: any;
    name: string;
    size: number; // bytes
}

interface EmailDetailProps {
    email: EmailInfo;
    attachments: AttachmentInfo[];
    onReply: () => void;
    onForward: () => void;
    onDownloadAttachment?: (attachment: AttachmentInfo) => void;
    onDownloadAllAttachments?: () => void;
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

/** Extract display name from an email address. */
function getDisplayName(email: string): string {
    const trimmed = email.trim();
    if (trimmed.includes("@")) {
        const local = trimmed.split("@")[0];
        return local
            .split(/[\s._-]+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
    }
    return trimmed;
}

/** Format bytes to human-readable size */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${size} ${units[i]}`;
}

/** Get short file extension label from filename */
function getFileExtLabel(filename: string): string {
    const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
    return ext.length > 4 ? ext.substring(0, 4) : ext;
}

export function EmailDetail({ email, attachments, onReply, onForward, onDownloadAttachment, onDownloadAllAttachments }: EmailDetailProps): ReactElement {
    console.log("[EmailDetail] Rendering with attachments:", attachments.length, attachments.map(a => ({ name: a.name, size: a.size })));
    const initials = getInitials(email.sender);
    const displayName = getDisplayName(email.sender);
    const isEmailAddress = email.sender.includes("@");

    return (
        <div className="email-detail-container">
            <div className="detail-header">
                <h2>{email.subject}</h2>
            </div>

            <div className="detail-meta">
                <div className="participant-chip">
                    <span className="initials">{initials}</span>
                    <div className="info">
                        <div className="sender-line">
                            <strong>{displayName}</strong>
                            {isEmailAddress && <span className="sender-email">({email.sender})</span>}
                        </div>
                        {email.to && <span className="meta-field">To : {email.to}</span>}
                        {email.cc && <span className="meta-field">Cc : {email.cc}</span>}
                    </div>
                </div>
                <div className="detail-actions">
                    <button className="action-btn" onClick={onReply} title="Reply">
                        <span className="action-icon">↩</span> Reply
                    </button>
                    <button className="action-btn" onClick={onForward} title="Forward">
                        <span className="action-icon">↪</span> Forward
                    </button>
                </div>
            </div>

            <div className="detail-date">
                <span>{email.date.toLocaleString()}</span>
            </div>

            {attachments.length > 0 && (
                <div className="attachments-section">
                    <div className="attachment-header">
                        <span className="attachment-title">Attachment File ({attachments.length}) :</span>
                        {onDownloadAllAttachments && (
                            <button className="attachment-download-all" onClick={onDownloadAllAttachments}>
                                <span className="download-icon">⬇</span> Download All
                            </button>
                        )}
                    </div>
                    <div className="attachment-list">
                        {attachments.map(att => (
                            <div key={att.id} className="attachment-card">
                                <div className="attachment-file-icon">
                                    <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                                        <path d="M14 0H3C1.34 0 0 1.34 0 3v22c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V10l-10-10z" fill="#FFE0E6" />
                                        <path d="M14 0v7c0 1.66 1.34 3 3 3h7L14 0z" fill="#F8B4C0" />
                                        <text x="12" y="22" textAnchor="middle" fill="#b02a5c" fontSize="7" fontWeight="600">
                                            {getFileExtLabel(att.name)}
                                        </text>
                                    </svg>
                                </div>
                                <div className="attachment-file-info">
                                    <span className="attachment-filename">{att.name}</span>
                                    <span className="attachment-filesize">{formatFileSize(att.size)}</span>
                                </div>
                                {onDownloadAttachment && (
                                    <button
                                        className="attachment-download-btn"
                                        onClick={() => onDownloadAttachment(att)}
                                        title="Download"
                                    >
                                        ⬇
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="email-body">
                {email.body.trim().startsWith("<") ? (
                    <div dangerouslySetInnerHTML={{ __html: email.body }} />
                ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{email.body}</div>
                )}
            </div>
        </div>
    );
}
