import { ReactElement, createElement, useState } from "react";
import classNames from "classnames";

export type FolderType = "Inbox" | "Drafts" | "Sent";

export interface EmailInfo {
    id: string;
    originalItem?: any;
    subject: string;
    sender: string;
    date: Date;
    snippet: string;
    body: string;
    isRead: boolean;
    groupCategory: string; // 'Today', 'Yesterday', 'Last Week'
    to: string;
    cc: string;
    folder: string; // 'Inbox', 'Drafts', 'Sent'
}

interface SidebarProps {
    emails: EmailInfo[];
    selectedId?: string;
    onSelect: (email: EmailInfo) => void;
    onCreateNewClick: () => void;
    onRefreshClick?: () => void;
}

export function Sidebar({ emails, selectedId, onSelect, onCreateNewClick, onRefreshClick }: SidebarProps): ReactElement {
    const [activeFolder, setActiveFolder] = useState<FolderType>("Inbox");
    const [searchTerm, setSearchTerm] = useState("");

    // Filter out scratch pad EmailMessage (used for composing) from all lists
    const realEmails = emails.filter(e => e.folder !== "Draft_Scratch");

    // Dynamic counts from real data
    const inboxEmails = realEmails.filter(e => e.folder === "Inbox" || !e.folder);
    const draftEmails = realEmails.filter(e => e.folder === "Drafts");
    const sentEmails = realEmails.filter(e => e.folder === "Sent");

    // Filter emails by active folder and sort by date descending (newest first)
    const folderEmails = (activeFolder === "Inbox"
        ? inboxEmails
        : activeFolder === "Drafts"
            ? draftEmails
            : sentEmails
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply search filter
    const filteredEmails = searchTerm.trim()
        ? folderEmails.filter(e => {
            const term = searchTerm.toLowerCase();
            return (
                e.subject.toLowerCase().includes(term) ||
                e.sender.toLowerCase().includes(term) ||
                e.snippet.toLowerCase().includes(term)
            );
        })
        : folderEmails;

    // Group filtered emails by date category
    const todayEmails = filteredEmails.filter(e => e.groupCategory === "Today");
    const yesterdayEmails = filteredEmails.filter(e => e.groupCategory === "Yesterday");
    const lastWeekEmails = filteredEmails.filter(e => e.groupCategory === "Last Week");
    const olderEmails = filteredEmails.filter(e =>
        e.groupCategory !== "Today" &&
        e.groupCategory !== "Yesterday" &&
        e.groupCategory !== "Last Week"
    );

    const renderGroup = (title: string, groupEmails: EmailInfo[]) => {
        if (groupEmails.length === 0) return null;
        return (
            <div className="group">
                <h3 className="group-title">{title}</h3>
                {groupEmails.map(email => (
                    <EmailItem key={email.id} email={email} selected={email.id === selectedId} onSelect={onSelect} />
                ))}
            </div>
        );
    };

    return (
        <div className="email-sidebar-container">
            <div className="sidebar-header">
                <h2>Showing {filteredEmails.length} Emails</h2>
                <div className="header-actions">
                    {onRefreshClick && (
                        <button className="btn-secondary btn-refresh" onClick={onRefreshClick} title="Refresh emails">↻</button>
                    )}
                    <button className="btn-primary" onClick={onCreateNewClick}>Create New Email</button>
                </div>
            </div>

            <div className="sidebar-search">
                <input
                    type="text"
                    placeholder="Search"
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="sidebar-tabs">
                <div
                    className={classNames("tab", { active: activeFolder === "Inbox" })}
                    onClick={() => setActiveFolder("Inbox")}
                >
                    <span className="tab-name">Inbox</span>
                    <span className={classNames("badge", { red: activeFolder === "Inbox", gray: activeFolder !== "Inbox" })}>
                        {inboxEmails.length}
                    </span>
                </div>
                <div
                    className={classNames("tab", { active: activeFolder === "Drafts" })}
                    onClick={() => setActiveFolder("Drafts")}
                >
                    <span className="tab-name">Drafts</span>
                    <span className={classNames("badge", { red: activeFolder === "Drafts", gray: activeFolder !== "Drafts" })}>
                        {String(draftEmails.length).padStart(2, "0")}
                    </span>
                </div>
                <div
                    className={classNames("tab", { active: activeFolder === "Sent" })}
                    onClick={() => setActiveFolder("Sent")}
                >
                    <span className="tab-name">Sent Items</span>
                    <span className={classNames("badge", { red: activeFolder === "Sent", gray: activeFolder !== "Sent" })}>
                        {sentEmails.length}
                    </span>
                </div>
            </div>

            <div className="email-list">
                {filteredEmails.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#687c97' }}>
                        No emails in {activeFolder}
                    </div>
                )}
                {renderGroup("Today", todayEmails)}
                {renderGroup("Yesterday", yesterdayEmails)}
                {renderGroup("Last Week", lastWeekEmails)}
                {renderGroup("Older", olderEmails)}
            </div>
        </div>
    );
}

function EmailItem({ email, selected, onSelect }: { email: EmailInfo; selected: boolean; onSelect: (e: EmailInfo) => void }): ReactElement {
    return (
        <div className={classNames("email-item", { selected, unread: !email.isRead })} onClick={() => onSelect(email)}>
            <div className="item-header">
                <h4 className="subject">{email.subject}</h4>
                {!email.isRead && <span className="unread-dot"></span>}
            </div>
            <div className="item-subheader">
                <span className="sender">{email.sender}</span>
                <span className="date">{email.date.toLocaleDateString()}</span>
            </div>
            <p className="snippet">{email.snippet}</p>
        </div>
    );
}
