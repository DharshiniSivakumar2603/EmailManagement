/**
 * This file was generated from EmailManager.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue, ListValue, ListActionValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export interface EmailManagerContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    emailList?: ListValue;
    subjectAttribute?: ListAttributeValue<string>;
    senderAttribute?: ListAttributeValue<string>;
    dateAttribute?: ListAttributeValue<Date>;
    snippetAttribute?: ListAttributeValue<string>;
    bodyAttribute?: ListAttributeValue<string>;
    isReadAttribute?: ListAttributeValue<boolean>;
    groupCategoryAttribute?: ListAttributeValue<string>;
    toAttribute?: ListAttributeValue<string>;
    ccAttribute?: ListAttributeValue<string>;
    folderAttribute?: ListAttributeValue<string>;
    draftTo?: EditableValue<string>;
    draftCc?: EditableValue<string>;
    draftSubject?: EditableValue<string>;
    draftBody?: EditableValue<string>;
    attachmentList?: ListValue;
    attachmentNameAttribute?: ListAttributeValue<string>;
    attachmentSizeAttribute?: ListAttributeValue<Big>;
    onDownloadAttachmentAction?: ListActionValue;
    onDownloadAllAttachmentsAction?: ActionValue;
    onAttachFileAction?: ActionValue;
    onFetchEmailsAction?: ActionValue;
    onCreateNewAction?: ActionValue;
    onReplyAction?: ActionValue;
    onSendAction?: ActionValue;
    onSaveDraftAction?: ActionValue;
    onEmailSelectAction?: ListActionValue;
}

export interface EmailManagerPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    emailList: {} | { caption: string } | { type: string } | null;
    subjectAttribute: string;
    senderAttribute: string;
    dateAttribute: string;
    snippetAttribute: string;
    bodyAttribute: string;
    isReadAttribute: string;
    groupCategoryAttribute: string;
    toAttribute: string;
    ccAttribute: string;
    folderAttribute: string;
    draftTo: string;
    draftCc: string;
    draftSubject: string;
    draftBody: string;
    attachmentList: {} | { caption: string } | { type: string } | null;
    attachmentNameAttribute: string;
    attachmentSizeAttribute: string;
    onDownloadAttachmentAction: {} | null;
    onDownloadAllAttachmentsAction: {} | null;
    onAttachFileAction: {} | null;
    onFetchEmailsAction: {} | null;
    onCreateNewAction: {} | null;
    onReplyAction: {} | null;
    onSendAction: {} | null;
    onSaveDraftAction: {} | null;
    onEmailSelectAction: {} | null;
}
