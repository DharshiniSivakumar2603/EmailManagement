import { ReactElement, createElement, useState, useEffect, useMemo } from "react";
import { PopupListItem } from "../EmailManager";

// ─── Email Validation ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface CcPopupListItem extends PopupListItem {
    subtitle?: string;     // e.g. "Primary Contact"
}

interface CcRecipientPopupProps {
    isOpen: boolean;
    onClose: () => void;
    // Mendix-driven data
    partners: PopupListItem[];
    partnerRecipients: CcPopupListItem[];   // filtered by Mendix based on selected partners
    // Mendix-driven selection state (ALL from helper associations)
    selectedPartnerIds: Set<string>;
    selectedPartnerRecipientIds: Set<string>;  // now driven by Mendix
    // Handlers — all toggle helper associations in Mendix
    onPartnerChange?: (item: PopupListItem) => void;
    onPartnerRecipientChange?: (item: PopupListItem) => void;   // toggles helper ↔ PartnerRecipient
    onConfirmRecipients: (externalEmails: string[]) => void;    // only external emails
    // Partnership email toggle
    partnershipEmailEnabled?: boolean;
    onPartnershipEmailToggle?: (enabled: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CcRecipientPopup({
    isOpen,
    onClose,
    partners,
    partnerRecipients,
    selectedPartnerIds,
    selectedPartnerRecipientIds,
    onPartnerChange,
    onPartnerRecipientChange,
    onConfirmRecipients,
    partnershipEmailEnabled,
    onPartnershipEmailToggle
}: CcRecipientPopupProps): ReactElement | null {

    // Only external emails remain as local React state
    const [externalEmails, setExternalEmails] = useState<string[]>([]);
    const [externalInput, setExternalInput] = useState("");
    const [externalError, setExternalError] = useState("");

    // Dropdown open states
    const [partnersDropdownOpen, setPartnersDropdownOpen] = useState(false);
    const [partnerRecipientsDropdownOpen, setPartnerRecipientsDropdownOpen] = useState(false);

    // Search for partner recipients
    const [recipientSearch, setRecipientSearch] = useState("");

    // Reset local state when popup opens
    useEffect(() => {
        if (isOpen) {
            setExternalEmails([]);
            setExternalInput("");
            setExternalError("");
            setPartnersDropdownOpen(false);
            setPartnerRecipientsDropdownOpen(false);
            setRecipientSearch("");
        }
    }, [isOpen]);

    // Filter partner recipients by search term
    const filteredRecipients = useMemo(() => {
        if (!recipientSearch.trim()) return partnerRecipients;
        const term = recipientSearch.toLowerCase();
        return partnerRecipients.filter(pr =>
            pr.caption.toLowerCase().includes(term) ||
            (pr.subtitle && pr.subtitle.toLowerCase().includes(term))
        );
    }, [partnerRecipients, recipientSearch]);

    if (!isOpen) return null;

    // ─── Handlers ────────────────────────────────────────────────────────────

    const togglePartner = (item: PopupListItem) => {
        console.log("[CcPopup] togglePartner clicked:", item.id, item.caption);
        onPartnerChange?.(item);
    };

    const togglePartnerRecipient = (item: PopupListItem) => {
        console.log("[CcPopup] togglePartnerRecipient clicked:", item.id, item.caption);
        onPartnerRecipientChange?.(item);
    };

    const removePartnerChip = (item: PopupListItem) => {
        onPartnerChange?.(item);
    };

    const removePartnerRecipientChip = (item: PopupListItem) => {
        onPartnerRecipientChange?.(item);
    };

    const removeExternalChip = (email: string) => {
        setExternalEmails(prev => prev.filter(e => e !== email));
    };

    const handleExternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addExternalEmail();
        }
    };

    const addExternalEmail = () => {
        const trimmed = externalInput.trim().replace(/,$/g, "");
        if (!trimmed) return;
        if (!isValidEmail(trimmed)) {
            setExternalError("Please enter a valid email address");
            return;
        }
        if (externalEmails.includes(trimmed)) {
            setExternalError("Email already added");
            return;
        }
        setExternalEmails(prev => [...prev, trimmed]);
        setExternalInput("");
        setExternalError("");
    };

    const handleConfirm = () => {
        // Partner recipients are already associated via helper — only pass external emails
        onConfirmRecipients(externalEmails);
    };

    // ─── Render helpers ──────────────────────────────────────────────────────

    const renderChipsInSelect = (items: { key: string; label: string; onRemove: () => void }[], maxVisible: number = 1) => {
        if (items.length === 0) return <span className="to-popup-placeholder">Select...</span>;
        const visible = items.slice(0, maxVisible);
        const remaining = items.length - maxVisible;
        return (
            <div className="to-popup-chips-row">
                {visible.map(item => (
                    <span key={item.key} className="to-popup-chip">
                        {item.label}
                        <button className="to-popup-chip-remove" onClick={(e) => { e.stopPropagation(); item.onRemove(); }}>×</button>
                    </span>
                ))}
                {remaining > 0 && <span className="to-popup-chip-more">+ {remaining} More</span>}
            </div>
        );
    };

    // ─── JSX ─────────────────────────────────────────────────────────────────

    const selectedPartners = partners.filter(p => selectedPartnerIds.has(p.id));
    const selectedPRs = partnerRecipients.filter(pr => selectedPartnerRecipientIds.has(pr.id));

    return (
        <div className="to-popup-overlay" onClick={onClose}>
            <div className="to-popup-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="to-popup-header">
                    <h2>Cc :</h2>
                    <button className="to-popup-close" onClick={onClose}>×</button>
                </div>

                {/* Partners Section */}
                <div className="to-popup-section">
                    <label className="to-popup-label">Partners</label>
                    <div className="to-popup-multi-select" onClick={() => setPartnersDropdownOpen(!partnersDropdownOpen)}>
                        {renderChipsInSelect(
                            selectedPartners.map(p => ({
                                key: p.id,
                                label: p.caption,
                                onRemove: () => removePartnerChip(p)
                            }))
                        )}
                        <span className="to-popup-chevron">▾</span>
                    </div>
                    {partnersDropdownOpen && (
                        <div className="to-popup-dropdown">
                            {partners.map(p => (
                                <div key={p.id} className="to-popup-dropdown-item" onClick={(e) => { e.stopPropagation(); togglePartner(p); }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPartnerIds.has(p.id)}
                                        readOnly
                                    />
                                    <span>{p.caption}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info banner */}
                <div className="to-popup-info-banner">
                    <span className="to-popup-info-icon">ⓘ</span>
                    Partner recipients are shown based on the selected partners.
                </div>

                {/* Partner Recipients Section */}
                <div className="to-popup-section">
                    <label className="to-popup-label">Partner Recipients</label>
                    <div
                        className={`to-popup-multi-select ${partnerRecipients.length === 0 ? "disabled" : ""}`}
                        onClick={() => partnerRecipients.length > 0 && setPartnerRecipientsDropdownOpen(!partnerRecipientsDropdownOpen)}
                    >
                        {partnerRecipients.length === 0 ? (
                            <span className="to-popup-placeholder">Select partners first...</span>
                        ) : (
                            renderChipsInSelect(
                                selectedPRs.map(pr => ({
                                    key: pr.id,
                                    label: pr.caption,
                                    onRemove: () => removePartnerRecipientChip(pr)
                                }))
                            )
                        )}
                        <span className="to-popup-chevron">▾</span>
                    </div>
                </div>

                {/* Select Recipients — inline searchable list (per Figma) */}
                {partnerRecipientsDropdownOpen && partnerRecipients.length > 0 && (
                    <div className="cc-popup-select-recipients">
                        <div className="cc-popup-select-header">
                            <span className="cc-popup-select-title">Select Recipients</span>
                            <span className="cc-popup-select-count">{selectedPartnerRecipientIds.size} SELECTED</span>
                        </div>
                        <div className="cc-popup-search-box">
                            <input
                                type="text"
                                className="cc-popup-search-input"
                                placeholder="Search recipients..."
                                value={recipientSearch}
                                onChange={e => setRecipientSearch(e.target.value)}
                            />
                            {recipientSearch && (
                                <button className="cc-popup-search-clear" onClick={() => setRecipientSearch("")}>×</button>
                            )}
                        </div>
                        <div className="cc-popup-recipient-list">
                            {filteredRecipients.map(pr => (
                                <div key={pr.id} className="cc-popup-recipient-item" onClick={(e) => { e.stopPropagation(); togglePartnerRecipient(pr); }}>
                                    <div className="cc-popup-recipient-info">
                                        <span className="cc-popup-recipient-email">{pr.caption}</span>
                                        {pr.subtitle && (
                                            <span className="cc-popup-recipient-subtitle">{pr.subtitle}</span>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedPartnerRecipientIds.has(pr.id)}
                                        readOnly
                                    />
                                </div>
                            ))}
                            {filteredRecipients.length === 0 && (
                                <div className="cc-popup-no-results">No recipients found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* External Emails Section */}
                <div className="to-popup-section">
                    <label className="to-popup-label">External Emails</label>
                    <div className="to-popup-external-area">
                        {externalEmails.length > 0 && (
                            <div className="to-popup-external-chips">
                                {externalEmails.map(email => (
                                    <span key={email} className="to-popup-chip-external">
                                        {email}
                                        <button className="to-popup-chip-remove" onClick={() => removeExternalChip(email)}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <input
                            type="text"
                            className="to-popup-external-input"
                            placeholder="Type an email address and press Enter or comma"
                            value={externalInput}
                            onChange={e => { setExternalInput(e.target.value); setExternalError(""); }}
                            onKeyDown={handleExternalKeyDown}
                            onBlur={addExternalEmail}
                        />
                    </div>
                    {externalError && <span className="to-popup-external-error">{externalError}</span>}
                    <div className="to-popup-external-hint">
                        <span className="to-popup-info-icon">ⓘ</span>
                        Type an email address and press Enter or comma
                    </div>
                </div>

                {/* Add Partnership Email to CC Toggle */}
                <div className="cc-popup-toggle-row">
                    <div
                        className={`cc-popup-toggle-switch ${partnershipEmailEnabled ? "active" : ""}`}
                        onClick={() => onPartnershipEmailToggle?.(!partnershipEmailEnabled)}
                    >
                        <div className="cc-popup-toggle-knob" />
                    </div>
                    <div className="cc-popup-toggle-content">
                        <span className="cc-popup-toggle-label">Add Partnership Email to CC</span>
                        <span className="cc-popup-toggle-desc">When enabled, the partnership email address will be automatically included in CC</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="to-popup-actions">
                    <button className="to-popup-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="to-popup-btn-ok" onClick={handleConfirm}>Save</button>
                </div>
            </div>
        </div>
    );
}
