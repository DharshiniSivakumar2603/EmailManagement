import { ReactElement, createElement, useState, useEffect, useMemo } from "react";
import { PopupListItem } from "../EmailManager";

// ─── Email Validation ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Component Props ─────────────────────────────────────────────────────────

interface ToRecipientPopupProps {
    isOpen: boolean;
    onClose: () => void;
    // Mendix-driven data
    partners: PopupListItem[];
    partnerRecipients: PopupListItem[];   // filtered by Mendix based on selected partners
    khdaRecipients: PopupListItem[];
    // Mendix-driven selection state (from helper associations)
    selectedPartnerIds: Set<string>;
    selectedKhdaIds: Set<string>;
    // Handlers
    onPartnerChange?: (item: PopupListItem) => void;
    onKhdaChange?: (item: PopupListItem) => void;
    onConfirmRecipients: (selectedIds: string[], externalEmails: string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ToRecipientPopup({
    isOpen,
    onClose,
    partners,
    partnerRecipients,
    khdaRecipients,
    selectedPartnerIds,
    selectedKhdaIds,
    onPartnerChange,
    onKhdaChange,
    onConfirmRecipients
}: ToRecipientPopupProps): ReactElement | null {

    // Partner & KHDA selection state is driven by Mendix (via helper associations)
    // Only partner recipients selection and external emails are local React state
    const [selectedPartnerRecipientIds, setSelectedPartnerRecipientIds] = useState<Set<string>>(new Set());
    const [externalEmails, setExternalEmails] = useState<string[]>([]);
    const [externalInput, setExternalInput] = useState("");
    const [externalError, setExternalError] = useState("");

    // Dropdown open states
    const [partnersDropdownOpen, setPartnersDropdownOpen] = useState(false);
    const [partnerRecipientsDropdownOpen, setPartnerRecipientsDropdownOpen] = useState(false);
    const [khdaDropdownOpen, setKhdaDropdownOpen] = useState(false);

    // Reset local state when popup opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPartnerRecipientIds(new Set());
            setExternalEmails([]);
            setExternalInput("");
            setExternalError("");
            setPartnersDropdownOpen(false);
            setPartnerRecipientsDropdownOpen(false);
            setKhdaDropdownOpen(false);
        }
    }, [isOpen]);

    // When partner recipients list changes (Mendix re-filtered), clean up stale selections
    const partnerRecipientIdSet = useMemo(() => new Set(partnerRecipients.map(pr => pr.id)), [partnerRecipients]);
    useEffect(() => {
        setSelectedPartnerRecipientIds(prev => {
            const next = new Set<string>();
            prev.forEach(id => { if (partnerRecipientIdSet.has(id)) next.add(id); });
            return next.size !== prev.size ? next : prev;
        });
    }, [partnerRecipientIdSet]);

    if (!isOpen) return null;

    // ─── Handlers ────────────────────────────────────────────────────────────

    const togglePartner = (item: PopupListItem) => {
        // Mendix handles the association toggle via onPartnerChange
        onPartnerChange?.(item);
    };

    const togglePartnerRecipient = (id: string) => {
        setSelectedPartnerRecipientIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });
    };

    const toggleKhda = (item: PopupListItem) => {
        // Mendix handles the association toggle via onKhdaChange
        onKhdaChange?.(item);
    };

    const removePartnerChip = (item: PopupListItem) => {
        // Deselect = same as toggle
        onPartnerChange?.(item);
    };

    const removePartnerRecipientChip = (id: string) => {
        setSelectedPartnerRecipientIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const removeKhdaChip = (item: PopupListItem) => {
        // Deselect = same as toggle
        onKhdaChange?.(item);
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
        // Collect all selected Mendix object IDs (partner recipients + KHDA from helper)
        const allSelectedIds = [
            ...Array.from(selectedPartnerRecipientIds),
            ...Array.from(selectedKhdaIds)
        ];
        onConfirmRecipients(allSelectedIds, externalEmails);
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
    const selectedKhdas = khdaRecipients.filter(k => selectedKhdaIds.has(k.id));

    return (
        <div className="to-popup-overlay" onClick={onClose}>
            <div className="to-popup-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="to-popup-header">
                    <h2>To :</h2>
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
                                <label key={p.id} className="to-popup-dropdown-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPartnerIds.has(p.id)}
                                        onChange={() => togglePartner(p)}
                                    />
                                    <span>{p.caption}</span>
                                </label>
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
                                    onRemove: () => removePartnerRecipientChip(pr.id)
                                }))
                            )
                        )}
                        <span className="to-popup-chevron">▾</span>
                    </div>
                    {partnerRecipientsDropdownOpen && partnerRecipients.length > 0 && (
                        <div className="to-popup-dropdown">
                            {partnerRecipients.map(pr => (
                                <label key={pr.id} className="to-popup-dropdown-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPartnerRecipientIds.has(pr.id)}
                                        onChange={() => togglePartnerRecipient(pr.id)}
                                    />
                                    <span>{pr.caption}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* KHDA Recipients Section */}
                <div className="to-popup-section">
                    <label className="to-popup-label">KHDA Recipients</label>
                    <div className="to-popup-multi-select" onClick={() => setKhdaDropdownOpen(!khdaDropdownOpen)}>
                        {renderChipsInSelect(
                            selectedKhdas.map(k => ({
                                key: k.id,
                                label: k.caption,
                                onRemove: () => removeKhdaChip(k)
                            }))
                        )}
                        <span className="to-popup-chevron">▾</span>
                    </div>
                    {khdaDropdownOpen && (
                        <div className="to-popup-dropdown">
                            {khdaRecipients.map(k => (
                                <label key={k.id} className="to-popup-dropdown-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedKhdaIds.has(k.id)}
                                        onChange={() => toggleKhda(k)}
                                    />
                                    <span>{k.caption}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

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

                {/* Actions */}
                <div className="to-popup-actions">
                    <button className="to-popup-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="to-popup-btn-ok" onClick={handleConfirm}>OK</button>
                </div>
            </div>
        </div>
    );
}
