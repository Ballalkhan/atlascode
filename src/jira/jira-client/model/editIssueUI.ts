import { DetailedSiteInfo, emptySiteInfo } from "../../../atlclients/authInfo";
import { MinimalIssue } from "./entities";
import { FieldTransformerResult } from "./fieldUI";

export interface EditIssueUI extends FieldTransformerResult {
    key: string;
    id: string;
    self: string;
    siteDetails: DetailedSiteInfo;
    isEpic: boolean;
    epicChildren: MinimalIssue[];
}

export const emptyEditIssueUI: EditIssueUI = {
    key: "",
    id: "",
    self: "",
    siteDetails: emptySiteInfo,
    isEpic: false,
    epicChildren: [],
    fields: {},
    fieldValues: {},
    nonRenderableFields: [],
    hasRequiredNonRenderables: false,
};