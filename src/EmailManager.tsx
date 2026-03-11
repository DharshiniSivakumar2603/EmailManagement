import { ReactElement, createElement, useState, useMemo, useEffect, useRef } from "react";
import { ObjectItem } from "mendix";
import { Sidebar, EmailInfo } from "./components/Sidebar";
import { EmailDetail, AttachmentInfo } from "./components/EmailDetail";
import { ComposeEditor } from "./components/ComposeEditor";
import { CcPopupListItem } from "./components/CcRecipientPopup";
import { EmailManagerContainerProps } from "../typings/EmailManagerProps";

import "./ui/EmailManager.css";

/** Plain object representing a partner / recipient for the To popup */
export interface PopupListItem {
    id: string;
    caption: string;
    originalItem: ObjectItem;
}

enum ViewMode {
    INBOX = "INBOX",
    REPLY = "REPLY",
    COMPOSE = "COMPOSE"
}

export function EmailManager(props: EmailManagerContainerProps): ReactElement {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.INBOX);
    const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
    const hasFetchedRef = useRef(false);

    // Helper to trigger email list refresh
    const triggerFetch = () => {
        if (props.onFetchEmailsAction && props.onFetchEmailsAction.canExecute) {
            props.onFetchEmailsAction.execute();
        }
    };

    // Trigger fetch emails action on widget load
    useEffect(() => {
        if (!hasFetchedRef.current && props.onFetchEmailsAction && props.onFetchEmailsAction.canExecute) {
            hasFetchedRef.current = true;
            triggerFetch();
        }
    }, [props.onFetchEmailsAction]);

    // Live Mendix Data Source — maps datasource items to EmailInfo[]
    const emails: EmailInfo[] = useMemo(() => {
        if (props.emailList && props.emailList.items) {
            return props.emailList.items.map(item => ({
                id: item.id, // Mendix Object ID
                originalItem: item, // Keep reference for triggering actions
                subject: props.subjectAttribute ? props.subjectAttribute.get(item).value || "(No Subject)" : "(No Subject)",
                sender: props.senderAttribute ? props.senderAttribute.get(item).value || "Unknown" : "Unknown",
                date: props.dateAttribute ? props.dateAttribute.get(item).value || new Date() : new Date(),
                snippet: props.snippetAttribute ? props.snippetAttribute.get(item).value || "" : "",
                body: props.bodyAttribute ? props.bodyAttribute.get(item).value || "" : "",
                isRead: props.isReadAttribute ? (props.isReadAttribute.get(item).value ?? false) : true,
                groupCategory: props.groupCategoryAttribute ? props.groupCategoryAttribute.get(item).value || "Older" : "Inbox",
                to: props.toAttribute ? props.toAttribute.get(item).value || "" : "",
                cc: props.ccAttribute ? props.ccAttribute.get(item).value || "" : "",
                folder: props.folderAttribute ? props.folderAttribute.get(item).value || "Inbox" : "Inbox"
            }));
        }
        return [];
    }, [props.emailList, props.subjectAttribute, props.senderAttribute, props.dateAttribute, props.snippetAttribute, props.bodyAttribute, props.isReadAttribute, props.groupCategoryAttribute, props.toAttribute, props.ccAttribute, props.folderAttribute]);

    // Derive active email selection
    const selectedEmail = useMemo(() => {
        return emails.find(e => e.id === selectedEmailId) || emails[0];
    }, [emails, selectedEmailId]);

    // Map attachment datasource to AttachmentInfo[]
    const attachments: AttachmentInfo[] = useMemo(() => {
        console.log("[EmailManager] attachmentList datasource:", {
            exists: !!props.attachmentList,
            status: props.attachmentList?.status,
            itemCount: props.attachmentList?.items?.length ?? 0
        });
        if (props.attachmentList && props.attachmentList.items) {
            const mapped = props.attachmentList.items.map(item => ({
                id: item.id,
                originalItem: item,
                name: props.attachmentNameAttribute ? props.attachmentNameAttribute.get(item).value || "Attachment" : "Attachment",
                size: props.attachmentSizeAttribute ? Number(props.attachmentSizeAttribute.get(item).value) || 0 : 0
            }));
            console.log("[EmailManager] Mapped attachments:", mapped.map(a => ({ name: a.name, size: a.size })));
            return mapped;
        }
        return [];
    }, [props.attachmentList, props.attachmentNameAttribute, props.attachmentSizeAttribute]);

    // ─── To Popup datasource mappings ─────────────────────────────────────────
    const partners: PopupListItem[] = useMemo(() => {
        if (props.partnerList?.items) {
            return props.partnerList.items.map(item => ({
                id: item.id,
                caption: props.partnerCaptionAttr ? props.partnerCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.partnerList, props.partnerCaptionAttr]);

    const partnerRecipients: PopupListItem[] = useMemo(() => {
        if (props.partnerRecipientList?.items) {
            return props.partnerRecipientList.items.map(item => ({
                id: item.id,
                caption: props.partnerRecipientCaptionAttr ? props.partnerRecipientCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.partnerRecipientList, props.partnerRecipientCaptionAttr]);

    const khdaRecipients: PopupListItem[] = useMemo(() => {
        if (props.khdaRecipientList?.items) {
            return props.khdaRecipientList.items.map(item => ({
                id: item.id,
                caption: props.khdaRecipientCaptionAttr ? props.khdaRecipientCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.khdaRecipientList, props.khdaRecipientCaptionAttr]);

    // Build sets of selected partner/KHDA IDs from helper association datasources
    const selectedPartnerIds: Set<string> = useMemo(() => {
        if (props.selectedPartnerList?.items) {
            return new Set(props.selectedPartnerList.items.map(item => item.id));
        }
        return new Set<string>();
    }, [props.selectedPartnerList]);

    const selectedKhdaIds: Set<string> = useMemo(() => {
        if (props.selectedKhdaList?.items) {
            return new Set(props.selectedKhdaList.items.map(item => item.id));
        }
        return new Set<string>();
    }, [props.selectedKhdaList]);

    const selectedPartnerRecipientIds: Set<string> = useMemo(() => {
        if (props.selectedPartnerRecipientList?.items) {
            return new Set(props.selectedPartnerRecipientList.items.map(item => item.id));
        }
        return new Set<string>();
    }, [props.selectedPartnerRecipientList]);

    const selectedRecipients: PopupListItem[] = useMemo(() => {
        if (props.selectedRecipientList?.items) {
            return props.selectedRecipientList.items.map(item => ({
                id: item.id,
                caption: props.selectedRecipientCaptionAttr ? props.selectedRecipientCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.selectedRecipientList, props.selectedRecipientCaptionAttr]);

    // ─── CC Popup datasource mappings ──────────────────────────────────────────
    const ccPartners: PopupListItem[] = useMemo(() => {
        if (props.ccPartnerList?.items) {
            return props.ccPartnerList.items.map(item => ({
                id: item.id,
                caption: props.ccPartnerCaptionAttr ? props.ccPartnerCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.ccPartnerList, props.ccPartnerCaptionAttr]);

    const ccPartnerRecipients: CcPopupListItem[] = useMemo(() => {
        if (props.ccPartnerRecipientList?.items) {
            return props.ccPartnerRecipientList.items.map(item => ({
                id: item.id,
                caption: props.ccPartnerRecipientCaptionAttr ? props.ccPartnerRecipientCaptionAttr.get(item).value || "" : "",
                subtitle: props.ccPartnerRecipientSubtitleAttr ? props.ccPartnerRecipientSubtitleAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.ccPartnerRecipientList, props.ccPartnerRecipientCaptionAttr, props.ccPartnerRecipientSubtitleAttr]);

    const ccSelectedPartnerIds: Set<string> = useMemo(() => {
        if (props.ccSelectedPartnerList?.items) {
            return new Set(props.ccSelectedPartnerList.items.map(item => item.id));
        }
        return new Set<string>();
    }, [props.ccSelectedPartnerList]);

    const ccSelectedPartnerRecipientIds: Set<string> = useMemo(() => {
        if (props.ccSelectedPartnerRecipientList?.items) {
            return new Set(props.ccSelectedPartnerRecipientList.items.map(item => item.id));
        }
        return new Set<string>();
    }, [props.ccSelectedPartnerRecipientList]);

    const ccSelectedRecipients: PopupListItem[] = useMemo(() => {
        if (props.ccSelectedRecipientList?.items) {
            return props.ccSelectedRecipientList.items.map(item => ({
                id: item.id,
                caption: props.ccSelectedRecipientCaptionAttr ? props.ccSelectedRecipientCaptionAttr.get(item).value || "" : "",
                originalItem: item
            }));
        }
        return [];
    }, [props.ccSelectedRecipientList, props.ccSelectedRecipientCaptionAttr]);

    // Handler: partner checkbox toggled in popup
    const handlePartnerChange = (item: PopupListItem) => {
        console.log("[DEBUG] handlePartnerChange called for:", item.id, item.caption);
        console.log("[DEBUG] onPartnerChangeAction exists:", !!props.onPartnerChangeAction);
        if (props.onPartnerChangeAction) {
            const action = props.onPartnerChangeAction.get(item.originalItem);
            console.log("[DEBUG] action:", action);
            console.log("[DEBUG] canExecute:", action?.canExecute);
            if (action?.canExecute) {
                console.log("[DEBUG] executing action...");
                action.execute();
            }
        }
    };

    // Handler: remove a selected recipient token
    const handleRemoveRecipient = (item: PopupListItem) => {
        if (props.onRemoveRecipientAction) {
            const action = props.onRemoveRecipientAction.get(item.originalItem);
            if (action?.canExecute) action.execute();
        }
    };

    // Handler: partner recipient checkbox toggled in popup
    const handlePartnerRecipientChange = (item: PopupListItem) => {
        console.log("[DEBUG] handlePartnerRecipientChange called for:", item.id, item.caption);
        console.log("[DEBUG] onPartnerRecipientChangeAction exists:", !!props.onPartnerRecipientChangeAction);
        if (props.onPartnerRecipientChangeAction) {
            const action = props.onPartnerRecipientChangeAction.get(item.originalItem);
            console.log("[DEBUG] action:", action, "canExecute:", action?.canExecute);
            if (action?.canExecute) {
                console.log("[DEBUG] executing partner recipient change action...");
                action.execute();
            }
        } else {
            console.warn("[DEBUG] onPartnerRecipientChangeAction is NOT configured in widget properties!");
        }
    };

    // Handler: KHDA checkbox toggled in popup
    const handleKhdaChange = (item: PopupListItem) => {
        if (props.onKhdaChangeAction) {
            const action = props.onKhdaChangeAction.get(item.originalItem);
            if (action?.canExecute) action.execute();
        }
    };

    // Handler: confirm recipients from popup — only external emails now
    const handleConfirmRecipients = (externalEmails: string[]) => {
        if (props.draftExternalEmails) {
            props.draftExternalEmails.setValue(externalEmails.join(","));
        }
        if (props.onConfirmRecipientsAction?.canExecute) {
            props.onConfirmRecipientsAction.execute();
        }
    };

    // ─── CC Popup handlers ────────────────────────────────────────────────────
    const handleCcPartnerChange = (item: PopupListItem) => {
        if (props.onCcPartnerChangeAction) {
            const action = props.onCcPartnerChangeAction.get(item.originalItem);
            if (action?.canExecute) action.execute();
        }
    };

    const handleCcPartnerRecipientChange = (item: PopupListItem) => {
        if (props.onCcPartnerRecipientChangeAction) {
            const action = props.onCcPartnerRecipientChangeAction.get(item.originalItem);
            if (action?.canExecute) action.execute();
        }
    };

    const handleRemoveCcRecipient = (item: PopupListItem) => {
        if (props.onRemoveCcRecipientAction) {
            const action = props.onRemoveCcRecipientAction.get(item.originalItem);
            if (action?.canExecute) action.execute();
        }
    };

    const handleConfirmCcRecipients = (externalEmails: string[]) => {
        if (props.draftExternalCcEmails) {
            props.draftExternalCcEmails.setValue(externalEmails.join(","));
        }
        if (props.onConfirmCcRecipientsAction?.canExecute) {
            props.onConfirmCcRecipientsAction.execute();
        }
    };

    const handleCcPartnershipEmailToggle = (enabled: boolean) => {
        if (props.ccPartnershipEmailToggle) {
            props.ccPartnershipEmailToggle.setValue(enabled);
        }
    };

    // Handlers
    const handleSelectEmail = (email: EmailInfo) => {
        console.log("[EmailManager] handleSelectEmail called:", {
            emailId: email.id,
            subject: email.subject,
            folder: email.folder,
            hasOriginalItem: !!email.originalItem
        });

        setSelectedEmailId(email.id);

        // If it's a draft, open in compose mode with pre-populated fields
        if (email.folder === "Drafts") {
            if (props.draftTo) props.draftTo.setValue(email.to || "");
            if (props.draftCc) props.draftCc.setValue(email.cc || "");
            if (props.draftSubject) props.draftSubject.setValue(email.subject || "");
            if (props.draftBody) props.draftBody.setValue(email.body || "");
            setViewMode(ViewMode.COMPOSE);
        } else {
            setViewMode(ViewMode.INBOX);
        }

        // Execute Mendix Action for marking read or fetching detailed body if configured
        console.log("[EmailManager] onEmailSelectAction check:", {
            actionExists: !!props.onEmailSelectAction,
            originalItemExists: !!email.originalItem
        });

        if (props.onEmailSelectAction && email.originalItem) {
            const action = props.onEmailSelectAction.get(email.originalItem);
            console.log("[EmailManager] Action retrieved for item:", {
                actionObj: !!action,
                canExecute: action?.canExecute,
                isExecuting: action?.isExecuting
            });
            if (action && action.canExecute) {
                console.log("[EmailManager] Executing onEmailSelectAction NOW");
                action.execute();
            } else {
                console.warn("[EmailManager] Action cannot execute!", { canExecute: action?.canExecute });
            }
        } else {
            console.warn("[EmailManager] onEmailSelectAction NOT configured or no originalItem");
        }
    };

    const handleReply = () => {
        if (props.draftSubject && !props.draftSubject.readOnly && selectedEmail) {
            props.draftSubject.setValue(`Re: ${selectedEmail.subject}`);
        }

        // Push the original sender into the Draft To attribute
        if (props.draftTo && !props.draftTo.readOnly && selectedEmail) {
            props.draftTo.setValue(selectedEmail.sender);
        }

        setViewMode(ViewMode.REPLY);
    };

    const handleCreateNew = () => {
        // Call Mendix microflow to create the EmailMessage object first
        if (props.onCreateNewAction && props.onCreateNewAction.canExecute) {
            props.onCreateNewAction.execute();
        }
        // Clear draft fields for the new compose form
        if (props.draftSubject) props.draftSubject.setValue("");
        if (props.draftTo) props.draftTo.setValue("");
        if (props.draftCc) props.draftCc.setValue("");
        if (props.draftBody) props.draftBody.setValue("");
        setViewMode(ViewMode.COMPOSE);
    };

    const handleCancelCompose = () => {
        setViewMode(ViewMode.INBOX);
    };

    const handleAttachFile = () => {
        if (props.onAttachFileAction && props.onAttachFileAction.canExecute) {
            props.onAttachFileAction.execute();
        }
    };

    const handleDownloadAttachment = (attachment: AttachmentInfo) => {
        if (props.onDownloadAttachmentAction && attachment.originalItem) {
            const action = props.onDownloadAttachmentAction.get(attachment.originalItem);
            if (action && action.execute) {
                action.execute();
            }
        }
    };

    const handleDownloadAllAttachments = () => {
        if (props.onDownloadAllAttachmentsAction && props.onDownloadAllAttachmentsAction.canExecute) {
            props.onDownloadAllAttachmentsAction.execute();
        }
    };

    const handleSend = () => {
        if (props.onSendAction && props.onSendAction.canExecute) {
            props.onSendAction.execute();
        }
        // Re-fetch to update Sent Items tab
        setTimeout(() => triggerFetch(), 500);
        setViewMode(ViewMode.INBOX);
    };

    const handleSaveDraft = () => {
        if (props.onSaveDraftAction && props.onSaveDraftAction.canExecute) {
            props.onSaveDraftAction.execute();
        }
        // Re-fetch to update Drafts tab
        setTimeout(() => triggerFetch(), 500);
        setViewMode(ViewMode.INBOX);
    };

    const handleFieldChange = (field: "to" | "cc" | "subject" | "body", value: string) => {
        console.log(`[EmailManager] handleFieldChange: ${field} =`, value);
        switch (field) {
            case "to": if (props.draftTo) props.draftTo.setValue(value); break;
            case "cc": if (props.draftCc) props.draftCc.setValue(value); break;
            case "subject": if (props.draftSubject) props.draftSubject.setValue(value); break;
            case "body": if (props.draftBody) props.draftBody.setValue(value); break;
        }
    };

    // Render logic
    const renderContent = () => {
        const composeInitialData = {
            to: props.draftTo?.value,
            cc: props.draftCc?.value,
            subject: props.draftSubject?.value,
            body: props.draftBody?.value,
        };

        if (viewMode === ViewMode.COMPOSE) {
            return (
                <div style={{ padding: 20 }}>
                    <ComposeEditor
                        isReply={false}
                        initialData={composeInitialData}
                        onFieldChange={handleFieldChange}
                        onCancel={handleCancelCompose}
                        onSaveDraft={handleSaveDraft}
                        onSend={handleSend}
                        onAttachFile={props.onAttachFileAction ? handleAttachFile : undefined}
                        attachments={attachments}
                        partners={partners}
                        partnerRecipients={partnerRecipients}
                        khdaRecipients={khdaRecipients}
                        selectedRecipients={selectedRecipients}
                        selectedPartnerIds={selectedPartnerIds}
                        selectedPartnerRecipientIds={selectedPartnerRecipientIds}
                        selectedKhdaIds={selectedKhdaIds}
                        onPartnerChange={handlePartnerChange}
                        onPartnerRecipientChange={handlePartnerRecipientChange}
                        onKhdaChange={handleKhdaChange}
                        onRemoveRecipient={handleRemoveRecipient}
                        onConfirmRecipients={handleConfirmRecipients}
                        ccPartners={ccPartners}
                        ccPartnerRecipients={ccPartnerRecipients}
                        ccSelectedPartnerIds={ccSelectedPartnerIds}
                        ccSelectedPartnerRecipientIds={ccSelectedPartnerRecipientIds}
                        ccSelectedRecipients={ccSelectedRecipients}
                        onCcPartnerChange={handleCcPartnerChange}
                        onCcPartnerRecipientChange={handleCcPartnerRecipientChange}
                        onRemoveCcRecipient={handleRemoveCcRecipient}
                        onConfirmCcRecipients={handleConfirmCcRecipients}
                        ccPartnershipEmailEnabled={props.ccPartnershipEmailToggle?.value ?? false}
                        onCcPartnershipEmailToggle={handleCcPartnershipEmailToggle}
                    />
                </div>
            );
        }

        return (
            <div className="email-container">
                <Sidebar
                    emails={emails}
                    selectedId={selectedEmail?.id}
                    onSelect={handleSelectEmail}
                    onCreateNewClick={handleCreateNew}
                    onRefreshClick={triggerFetch}
                />

                {viewMode === ViewMode.INBOX ? (
                    selectedEmail ? (
                        <EmailDetail
                            email={selectedEmail}
                            attachments={attachments}
                            onReply={handleReply}
                            onForward={handleReply}
                            onDownloadAttachment={handleDownloadAttachment}
                            onDownloadAllAttachments={handleDownloadAllAttachments}
                        />
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#687c97' }}>
                            <p>Select an email to view</p>
                        </div>
                    )
                ) : null}

                {viewMode === ViewMode.REPLY && selectedEmail && (
                    <ComposeEditor
                        isReply={true}
                        initialData={composeInitialData}
                        replyOriginalBody={selectedEmail.body}
                        replyOriginalSender={selectedEmail.sender}
                        onFieldChange={handleFieldChange}
                        onCancel={handleCancelCompose}
                        onSaveDraft={handleSaveDraft}
                        onSend={handleSend}
                        onAttachFile={props.onAttachFileAction ? handleAttachFile : undefined}
                        attachments={attachments}
                        partners={partners}
                        partnerRecipients={partnerRecipients}
                        khdaRecipients={khdaRecipients}
                        selectedRecipients={selectedRecipients}
                        selectedPartnerIds={selectedPartnerIds}
                        selectedPartnerRecipientIds={selectedPartnerRecipientIds}
                        selectedKhdaIds={selectedKhdaIds}
                        onPartnerChange={handlePartnerChange}
                        onPartnerRecipientChange={handlePartnerRecipientChange}
                        onKhdaChange={handleKhdaChange}
                        onRemoveRecipient={handleRemoveRecipient}
                        onConfirmRecipients={handleConfirmRecipients}
                        ccPartners={ccPartners}
                        ccPartnerRecipients={ccPartnerRecipients}
                        ccSelectedPartnerIds={ccSelectedPartnerIds}
                        ccSelectedPartnerRecipientIds={ccSelectedPartnerRecipientIds}
                        ccSelectedRecipients={ccSelectedRecipients}
                        onCcPartnerChange={handleCcPartnerChange}
                        onCcPartnerRecipientChange={handleCcPartnerRecipientChange}
                        onRemoveCcRecipient={handleRemoveCcRecipient}
                        onConfirmCcRecipients={handleConfirmCcRecipients}
                        ccPartnershipEmailEnabled={props.ccPartnershipEmailToggle?.value ?? false}
                        onCcPartnershipEmailToggle={handleCcPartnershipEmailToggle}
                    />
                )}
            </div>
        );
    };

    return (
        <div className={`widget-email-manager ${props.class || ""}`} style={props.style}>
            {renderContent()}
        </div>
    );
}

//sample