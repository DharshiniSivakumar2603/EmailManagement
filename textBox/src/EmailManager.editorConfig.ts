import { EmailManagerPreviewProps } from "../typings/EmailManagerProps";

export type Platform = "web" | "desktop";

export function getProperties(
  _values: EmailManagerPreviewProps,
  defaultProperties: any // Properties type is complex, using any for mockup
): any {
  return defaultProperties;
}
