import { ReactElement, createElement } from "react";
import { EmailManagerPreviewProps } from "../typings/EmailManagerProps";

export function preview(_props: EmailManagerPreviewProps): ReactElement {
    return (
        <div className="widget-email-manager preview-mode" style={{ padding: 16, border: "1px dashed #ccc", borderRadius: 8, textAlign: "center", color: "#687c97" }}>
            <p><strong>Email Manager</strong></p>
            <p>Configure data source and attributes in the widget properties.</p>
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/EmailManager.css");
}
